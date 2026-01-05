import { Op, QueryTypes, Sequelize } from "sequelize";
import { initOrgSequelize } from "../../config/orgDataSource";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { HttpStatus, MAIN_SCHEMA_NAME, rawQueries, STATUS_MESSAGE } from "../../utils/constants";
import { TaskSummary } from "../../models/taskSummary";
import SchemaService from "../schemaService";
import { Logger } from "winston";
import ProjectIngestionService from "../projectIngestionService";
import { ResourceService } from "../resourceServices";
import ResourceCostService from "../resourceCostService";
import ResourceSkillService from "../resourceSkillService";
import moment from "moment";
import {
  IFetchTaskDetailsInput, TaskCardResponse, taskWorkFlowConnector,
  TagsTypes, taskTags, ChecklistItems
} from "../../utils/types";
import { taskCardDetails, taskCardDetailsActivityTask } from "../../utils/rawQueries";
import { isValidTimezone } from "../../utils/valideTimeChecker";
import { EnrichedTask } from "../interfaces/interface";
import { ProjectTaskService } from "../projectTaskService";
import { raw, response } from "express";

export class TaskService {
  private logger: Logger;
  private schemaService: SchemaService;
  private projectIngestionService: ProjectIngestionService;
  private resourceService: ResourceService;
  private resourceCostService: ResourceCostService;
  private resourceSkillService: ResourceSkillService;
  private projectTaskService: ProjectTaskService
  private mainDbSequelize: Sequelize | null = null
  private orgDbSequelize: Sequelize | null = null

  constructor(logger: Logger) {
    this.logger = logger;
    this.schemaService = new SchemaService();
    this.projectIngestionService = new ProjectIngestionService(logger);
    this.resourceService = new ResourceService();
    this.resourceCostService = new ResourceCostService();
    this.resourceSkillService = new ResourceSkillService();
    this.projectTaskService = new ProjectTaskService(logger);
  }

  async fetchMainDb() {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await initMainDbSequelize()
    }
    return this.mainDbSequelize;
  }

  async fetchOrgDb() {
    if (!this.orgDbSequelize) {
      this.orgDbSequelize = await initOrgSequelize()
    }
    return this.orgDbSequelize
  }

  async getTaskSummary(
    userId: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
    filters: Record<string, any> = {},
    globalFilters: Record<string, any> = {},
    sortBy: string = 'created_datetime',
    sortOrder: string = 'DESC',
    fiscalYear: number = 0,
    flag: string = ''
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { tasks: any[]; totalCount: number };
  }> {
    try {
      const mainSequelize = await initMainDbSequelize();
      if (!mainSequelize) throw new Error("Failed to initialize main DB connection");

      const TaskSummaryModel = TaskSummary.initialize(mainSequelize);
      const userGroupType = await this.schemaService.getUserGroupType(userId);
      const isCustomGlobal = userGroupType === "DEFAULT";
      let accessibleAccountIds: string[] = [];

      if (!isCustomGlobal) {
        const accessibleAccounts = await this.schemaService.getAccessibleAccountInfo(userId);
        accessibleAccountIds = accessibleAccounts.map((acc) => acc.id);

        // If user has no accessible accounts, return empty response
        if (accessibleAccountIds.length === 0) {
          return {
            statusCode: HttpStatus.SUCCESS,
            message: HttpStatus.SUCCESS_MESSAGE,
            data: {
              tasks: [],
              totalCount: 0,
            },
          };
        }
      }

      // Extract specific filters
      let assignedToFilter, createdByFilter, modifiedByFilter, taskNameFilter, statusFilter, priorityFilter, attachToFilter, accountNameFilter, accountStatusFilter;

      if (filters.assigned_to_name) {
        assignedToFilter = filters.assigned_to_name;
        delete filters.assigned_to_name;
      }
      if (filters.created_by_name) {
        createdByFilter = filters.created_by_name;
        delete filters.created_by_name;
      }
      if (filters.modified_by_name) {
        modifiedByFilter = filters.modified_by_name;
        delete filters.modified_by_name;
      }
      if (filters.task_name) {
        taskNameFilter = filters.task_name;
        delete filters.task_name;
      }
      if (filters.status_name) {
        statusFilter = filters.status_name;
        delete filters.status_name;
      }
      if (filters.priority_name) {
        priorityFilter = filters.priority_name;
        delete filters.priority_name;
      }
      if (filters.attach_to_name) {
        attachToFilter = filters.attach_to_name;
        delete filters.attach_to_name;
      }
      if (filters.account_name) {
        accountNameFilter = filters.account_name;
        delete filters.account_name;
      }
      if (filters.account_status_rid) {
        accountStatusFilter = filters.account_status_rid;
        delete filters.account_status_rid;
      }

      // Build where clause
      const { whereClause } = this.buildRawWhereClause(filters, search);
      if (typeof globalFilters === 'string') globalFilters = JSON.parse(globalFilters);
      whereClause[Op.and] = whereClause[Op.and] || [];

      if (flag === 'milestone') {
        const taskTypeRid = await mainSequelize.query(
          rawQueries.getTaskTypeRidMilestone,
          { replacements: {}, type: 'SELECT' }
        ) as any[];
        whereClause[Op.and].push({
          task_type_rid: taskTypeRid[0].rid
        })
      } else if (flag === 'activity') {
        const taskTypeRid = await mainSequelize.query(
          rawQueries.getTaskTypeRidActivity,
          { replacements: {}, type: 'SELECT' }
        ) as any[];
        whereClause[Op.and].push({
          task_type_rid: taskTypeRid[0].rid
        })
      }

      // Apply global filters (account-level access control)
      if (globalFilters && Object.keys(globalFilters).length > 0) {
        const parentAccountRid = Object.keys(globalFilters)[0];
        const childAccountRids = globalFilters[parentAccountRid];
        const filterAccounts = [...childAccountRids, parentAccountRid];

        // Intersect frontend filters with backend-accessible accounts
        if (!isCustomGlobal) {
          const validAccounts = filterAccounts.filter((rid) =>
            accessibleAccountIds.includes(rid)
          );

          // No valid accounts → return early
          if (validAccounts.length === 0) {
            return {
              statusCode: HttpStatus.SUCCESS,
              message: HttpStatus.SUCCESS_MESSAGE,
              data: {
                tasks: [],
                totalCount: 0,
              },
            };
          }
          // Apply valid filtered accounts
          whereClause[Op.and].push({
            account_rid: { [Op.in]: validAccounts },
          });
        } else {
          // Apply valid filtered accounts
          whereClause[Op.and].push({
            account_rid: { [Op.in]: filterAccounts },
          });
        }
      } else {
        // No global filters — use all backend-accessible accounts
        if (!isCustomGlobal) {
          whereClause[Op.and].push({
            account_rid: { [Op.in]: accessibleAccountIds },
          });
        }
      }

      // Apply fiscal year filter
      if (fiscalYear !== 0) {
        whereClause[Op.and].push({ fiscal_year: fiscalYear });
      }

      // Fetch task summaries from database
      const tasksRaw = await TaskSummaryModel.findAll({ where: whereClause });

      // Get related account information
      const accountRids = [...new Set(tasksRaw.map(task => task.account_rid))];
      const accounts = await this.schemaService.fetchAccountsByIds(accountRids);
      const accountMap = new Map(accounts.map((a: any) => [a.rid, a]));

      // Fetch account status
      const accountStatus = await this.schemaService.fetchAccountsWithStatusByIds(accountRids);
      const accountStatusMap = new Map(accountStatus.map((a: any) => [a.rid, a]));

      // Get schema numbers for accounts
      const schemaNumberMap = new Map<string, string>();
      await Promise.all(
        accounts.map(async (account) => {
          const acc = account as { rid: string; storage_type: string; r_number: string; parent_account_rid: string };
          const { rid, storage_type, r_number, parent_account_rid } = acc;

          if (storage_type === "store_in_parent") {
            const parent = await this.schemaService.fetchParentAccount(parent_account_rid);
            schemaNumberMap.set(rid, parent);
          } else {
            schemaNumberMap.set(rid, r_number);
          }
        })
      );

      // Group attachments by schemaNumber
      const schemaAttachmentMap = new Map<string, any[]>();

      tasksRaw.forEach((att) => {
        const schemaNumber = schemaNumberMap.get(att.account_rid);
        if (!schemaNumber) return;

        if (!schemaAttachmentMap.has(schemaNumber)) {
          schemaAttachmentMap.set(schemaNumber, []);
        }
        schemaAttachmentMap.get(schemaNumber)!.push(att);
      });

      // Build attachment display names for each schemaNumber group
      const attachmentDisplayNames: Record<string, string> = {};

      const caseMap = new Map<string, string>();
      if (flag === 'milestone') {
        // Fetch resources for each schema number
        await Promise.all(
          Array.from(schemaAttachmentMap.entries()).map(async ([schemaNumber, attachments]) => {
            try {
              const schemaName = `${MAIN_SCHEMA_NAME}_${schemaNumber.replace(
                /\D/g,
                ""
              )}`;
              // Get unique RIDs for this schema
              const uniqueRids = [...new Set(attachments.map((t: any) => t.attach_to))];

              if (uniqueRids.length > 0) {
                // Fetch from org database using schema number
                const orgDb = await this.fetchOrgDb();
                const casesForSchema = await orgDb.query(
                  `SELECT rid, case_name FROM ${schemaName}.cases WHERE rid IN (:caseRids)`,
                  { replacements: { caseRids: uniqueRids }, type: 'SELECT' }
                );

                // Add to resource map
                casesForSchema.forEach((r: any) => {
                  caseMap.set(r.rid, r.case_name);
                });
              }
            } catch (error) {
              console.error(`Error fetching resources for schema ${schemaNumber}:`, error);
            }
          })
        );
      }
      else {
        await Promise.all(
          Array.from(schemaAttachmentMap.entries()).map(async ([schemaNumber, attachments]) => {
            const { displayNames, parentRid, currencyRid } = await this.getAttachmentDisplayNames(attachments, schemaNumber);
            Object.assign(attachmentDisplayNames, displayNames);
          })
        );
      }

      // Get related resources (status, priority, assigned to)
      const resourceRids = [
        ...new Set(tasksRaw.flatMap(task => [
          task.assigned_to
        ]))
      ];

      const resourceMap = new Map<string, string>();

      if (resourceRids.length > 0) {
        // Group resource RIDs by schema number
        const resourceRidsBySchema = new Map<string, string[]>();

        tasksRaw.forEach(task => {
          const schemaNumber = schemaNumberMap.get(task.account_rid);
          if (!schemaNumber) return;

          [task.assigned_to].forEach(resourceRid => {
            if (resourceRid) {
              if (!resourceRidsBySchema.has(schemaNumber)) {
                resourceRidsBySchema.set(schemaNumber, []);
              }
              resourceRidsBySchema.get(schemaNumber)!.push(resourceRid);
            }
          });
        });

        // Fetch resources for each schema number
        await Promise.all(
          Array.from(resourceRidsBySchema.entries()).map(async ([schemaNumber, rids]) => {
            try {
              const schemaName = `${MAIN_SCHEMA_NAME}_${schemaNumber.replace(
                /\D/g,
                ""
              )}`;
              // Get unique RIDs for this schema
              const uniqueRids = [...new Set(rids)];

              // Fetch from org database using schema number
              const orgDb = await this.fetchOrgDb();
              const resourcesForSchema = await orgDb.query(
                `SELECT rid, resource_name FROM ${schemaName}.resources WHERE rid IN (:resourceRids)`,
                { replacements: { resourceRids: uniqueRids }, type: 'SELECT' }
              );

              // Add to resource map
              resourcesForSchema.forEach((r: any) => {
                resourceMap.set(r.rid, r.resource_name);
              });
            } catch (error) {
              console.error(`Error fetching resources for schema ${schemaNumber}:`, error);
            }
          })
        );
      }

      // Get user names for created_by and modified_by
      const userIds = [...new Set(tasksRaw.flatMap(task => [task.created_by, task.modified_by, task.assigned_to]))];
      const users = userIds.length > 0
        ? await mainSequelize.query(
          rawQueries.fetchUsersByIds,
          { replacements: { userIds }, type: 'SELECT' }
        )
        : [];
      const userMap = new Map(users.map((u: any) => [u.rid, u.full_name]));

      // Get status names for  statuses
      const statusIds = [...new Set(tasksRaw.flatMap(task => [task.status_rid]))];
      const statuses = statusIds.length > 0
        ? await mainSequelize.query(
          rawQueries.getStatusNamesByIds,
          { replacements: { statusIds }, type: 'SELECT' }
        )
        : [];
      const statusMap = new Map(statuses.map((u: any) => [u.rid, u.status_name]));

      // Get priority names for priorities
      const priorityIds = [...new Set(tasksRaw.flatMap(task => [task.priority_rid]))];
      const priorities = priorityIds.length > 0
        ? await mainSequelize.query(
          rawQueries.getPriorityNamesByIds,
          { replacements: { priorityIds }, type: 'SELECT' }
        )
        : [];
      const priorityMap = new Map(priorities.map((u: any) => [u.rid, u.priority_name]));

      // Enrich task data
      let tasks = await Promise.all(tasksRaw.map(async task => {
        const taskData = task.get({ plain: true }) as EnrichedTask;
        const accountStatusInfo = accountStatusMap.get(task.account_rid);

        return {
          ...taskData,
          account_name: accountMap.get(task.account_rid)?.account_name || task.account_rid,
          r_number: taskData.r_number,
          task_name: taskData.task_name,
          description: taskData.description,
          fiscal_year: taskData.fiscal_year,
          created_by_name: userMap.get(task.created_by) || task.created_by,
          modified_by_name: userMap.get(task.modified_by) || task.modified_by,
          status_name: statusMap.get(task.status_rid) || task.status_rid,
          priority_name: priorityMap.get(task.priority_rid) || task.priority_rid,
          assigned_to_name: userMap.get(task.assigned_to) || task.assigned_to,
          account_status_rid: accountStatusInfo?.status_rid || null,
          account_status_name: accountStatusInfo?.status_name || null,
          effective_start_datetime: taskData.effective_start_datetime,
          effective_end_datetime: taskData.effective_end_datetime,
          attachment_level: taskData.attachment_level,
          attach_to_name: flag === 'milestone' ? (caseMap.get(taskData.attach_to) || taskData.attach_to) : (attachmentDisplayNames[taskData.rid] || taskData.attach_to),
          attach_to: taskData.attach_to,
          task_rid: taskData.task_rid
        };
      }));

      // Apply frontend filters
      if (assignedToFilter) {
        tasks = tasks.filter(task => {
          const displayName = (task.assigned_to_name || '').toLowerCase();
          const operator = Object.keys(assignedToFilter)[0];
          const filterValue = String(assignedToFilter[operator] || '').toLowerCase();
          switch (operator) {
            case 'contains': return displayName.includes(filterValue);
            case 'equals': return displayName === filterValue;
            case 'not_equals': return displayName !== filterValue || displayName === null;
            case 'is_empty': return displayName === null || displayName === ''
            default: return false;
          }
        });
      }
      if (attachToFilter) {
        tasks = tasks.filter(task => {
          const displayName = (task.attach_to_name || '').toLowerCase();
          const operator = Object.keys(attachToFilter)[0];
          const filterValue = String(attachToFilter[operator] || '').toLowerCase();
          switch (operator) {
            case 'contains': return displayName.includes(filterValue);
            case 'equals': return displayName === filterValue;
            case 'not_equals': return displayName !== filterValue || displayName === null;
            case 'is_empty': return displayName === null || displayName === ''
            default: return false;
          }
        });
      }
      if (accountNameFilter) {
        tasks = tasks.filter(task => {
          const displayName = (task.account_name || '').toLowerCase();
          const operator = Object.keys(accountNameFilter)[0];
          const filterValue = String(accountNameFilter[operator] || '').toLowerCase();
          switch (operator) {
            case 'contains': return displayName.includes(filterValue);
            case 'equals': return displayName === filterValue;
            case 'not_equals': return displayName !== filterValue || displayName === null;
            case 'is_empty': return displayName === null || displayName === ''
            default: return false;
          }
        });
      }
      if (accountStatusFilter) {
        tasks = tasks.filter(task => {
          const displayName = (task.account_status_rid || '').toLowerCase();
          const operator = Object.keys(accountStatusFilter)[0];

          if (operator === 'in') {
            const values = accountStatusFilter[operator];
            return Array.isArray(values) && values.some((v: any) => String(v).toLowerCase() === displayName);
          }

          const filterValue = String(accountStatusFilter[operator] || '').toLowerCase();
          switch (operator) {
            case 'contains': return displayName.includes(filterValue);
            case 'equals': return displayName === filterValue;
            case 'not_equals': return displayName !== filterValue || displayName === null;
            case 'is_empty': return displayName === null || displayName === ''
            default: return false;
          }
        });
      }
      if (taskNameFilter) {
        tasks = tasks.filter(task => {
          const taskName = (task.task_name || '').toLowerCase();
          const operator = Object.keys(taskNameFilter)[0];
          const filterValue = String(taskNameFilter[operator] || '').toLowerCase();
          switch (operator) {
            case 'contains': return taskName.includes(filterValue);
            case 'equals': return taskName === filterValue;
            case 'not_equals': return taskName !== filterValue;
            default: return false;
          }
        });
      }

      if (statusFilter) {
        tasks = tasks.filter(task => {
          const statusName = (task.status_name || '').toLowerCase();
          const operator = Object.keys(statusFilter)[0];
          const filterValue = String(statusFilter[operator] || '').toLowerCase();
          switch (operator) {
            case 'contains': return statusName.includes(filterValue);
            case 'equals': return statusName === filterValue;
            case 'not_equals': return statusName !== filterValue;
            default: return false;
          }
        });
      }

      if (priorityFilter) {
        tasks = tasks.filter(task => {
          const priorityName = (task.priority_name || '').toLowerCase();
          const operator = Object.keys(priorityFilter)[0];
          const filterValue = String(priorityFilter[operator] || '').toLowerCase();
          switch (operator) {
            case 'contains': return priorityName.includes(filterValue);
            case 'equals': return priorityName === filterValue;
            case 'not_equals': return priorityName !== filterValue;
            default: return false;
          }
        });
      }

      if (createdByFilter) {
        let filterValue;
        tasks = tasks.filter(task => {
          const createdByName = task.created_by_name?.toLowerCase() || '';
          const operator = Object.keys(createdByFilter)[0];
          if (operator === 'is_empty') filterValue = ''
          else filterValue = String(createdByFilter[operator] || '').toLowerCase();
          switch (operator) {
            case 'contains': return createdByName.includes(filterValue);
            case 'equals': return createdByName === filterValue;
            case 'not_equals': return createdByName !== filterValue;
            case 'is_empty': return createdByName === null || createdByName === ''
            default: return false;
          }
        });
      }

      if (modifiedByFilter) {
        let filterValue;
        tasks = tasks.filter(task => {
          const modifiedByName = task.modified_by_name?.toLowerCase() || '';
          const operator = Object.keys(modifiedByFilter)[0];
          if (operator === 'is_empty') filterValue = ''
          else filterValue = String(modifiedByFilter[operator] || '').toLowerCase();
          switch (operator) {
            case 'contains': return modifiedByName.includes(filterValue);
            case 'equals': return modifiedByName === filterValue;
            case 'not_equals': return modifiedByName !== filterValue
            case 'is_empty': return modifiedByName === null || modifiedByName === ''
            default: return false;
          }
        });
      }

      // Sorting logic
      const validSortFields = [
        'r_number', 'task_name', 'fiscal_year', 'assigned_to_name',
        'status_name', 'priority_name', 'created_by_name', 'created_datetime',
        'modified_by_name', 'modified_datetime', 'effective_start_datetime',
        'effective_end_datetime', 'description', 'attachment_level', 'attach_to_name', 'account_name'
      ];

      const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_datetime';
      const finalSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

      tasks.sort((a: any, b: any) => {
        // Handle date fields
        const dateFields = ['created_datetime', 'modified_datetime', 'effective_start_datetime', 'effective_end_datetime'];
        if (dateFields.includes(finalSortBy)) {
          const aDate = new Date(a[finalSortBy]).getTime();
          const bDate = new Date(b[finalSortBy]).getTime();
          return finalSortOrder === 'ASC' ? aDate - bDate : bDate - aDate;
        }

        let aVal: string = '';
        let bVal: string = '';

        switch (finalSortBy) {
          case 'assigned_to_name': aVal = a.assigned_to_name || ''; bVal = b.assigned_to_name || ''; break;
          case 'status_name': aVal = a.status_name || ''; bVal = b.status_name || ''; break;
          case 'priority_name': aVal = a.priority_name || ''; bVal = b.priority_name || ''; break;
          case 'created_by_name': aVal = a.created_by_name || ''; bVal = b.created_by_name || ''; break;
          case 'modified_by_name': aVal = a.modified_by_name || ''; bVal = b.modified_by_name || ''; break;
          case 'task_name': aVal = a.task_name || ''; bVal = b.task_name || ''; break;
          case 'description': aVal = a.description || ''; bVal = b.description || ''; break;
          case 'attachment_level': aVal = a.attachment_level || ''; bVal = b.attachment_level || ''; break;
          case 'attach_to_name': aVal = a.attach_to_name || ''; bVal = b.attach_to_name || ''; break;
          case 'account_name': aVal = a.account_name || ''; bVal = b.account_name || ''; break;
          default:
            aVal = a[finalSortBy] !== undefined && a[finalSortBy] !== null ? String(a[finalSortBy]) : '';
            bVal = b[finalSortBy] !== undefined && b[finalSortBy] !== null ? String(b[finalSortBy]) : '';
        }

        aVal = aVal.trim().toLowerCase();
        bVal = bVal.trim().toLowerCase();

        const isAEmpty = !aVal;
        const isBEmpty = !bVal;

        // Ascending: empty values last
        if (finalSortOrder === 'ASC') {
          if (isAEmpty && !isBEmpty) return 1;
          if (!isAEmpty && isBEmpty) return -1;
          return aVal.localeCompare(bVal);
        }

        // Descending: empty values first
        else {
          if (isAEmpty && !isBEmpty) return -1;
          if (!isAEmpty && isBEmpty) return 1;
          return bVal.localeCompare(aVal);
        }
      });

      // Pagination
      const paginatedTasks = tasks.slice((page - 1) * limit, page * limit);

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          tasks: paginatedTasks,
          totalCount: tasks.length
        }
      };

    } catch (error) {
      console.error("getTaskSummary error:", error);
      return {
        statusCode: 500,
        message: 'Failed to fetch task summary',
        errorMessage: error instanceof Error ? error.message : 'An unknown error occurred',
        data: { tasks: [], totalCount: 0 }
      };
    }
  }

  async exportTaskSummary(
    userId: string,
    search?: string,
    filters: Record<string, any> = {},
    globalFilters: Record<string, any> = {},
    sortBy: string = 'created_datetime',
    sortOrder: string = 'DESC',
    fiscalYear: number = 0,
    timezone: string = '',
    flag: string = ''
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { tasks: any[] };
  }> {
    try {
      const mainSequelize = await initMainDbSequelize();
      if (!mainSequelize) throw new Error("Failed to initialize main DB connection");

      const TaskSummaryModel = TaskSummary.initialize(mainSequelize);
      const userGroupType = await this.schemaService.getUserGroupType(userId);
      const isCustomGlobal = userGroupType === "DEFAULT";
      let accessibleAccountIds: string[] = [];

      if (!isCustomGlobal) {
        const accessibleAccounts = await this.schemaService.getAccessibleAccountInfo(userId);
        accessibleAccountIds = accessibleAccounts.map((acc) => acc.id);

        // If user has no accessible accounts, return empty response
        if (accessibleAccountIds.length === 0) {
          return {
            statusCode: HttpStatus.SUCCESS,
            message: HttpStatus.SUCCESS_MESSAGE,
            data: {
              tasks: []
            },
          };
        }
      }

      // Extract task-specific filters
      let assignedToFilter, createdByFilter, modifiedByFilter, taskNameFilter, statusFilter, priorityFilter, attachToFilter, accountNameFilter, accountStatusFilter;

      if (filters.assigned_to_name) {
        assignedToFilter = filters.assigned_to_name;
        delete filters.assigned_to_name;
      }
      if (filters.created_by_name) {
        createdByFilter = filters.created_by_name;
        delete filters.created_by_name;
      }
      if (filters.modified_by_name) {
        modifiedByFilter = filters.modified_by_name;
        delete filters.modified_by_name;
      }
      if (filters.task_name) {
        taskNameFilter = filters.task_name;
        delete filters.task_name;
      }
      if (filters.status_name) {
        statusFilter = filters.status_name;
        delete filters.status_name;
      }
      if (filters.priority_name) {
        priorityFilter = filters.priority_name;
        delete filters.priority_name;
      }
      if (filters.account_status_rid) {
        accountStatusFilter = filters.account_status_rid;
        delete filters.account_status_rid;
      }
      if (filters.attach_to_name) {
        attachToFilter = filters.attach_to_name;
        delete filters.attach_to_name;
      }
      if (filters.account_name) {
        accountNameFilter = filters.account_name;
        delete filters.account_name;
      }

      const { whereClause } = this.buildRawWhereClause(filters, search);
      if (typeof globalFilters === 'string') globalFilters = JSON.parse(globalFilters);

      whereClause[Op.and] = whereClause[Op.and] || [];

      if (globalFilters && Object.keys(globalFilters).length > 0) {
        const parentAccountRid = Object.keys(globalFilters)[0];
        const childAccountRids = globalFilters[parentAccountRid];
        const filterAccounts = [...childAccountRids, parentAccountRid];

        // Intersect frontend filters with backend-accessible accounts
        if (!isCustomGlobal) {
          const validAccounts = filterAccounts.filter((rid) =>
            accessibleAccountIds.includes(rid)
          );

          // No valid accounts → return early
          if (validAccounts.length === 0) {
            return {
              statusCode: HttpStatus.SUCCESS,
              message: HttpStatus.SUCCESS_MESSAGE,
              data: {
                tasks: []
              },
            };
          }
          // Apply valid filtered accounts
          whereClause[Op.and].push({
            account_rid: { [Op.in]: validAccounts },
          });
        } else {
          // Apply valid filtered accounts
          whereClause[Op.and].push({
            account_rid: { [Op.in]: filterAccounts },
          });
        }
      } else {
        // No global filters — use all backend-accessible accounts
        if (!isCustomGlobal) {
          whereClause[Op.and].push({
            account_rid: { [Op.in]: accessibleAccountIds },
          });
        }
      }

      if (fiscalYear !== 0) {
        whereClause[Op.and] = whereClause[Op.and] || [];
        whereClause[Op.and].push({ fiscal_year: fiscalYear });
      }

      if (flag === 'milestone') {
        const taskTypeRid = await mainSequelize.query(
          rawQueries.getTaskTypeRidMilestone,
          { replacements: {}, type: 'SELECT' }
        ) as any[];
        whereClause[Op.and].push({
          task_type_rid: taskTypeRid[0].rid
        })
      } else if (flag === 'activity') {
        const taskTypeRid = await mainSequelize.query(
          rawQueries.getTaskTypeRidActivity,
          { replacements: {}, type: 'SELECT' }
        ) as any[];
        whereClause[Op.and].push({
          task_type_rid: taskTypeRid[0].rid
        })
      }

      const tasksRaw = await TaskSummaryModel.findAll({ where: whereClause });

      // Get related account information
      const accountRids = [...new Set(tasksRaw.map(task => task.account_rid))];
      const accounts = await this.schemaService.fetchAccountsByIds(accountRids);
      const accountMap = new Map(accounts.map((a: any) => [a.rid, a]));

      // Fetch account status
      const accountStatus = await this.schemaService.fetchAccountsWithStatusByIds(accountRids);
      const accountStatusMap = new Map(accountStatus.map((a: any) => [a.rid, a]));

      // Get schema numbers for accounts
      const schemaNumberMap = new Map<string, string>();
      await Promise.all(
        accounts.map(async (account) => {
          const acc = account as { rid: string; storage_type: string; r_number: string; parent_account_rid: string };
          const { rid, storage_type, r_number, parent_account_rid } = acc;

          if (storage_type === "store_in_parent") {
            const parent = await this.schemaService.fetchParentAccount(parent_account_rid);
            schemaNumberMap.set(rid, parent);
          } else {
            schemaNumberMap.set(rid, r_number);
          }
        })
      );

      // Group attachments by schemaNumber
      const schemaAttachmentMap = new Map<string, any[]>();

      tasksRaw.forEach((att) => {
        const schemaNumber = schemaNumberMap.get(att.account_rid);
        if (!schemaNumber) return;

        if (!schemaAttachmentMap.has(schemaNumber)) {
          schemaAttachmentMap.set(schemaNumber, []);
        }
        schemaAttachmentMap.get(schemaNumber)!.push(att);
      });

      // Build attachment display names for each schemaNumber group
      const attachmentDisplayNames: Record<string, string> = {};

      const caseMap = new Map<string, string>();
      if (flag === 'milestone') {
        // Fetch resources for each schema number
        await Promise.all(
          Array.from(schemaAttachmentMap.entries()).map(async ([schemaNumber, attachments]) => {
            try {
              const schemaName = `${MAIN_SCHEMA_NAME}_${schemaNumber.replace(
                /\D/g,
                ""
              )}`;
              // Get unique RIDs for this schema
              const uniqueRids = [...new Set(attachments.map((t: any) => t.attach_to))];

              if (uniqueRids.length > 0) {
                // Fetch from org database using schema number
                const orgDb = await this.fetchOrgDb();
                const casesForSchema = await orgDb.query(
                  `SELECT rid, case_name FROM ${schemaName}.cases WHERE rid IN (:caseRids)`,
                  { replacements: { caseRids: uniqueRids }, type: 'SELECT' }
                );

                // Add to resource map
                casesForSchema.forEach((r: any) => {
                  caseMap.set(r.rid, r.case_name);
                });
              }
            } catch (error) {
              console.error(`Error fetching resources for schema ${schemaNumber}:`, error);
            }
          })
        );
      }
      else {
        await Promise.all(
          Array.from(schemaAttachmentMap.entries()).map(async ([schemaNumber, attachments]) => {
            const { displayNames, parentRid, currencyRid } = await this.getAttachmentDisplayNames(attachments, schemaNumber);
            Object.assign(attachmentDisplayNames, displayNames);
          })
        );
      }

      // Get related resources (status, priority, assigned to)
      const resourceRids = [
        ...new Set(tasksRaw.flatMap(task => [
          task.status_rid,
          task.priority_rid,
          task.assigned_to
        ]))
      ];

      const resourceMap = new Map<string, string>();

      if (resourceRids.length > 0) {
        // Group resource RIDs by schema number
        const resourceRidsBySchema = new Map<string, string[]>();

        tasksRaw.forEach(task => {
          const schemaNumber = schemaNumberMap.get(task.account_rid);
          if (!schemaNumber) return;

          [task.status_rid, task.priority_rid, task.assigned_to].forEach(resourceRid => {
            if (resourceRid) {
              if (!resourceRidsBySchema.has(schemaNumber)) {
                resourceRidsBySchema.set(schemaNumber, []);
              }
              resourceRidsBySchema.get(schemaNumber)!.push(resourceRid);
            }
          });
        });

        // Fetch resources for each schema number
        await Promise.all(
          Array.from(resourceRidsBySchema.entries()).map(async ([schemaNumber, rids]) => {
            try {
              const schemaName = `${MAIN_SCHEMA_NAME}_${schemaNumber.replace(
                /\D/g,
                ""
              )}`;
              // Get unique RIDs for this schema
              const uniqueRids = [...new Set(rids)];

              // Fetch from org database using schema number
              const orgDb = await this.fetchOrgDb();
              const resourcesForSchema = await orgDb.query(
                rawQueries.getResourceNamesByIds(schemaName),
                { replacements: { resourceRids: uniqueRids }, type: 'SELECT' }
              );

              // Add to resource map
              resourcesForSchema.forEach((r: any) => {
                resourceMap.set(r.rid, r.resource_name);
              });
            } catch (error) {
              console.error(`Error fetching resources for schema ${schemaNumber}:`, error);
            }
          })
        );
      }

      // Get status names for  statuses
      const statusIds = [...new Set(tasksRaw.flatMap(task => [task.status_rid]))];
      const statuses = statusIds.length > 0
        ? await mainSequelize.query(
          rawQueries.getStatusNamesByIds,
          { replacements: { statusIds }, type: 'SELECT' }
        )
        : [];
      const statusMap = new Map(statuses.map((u: any) => [u.rid, u.status_name]));

      // Get priority names for priorities
      const priorityIds = [...new Set(tasksRaw.flatMap(task => [task.priority_rid]))];
      const priorities = priorityIds.length > 0
        ? await mainSequelize.query(
          rawQueries.getPriorityNamesByIds,
          { replacements: { priorityIds }, type: 'SELECT' }
        )
        : [];
      const priorityMap = new Map(priorities.map((u: any) => [u.rid, u.priority_name]));

      // Get user names for created_by and modified_by
      const userIds = [...new Set(tasksRaw.flatMap(task => [task.created_by, task.modified_by, task.assigned_to]))];
      const users = userIds.length > 0
        ? await mainSequelize.query(
          rawQueries.fetchUsersByIds,
          { replacements: { userIds }, type: 'SELECT' }
        )
        : [];
      const userMap = new Map(users.map((u: any) => [u.rid, u.full_name]));

      // Enrich task data
      let tasks = await Promise.all(tasksRaw.map(async task => {
        const taskData = task.get({ plain: true }) as EnrichedTask;
        const accountStatusInfo = accountStatusMap.get(task.account_rid);

        return {
          ...taskData,
          account_name: accountMap.get(task.account_rid)?.account_name || task.account_rid,
          r_number: taskData.r_number,
          task_name: taskData.task_name,
          description: taskData.description,
          fiscal_year: taskData.fiscal_year,
          created_by_name: userMap.get(task.created_by) || task.created_by,
          modified_by_name: userMap.get(task.modified_by) || task.modified_by,
          status_name: statusMap.get(task.status_rid) || task.status_rid,
          priority_name: priorityMap.get(task.priority_rid) || task.priority_rid,
          assigned_to_name: userMap.get(task.assigned_to) || task.assigned_to,
          account_status_rid: accountStatusInfo?.status_rid || null,
          account_status_name: accountStatusInfo?.status_name || null,
          effective_start_datetime: taskData.effective_start_datetime,
          effective_end_datetime: taskData.effective_end_datetime,
          attachment_level: taskData.attachment_level,
          attach_to_name: flag === 'milestone' ? (caseMap.get(taskData.attach_to) || taskData.attach_to) : (attachmentDisplayNames[taskData.rid] || taskData.attach_to),
          attach_to: taskData.attach_to,
          task_rid: taskData.task_rid
        };
      }));

      // Apply frontend filters
      if (assignedToFilter) {
        tasks = tasks.filter(task => {
          const displayName = (task.assigned_to_name || '').toLowerCase();
          const operator = Object.keys(assignedToFilter)[0];
          const filterValue = String(assignedToFilter[operator] || '').toLowerCase();
          switch (operator) {
            case 'contains': return displayName.includes(filterValue);
            case 'equals': return displayName === filterValue;
            case 'not_equals': return displayName !== filterValue || displayName === null;
            case 'is_empty': return displayName === null || displayName === ''
            default: return false;
          }
        });
      }

      if (attachToFilter) {
        tasks = tasks.filter(task => {
          const attachToName = (task.attach_to_name || '').toLowerCase();
          const operator = Object.keys(attachToFilter)[0];
          const filterValue = String(attachToFilter[operator] || '').toLowerCase();
          switch (operator) {
            case 'contains': return attachToName.includes(filterValue);
            case 'equals': return attachToName === filterValue;
            case 'not_equals': return attachToName !== filterValue || attachToName === null;
            case 'is_empty': return attachToName === null || attachToName === ''
            default: return false;
          }
        });
      }

      if (accountNameFilter) {
        tasks = tasks.filter(task => {
          const accountName = (task.account_name || '').toLowerCase();
          const operator = Object.keys(accountNameFilter)[0];
          const filterValue = String(accountNameFilter[operator] || '').toLowerCase();
          switch (operator) {
            case 'contains': return accountName.includes(filterValue);
            case 'equals': return accountName === filterValue;
            case 'not_equals': return accountName !== filterValue || accountName === null;
            case 'is_empty': return accountName === null || accountName === ''
            default: return false;
          }
        });
      }

      if (accountStatusFilter) {
        tasks = tasks.filter(task => {
          const accountStatus = (task.account_status_rid || '').toLowerCase();
          const operator = Object.keys(accountStatusFilter)[0];

          if (operator === 'in') {
            const values = accountStatusFilter[operator];
            return Array.isArray(values) && values.some((v: any) => String(v).toLowerCase() === accountStatus);
          }

          const filterValue = String(accountStatusFilter[operator] || '').toLowerCase();
          switch (operator) {
            case 'contains': return accountStatus.includes(filterValue);
            case 'equals': return accountStatus === filterValue;
            case 'not_equals': return accountStatus !== filterValue || accountStatus === null;
            case 'is_empty': return accountStatus === null || accountStatus === ''
            default: return false;
          }
        });
      }

      if (taskNameFilter) {
        tasks = tasks.filter(task => {
          const taskName = (task.task_name || '').toLowerCase();
          const operator = Object.keys(taskNameFilter)[0];
          const filterValue = String(taskNameFilter[operator] || '').toLowerCase();
          switch (operator) {
            case 'contains': return taskName.includes(filterValue);
            case 'equals': return taskName === filterValue;
            case 'not_equals': return taskName !== filterValue || taskName === null;
            default: return false;
          }
        });
      }

      if (statusFilter) {
        tasks = tasks.filter(task => {
          const statusName = (task.status_name || '').toLowerCase();
          const operator = Object.keys(statusFilter)[0];
          const filterValue = String(statusFilter[operator] || '').toLowerCase();
          switch (operator) {
            case 'contains': return statusName.includes(filterValue);
            case 'equals': return statusName === filterValue;
            case 'not_equals': return statusName !== filterValue || statusName === null;
            default: return false;
          }
        });
      }

      if (priorityFilter) {
        tasks = tasks.filter(task => {
          const priorityName = (task.priority_name || '').toLowerCase();
          const operator = Object.keys(priorityFilter)[0];
          const filterValue = String(priorityFilter[operator] || '').toLowerCase();
          switch (operator) {
            case 'contains': return priorityName.includes(filterValue);
            case 'equals': return priorityName === filterValue;
            case 'not_equals': return priorityName !== filterValue || priorityName === null;
            default: return false;
          }
        });
      }

      if (createdByFilter) {
        let filterValue;
        tasks = tasks.filter(task => {
          const createdByName = (task.created_by_name || '').toLowerCase();
          const operator = Object.keys(createdByFilter)[0];
          if (operator === 'is_empty') filterValue = ''
          else filterValue = String(createdByFilter[operator] || '').toLowerCase();
          switch (operator) {
            case 'contains': return createdByName.includes(filterValue);
            case 'equals': return createdByName === filterValue;
            case 'not_equals': return createdByName !== filterValue || createdByName === null;
            case 'is_empty': return createdByName === null || createdByName === ''
            default: return false;
          }
        });
      }

      if (modifiedByFilter) {
        let filterValue;
        tasks = tasks.filter(task => {
          const modifiedByName = (task.modified_by_name || '').toLowerCase();
          const operator = Object.keys(modifiedByFilter)[0];
          if (operator === 'is_empty') filterValue = ''
          else filterValue = String(modifiedByFilter[operator] || '').toLowerCase();
          switch (operator) {
            case 'contains': return modifiedByName.includes(filterValue);
            case 'equals': return modifiedByName === filterValue;
            case 'not_equals': return modifiedByName !== filterValue || modifiedByName === null;
            case 'is_empty': return modifiedByName === null || modifiedByName === ''
            default: return false;
          }
        });
      }

      // Sorting logic
      const validSortFields = [
        'r_number', 'task_name', 'fiscal_year', 'assigned_to_name',
        'status_name', 'priority_name', 'created_by_name', 'created_datetime',
        'modified_by_name', 'modified_datetime', 'effective_start_datetime',
        'effective_end_datetime', 'description', 'attachment_level', 'account_status_name',
        'attach_to_name', 'account_name'
      ];

      const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_datetime';
      const finalSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

      tasks.sort((a, b) => {
        // Handle date fields
        const dateFields = ['created_datetime', 'modified_datetime', 'effective_start_datetime', 'effective_end_datetime'];
        if (dateFields.includes(finalSortBy)) {
          const aDate = new Date(a[finalSortBy as keyof typeof a]).getTime();
          const bDate = new Date(b[finalSortBy as keyof typeof b]).getTime();
          return finalSortOrder === 'ASC' ? aDate - bDate : bDate - aDate;
        }

        let aVal: string = '';
        let bVal: string = '';

        // Use explicit mapping for type safety
        switch (finalSortBy) {
          case 'assigned_to_name':
            aVal = a.assigned_to_name || '';
            bVal = b.assigned_to_name || '';
            break;
          case 'status_name':
            aVal = a.status_name || '';
            bVal = b.status_name || '';
            break;
          case 'priority_name':
            aVal = a.priority_name || '';
            bVal = b.priority_name || '';
            break;
          case 'created_by_name':
            aVal = a.created_by_name || '';
            bVal = b.created_by_name || '';
            break;
          case 'modified_by_name':
            aVal = a.modified_by_name || '';
            bVal = b.modified_by_name || '';
            break;
          case 'task_name':
            aVal = a.task_name || '';
            bVal = b.task_name || '';
            break;
          case 'description':
            aVal = a.description || '';
            bVal = b.description || '';
            break;
          case 'attachment_level':
            aVal = a.attachment_level || '';
            bVal = b.attachment_level || '';
            break;
          case 'account_status_name':
            aVal = a.account_status_name || '';
            bVal = b.account_status_name || '';
            break;
          case 'account_name':
            aVal = a.account_name || '';
            bVal = b.account_name || '';
            break;
          case 'attach_to_name':
            aVal = a.attach_to_name || '';
            bVal = b.attach_to_name || '';
            break;
          case 'r_number':
            aVal = a.r_number || '';
            bVal = b.r_number || '';
            break;
          case 'fiscal_year':
            aVal = String(a.fiscal_year) || '';
            bVal = String(b.fiscal_year) || '';
            break;
          default:
            // Use type assertion for unknown properties
            const aAny = a as any;
            const bAny = b as any;
            aVal = aAny[finalSortBy] !== undefined && aAny[finalSortBy] !== null ? String(aAny[finalSortBy]) : '';
            bVal = bAny[finalSortBy] !== undefined && bAny[finalSortBy] !== null ? String(bAny[finalSortBy]) : '';
        }

        aVal = aVal.trim().toLowerCase();
        bVal = bVal.trim().toLowerCase();

        const isAEmpty = !aVal;
        const isBEmpty = !bVal;

        // Ascending: empty values last
        if (finalSortOrder === 'ASC') {
          if (isAEmpty && !isBEmpty) return 1;
          if (!isAEmpty && isBEmpty) return -1;
          return aVal.localeCompare(bVal);
        }

        // Descending: empty values first
        else {
          if (isAEmpty && !isBEmpty) return -1;
          if (!isAEmpty && isBEmpty) return 1;
          return bVal.localeCompare(aVal);
        }
      });

      const permissionName = flag === "milestone" ? "cases_workbreakdown_view_edit" : "activity_task_view_edit";

      // Apply field-level access control for export
      const allowedFieldsForExport = await this.schemaService.getAllowedExportFields(userId, permissionName);
      const accountAllowedFieldsForExport = await this.schemaService.getAllowedExportFields(userId, "accounts_view_edit");
      const allowedFieldSet = new Set<string>();
      for (const field of allowedFieldsForExport) {
        if (field.read) {
          allowedFieldSet.add(field.field_desc);
        }
      }
      for (const field of accountAllowedFieldsForExport) {
        if (field.read) {
          if (field.field_name === "status_rid") {
            allowedFieldSet.add("Account Status");
          }
          if (field.field_name === "account_name") {
            allowedFieldSet.add("Account Name");
          }
        }
      }

      const labelMap: Record<string, string> = {
        "Task ID": flag === 'milestone' ? "Task ID" : "Activity ID",
        "Account Name": "Account Name",
        "Task Name": flag === 'milestone' ? "Task Name" : "Activity Name",
        "Description": "Description",
        "Fiscal Year": "Fiscal Year",
        [flag === 'milestone' ? "Related To Name" : "Related To Name"]: "Related To Name",
        [flag === 'milestone' ? "Related Entity" : "Related Entity"]: "Related Entity",
        [flag === 'milestone' ? "Assignee" : "Assigned To"]: "Assigned To",
        "Priority": "Priority",
        "Status": "Status",
        "Account Status": "Account Status",
        "Created By": "Created By",
        "Created On": "Created On",
        "Updated By": "Updated By",
        "Updated On": "Updated On"
      };

      // Map tasks to export format
      tasks = tasks.map((task) => {
        const rawMapped = this.mapTaskToExportFormat(task, timezone, flag);
        const filtered: Record<string, any> = {};

        for (const [fieldKey, value] of Object.entries(rawMapped)) {
          const label = labelMap[fieldKey];
          if (allowedFieldSet.has(fieldKey)) {
            filtered[label] = value;
          }
        }
        return filtered;
      }) as typeof tasks;

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          tasks: tasks,
        }
      };

    } catch (error) {
      console.error("exportTaskSummary error:", error);
      return {
        statusCode: 500,
        message: 'Failed to export task summary',
        errorMessage: error instanceof Error ? error.message : 'An unknown error occurred',
        data: { tasks: [] }
      };
    }
  }

  private buildRawWhereClause(
    filters: Record<string, any>,
    search?: string
  ): { whereClause: any } {
    const whereClause: any = {
      [Op.and]: []
    };

    // Search logic for TaskSummary
    if (search) {
      whereClause[Op.and].push({
        [Op.or]: [
          { task_name: { [Op.iLike]: `%${search}%` } },
          { r_number: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
          { attachment_level: { [Op.iLike]: `%${search}%` } }
        ]
      });
    }

    // Filter logic for TaskSummary fields
    Object.entries(filters).forEach(([field, filter]) => {
      if (!filter || typeof filter !== 'object') {
        console.log(`Skipping filter for field ${field} due to invalid structure`);
        return;
      }

      const operator = Object.keys(filter)[0];
      const value = filter[operator];

      if (!operator || value === undefined) {
        console.log(`Skipping filter for field ${field} due to missing operator or value`);
        return;
      }

      const condition: any = {};

      switch (field) {
        case 'task_name':
        case 'description':
        case 'attachment_level':
        case 'attach_to':
        case 'assigned_to':
        case 'status_rid':
        case 'priority_rid':
        case 'account_rid':
        case 'r_number':
          switch (operator.toLowerCase()) {
            case 'equals': condition[field] = { [Op.iLike]: value }; break;
            case 'not_equals': condition[field] = { [Op.or]: [{ [Op.notILike]: value }, { [Op.is]: null }] }; break;
            case 'contains': condition[field] = { [Op.iLike]: `%${value}%` }; break;
            case 'is_empty': condition[field] = { [Op.or]: [{ [Op.is]: null }, { [Op.eq]: '' }] }; break;
            case 'in': condition[field] = { [Op.in]: Array.isArray(value) ? value : [value] }; break;
          }
          break;

        case 'effective_start_datetime':
        case 'effective_end_datetime':
        case 'created_datetime':
        case 'modified_datetime':
          switch (operator.toLowerCase()) {
            case 'equals': {
              const date = new Date(value);
              condition[field] = Sequelize.literal(`DATE("${field}") = DATE('${date.toISOString()}')`);
              break;
            }
            case 'before': {
              const date = new Date(value);
              condition[field] = Sequelize.literal(`DATE("${field}") < DATE('${date.toISOString()}')`);
              break;
            }
            case 'after': {
              const date = new Date(value);
              condition[field] = Sequelize.literal(`DATE("${field}") > DATE('${date.toISOString()}')`);
              break;
            }
            case 'between': {
              if (Array.isArray(value)) {
                const startDate = new Date(value[0]);
                const endDate = new Date(value[1]);
                condition[field] = Sequelize.literal(
                  `DATE("${field}") BETWEEN DATE('${startDate.toISOString()}') AND DATE('${endDate.toISOString()}')`
                );
              }
              break;
            }
            case 'is_empty': condition[field] = { [Op.is]: null }; break;
          }
          break;

        case 'fiscal_year':
          switch (operator.toLowerCase()) {
            case 'equals': condition[field] = { [Op.eq]: value }; break;
            case 'not_equals': condition[field] = { [Op.or]: [{ [Op.ne]: value }, { [Op.is]: null }] }; break;
            case 'in': condition[field] = { [Op.in]: Array.isArray(value) ? value : [value] }; break;
            case 'is_empty': condition[field] = { [Op.or]: [{ [Op.is]: null }, { [Op.eq]: '' }] }; break;
            case 'greater_than': condition[field] = { [Op.gt]: value }; break;
            case 'less_than': condition[field] = { [Op.lt]: value }; break;
          }
          break;

        default:
          console.log(`Unhandled filter field: ${field}`);
      }

      if (Object.keys(condition).length > 0) {
        whereClause[Op.and].push(condition);
      }
    });

    return { whereClause: whereClause[Op.and].length > 0 ? whereClause : {} };
  }

  // Helper method to map task to export format
  private mapTaskToExportFormat(task: any, timezone: string, flag: string): Record<string, any> {

    return {
      "Task ID": task.r_number || '-',
      "Account Name": task.account_name || '-',
      "Task Name": task.task_name || '-',
      "Description": task.description || '-',
      "Fiscal Year": task.fiscal_year ? `FY-${task.fiscal_year}` : '-',
      [flag === 'milestone' ? "Related To Name" : "Related To Name"]: task.attach_to_name || '-',
      [flag === 'milestone' ? "Related Entity" : "Related Entity"]: task.attachment_level ? String(task.attachment_level).split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : '-',
      [flag === 'milestone' ? "Assignee" : "Assigned To"]: task.assigned_to_name || '-',
      "Priority": task.priority_name || '-',
      "Status": task.status_name || '-',
      "Account Status": task.account_status_name || '-',
      "Created By": task.created_by_name || '-',
      "Created On": task.created_datetime
        ? timezone && isValidTimezone(timezone)
          ? moment(task.created_datetime)
            .tz(timezone)
            .format("YYYY-MMM-DD, hh:mm:ss A")
          : moment(task.created_datetime).format(
            "YYYY-MMM-DD, hh:mm:ss A"
          )
        : "-",
      "Updated By": task.modified_by_name || '-',
      "Updated On": task.modified_datetime
        ? timezone && isValidTimezone(timezone)
          ? moment(task.modified_datetime)
            .tz(timezone)
            .format("YYYY-MMM-DD, hh:mm:ss A")
          : moment(task.modified_datetime).format(
            "YYYY-MMM-DD, hh:mm:ss A"
          )
        : "-"
    };
  }

  // Helper method to get display names for attachments
  private async getAttachmentDisplayNames(attachments: any[], schemaNumber: string): Promise<any> {
    const displayNames: Record<string, string> = {};
    let parentRid: Record<string, string> = {}
    let currencyRid: Record<string, string> = {}
    for (const attachment of attachments) {
      try {
        switch (attachment.attachment_level) {
          case 'account':
            const account = await this.schemaService.fetchAccountById(attachment.attach_to);
            displayNames[attachment.rid] = account?.account_name || attachment.attach_to;
            parentRid[attachment.attach_to] = ''
            currencyRid[attachment.attach_to] = ''
            break;
          case 'project':
            const project = await this.projectIngestionService.fetchProjectInfoById(schemaNumber, attachment.attach_to);
            displayNames[attachment.rid] = project?.project_code || attachment.attach_to;
            parentRid[attachment.attach_to] = ''
            currencyRid[attachment.attach_to] = project?.currency_rid || ''
            break;
          case 'project_resource':
            const projectResource = await this.projectIngestionService.fetchProjectResourceById(schemaNumber, attachment.attach_to);
            displayNames[attachment.rid] = (projectResource as { r_number?: string })?.r_number || attachment.attach_to;
            parentRid[attachment.attach_to] = (projectResource as { project_fiscal_rid?: string })?.project_fiscal_rid || ''
            currencyRid[attachment.attach_to] = (projectResource as { currency_rid?: string })?.currency_rid || ''
            break;
          case 'project_task':
            const projectTask = await this.projectIngestionService.fetchProjectTaskById(schemaNumber, attachment.attach_to);
            displayNames[attachment.rid] = (projectTask as { r_number?: string })?.r_number || attachment.attach_to;
            parentRid[attachment.attach_to] = (projectTask as { project_fiscal_rid?: string })?.project_fiscal_rid || ''
            currencyRid[attachment.attach_to] = (projectTask as { currency_rid?: string })?.currency_rid || ''
            break;
          case 'resource':
            const resource = await this.projectIngestionService.fetchResourceById(schemaNumber, attachment.attach_to);
            displayNames[attachment.rid] = (resource as { resource_code?: string })?.resource_code || attachment.attach_to;
            parentRid[attachment.attach_to] = ''
            currencyRid[attachment.attach_to] = ''
            break;
          case 'resource_cost':
            const resourceCost = await this.projectIngestionService.fetchResourceCostById(schemaNumber, attachment.attach_to);
            displayNames[attachment.rid] = (resourceCost as { r_number?: string })?.r_number || attachment.attach_to;
            parentRid[attachment.attach_to] = (resourceCost as { resource_rid?: string })?.resource_rid || attachment.attach_to
            currencyRid[attachment.attach_to] = ''
            break;
          case 'resource_skill':
            const resourceSkill = await this.projectIngestionService.fetchResourceSkillById(schemaNumber, attachment.attach_to);
            displayNames[attachment.rid] = (resourceSkill as { r_number?: string })?.r_number || attachment.attach_to;
            parentRid[attachment.attach_to] = (resourceSkill as { resource_rid?: string })?.resource_rid || ''
            currencyRid[attachment.attach_to] = ''
            break;
          case 'case':
            const cases = await this.projectIngestionService.fetchCaseById(schemaNumber, attachment.attach_to);
            displayNames[attachment.rid] = (cases as { case_name?: string })?.case_name || attachment.attach_to;
            parentRid[attachment.attach_to] = ''
            currencyRid[attachment.attach_to] = ''
            break;
          default:
            displayNames[attachment.rid] = attachment.attach_to;
        }
      } catch (err) {
        console.error(`Error fetching display name for attachment ${attachment.rid}:`, err);
        displayNames[attachment.rid] = attachment.attach_to;
      }
    }

    return {
      displayNames,
      parentRid,
      currencyRid
    };
  }

  /**
    * Formats an error response to be returned from service methods.
    *
    * @param {Error} err - The caught error.
    * @returns {object} - Standardized error response object.
    */
  throwServiceError(err: Error): {
    statusCode: number;
    message: string;
    errorMessage: string;
  } {
    return {
      statusCode: HttpStatus.FAILED,
      message: HttpStatus.FAILED_MESSAGE,
      errorMessage: err.message,
    };
  }

  async getTaskDetailsById(data: IFetchTaskDetailsInput): Promise<{
    statusCode: number,
    statusMessage: string,
    data: any
  }> {
    const task_type = data.task_type_name === 'Action' ? 'activity' : 'milestone';
    const response = await this.fetchTaskCardDetailsList(data.account_rid, data.task_rid, task_type, data.attach_to);
    if (response.statusCode !== HttpStatus.SUCCESS) {
      return {
        statusCode: response.statusCode,
        statusMessage: STATUS_MESSAGE.taskDetailsFetchFailed,
        data: {}
      }
    }
    return {
      statusCode: HttpStatus.SUCCESS,
      statusMessage: HttpStatus.SUCCESS_MESSAGE,
      data: response.data
    }
  }

  async fetchTaskCardDetailsList(account_rid: any, task_rid: any, task_type: any, case_rid?: any,) {
    const mainDb = await this.fetchMainDb();
    const orgDb = await this.fetchOrgDb();

    const parentNumber: any = await mainDb.query(await rawQueries.fetchParentAccount(account_rid, mainDb));
    let schemaName = rawQueries.fetchSchemaName(parentNumber[0][0].r_number);
    const fetchChecklistStatusRid: any = await mainDb.query(rawQueries.fetchChecklistStatus());
    let result = [];
    if (task_type === 'activity') {
      result = await orgDb.query<TaskCardResponse>(taskCardDetailsActivityTask(schemaName, task_rid, account_rid, fetchChecklistStatusRid[0][0].rid), { type: QueryTypes.SELECT });
    } else {
      result = await orgDb.query<TaskCardResponse>(taskCardDetails(schemaName, task_rid, account_rid, case_rid, fetchChecklistStatusRid[0][0].rid), { type: QueryTypes.SELECT });
    }
    if (result.length > 0) {
      const findRole: any = await mainDb.query(rawQueries.getCaseTeamRoleName(result[0]?.task_details.case_team_member_role_rid!));
      let userIds: Record<string, string> = {
        created_by: result[0]?.task_details.created_by!,
        assigned_to: result[0]?.task_details.assigned_to!,
        modified_by: result[0]?.task_details.modified_by!,
      }
      let priorityId = {
        priority_id: result[0]?.task_details.priority_rid!
      }
      let taskStatusID = {
        task_status_rid: result[0]?.task_details.task_status_rid
      }
      let weightageValue;
      if (result[0]?.task_details?.weightage_rid !== null && task_type !== 'activity') {
        const weightageRes: any = await mainDb.query(rawQueries.getWeightageValue(result[0]?.task_details.weightage_rid!));
        weightageValue = weightageRes[0][0].weightage_value;
      } else {
        weightageValue = null;
      }
      let taskCategoryValue;
      if (result[0]?.task_details?.task_category_rid !== null && task_type !== 'activity') {
        const taskCategoryQuery: any = await mainDb.query(rawQueries.getTaskCategoryByRid(result[0]?.task_details.task_category_rid!));
        taskCategoryValue = taskCategoryQuery[0][0].category_name
      } else {
        taskCategoryValue = null;
      }


      let priority;
      let taskStatusType;
      const priorityIds: string[] = [];
      const taskStatusIds: string[] = [];
      let tagMap: Map<string, string> = new Map();
      let checklistItemsStatusIds: string[];
      let checkListData: any
      let taskNameMap: Map<string, string> = new Map()
      let relationshipConnectorMap: Map<string, string>;
      let sourceIds;
      let targetIds;
      let taskIds = []
      let relationshipConnectorIds;
      let taskNameResult;
      let workflowResult;
      if (result[0]?.task_details.workflow_connector !== null && task_type !== 'activity') {
        sourceIds = [...new Set(result[0]?.task_details.workflow_connector.map((d: taskWorkFlowConnector) => d.source_rid))]
        targetIds = [...new Set(result[0]?.task_details.workflow_connector.map((d: taskWorkFlowConnector) => d.target_rid))]
        relationshipConnectorIds = [...new Set(result[0]?.task_details.workflow_connector.map((d: taskWorkFlowConnector) => d.relationship_connector_rid))]
        taskIds.push(...sourceIds, ...targetIds)
        let query = rawQueries.getTaskNames(taskIds, schemaName);
        let relationshipQuery = rawQueries.getWorkflowConnectors(relationshipConnectorIds);
        if (query) {
          taskNameResult = await orgDb.query(query);
          taskNameMap = new Map(taskNameResult[0].map((d: any) => [d.rid, d.task_name]))
        }
        if (relationshipQuery) {
          workflowResult = await mainDb.query(relationshipQuery);
          relationshipConnectorMap = new Map(workflowResult[0].map((d: any) => [d.rid, d.relationship_type]));
        }
      }
      if (result[0]?.task_details?.checklists && result[0]?.task_details?.checklists?.checklist_items !== null) {
        checklistItemsStatusIds = [...new Set(result[0]?.task_details.checklists.checklist_items.map((d: ChecklistItems) => d.status_rid))]
      } else {
        checklistItemsStatusIds = []
      }

      const uniqueUserIds = [...new Set(Object.values(userIds))];
      if (result[0]?.task_details.tags !== null) {
        let tagIds = [...new Set(result[0]?.task_details.tags.map((d: taskTags) => d.tag_rid))]
        if (tagIds.length > 0) {
          let query = rawQueries.getAllTagsName(tagIds)
          if (query) {
            const findTagNames = await mainDb.query<TagsTypes>(query, { type: QueryTypes.SELECT });
            if (findTagNames.length > 0) {
              tagMap = new Map(findTagNames.map((d: TagsTypes) => [d.rid, d.tag_name]));
            }
          }
        }
      }

      priorityIds.push(priorityId.priority_id)
      taskStatusIds.push(taskStatusID.task_status_rid!)
      const getUsers = await mainDb.query(rawQueries.getOwnerDetails(uniqueUserIds))
      const fetchPriorityQuery = rawQueries.getAllPriorityTypes(priorityIds)
      const checkListStatusName: any = await mainDb.query(rawQueries.fetchCheckListStatusNamesByRids(MAIN_SCHEMA_NAME, checklistItemsStatusIds))
      if (fetchPriorityQuery) {
        priority = await mainDb.query(fetchPriorityQuery)
      }
      let taskStatusQuery = rawQueries.getAllTaskStatus(taskStatusIds);
      if (taskStatusQuery) {
        taskStatusType = await mainDb.query(taskStatusQuery)
      }

      let taskStatusMap: Map<string, string> = new Map(taskStatusType?.[0]?.map((d: any) => [d.rid, d.task_status_name]));
      let priorityMap: Map<string, string> = new Map(priority?.[0]?.map((d: any) => [d.rid, d.priority_name]));
      let assignedToMap: Map<string, string> = new Map(getUsers?.[0]?.map((d: any) => [d.rid, d.name]));
      let checkListItemsMap: Map<string, string> = new Map(checkListStatusName?.[0]?.map((d: any) => [d.rid, d.status_name]));

      const resData = result[0];
      if (result[0]?.task_details.checklists === null) checkListData = null
      else checkListData = {
        rid: resData?.task_details.checklists.rid,
        task_rid: resData?.task_details.checklists.task_rid,
        checklist_name: resData?.task_details.checklists.checklist_name,
        checklist_description: resData?.task_details.checklists.checklist_description,
        checklist_items_count: resData?.task_details.checklists.checklist_items_count,
        completed_items_count: resData?.task_details.checklists.completed_items_count,
        checklist_items: resData?.task_details.checklists.checklist_items !== null ? resData?.task_details.checklists.checklist_items.map((d: ChecklistItems) => {
          return {
            rid: d.rid,
            status_rid: d.status_rid,
            checklist_item_status_name: checkListItemsMap.get(d.status_rid) || null,
            checklist_item_name: d.checklist_item_name,
            checklist_item_description: d.checklist_item_description
          }

        }) : [],
      }
      let finalWorkflowData
      if (task_type !== 'activity') {
        if (result[0]?.task_details.workflow_connector === null) {
          finalWorkflowData = []
        } else {
          finalWorkflowData = result[0]?.task_details?.workflow_connector?.filter((f: any) => f.rid !== null).map((d: any) => {
            return {
              ...d,
              source_task_name: taskNameMap.get(d.source_rid),
              target_task_name: taskNameMap.get(d.target_rid),
              relationship_name: relationshipConnectorMap.get(d.relationship_connector_rid)
            }
          }) || []
        }
      }
      let finalStruture = {
        rid: resData?.task_details.rid,
        r_number: resData?.task_details.r_number,
        task_name: resData?.task_details.task_name,
        created_by: resData?.task_details.created_by,
        created_by_name: assignedToMap.get(resData?.task_details.created_by!) || null,
        assigned_to: resData?.task_details.assigned_to,
        assigned_to_name: assignedToMap.get(resData?.task_details.assigned_to!) || null,
        modified_by: resData?.task_details.modified_by,
        modified_by_name: assignedToMap.get(resData?.task_details.modified_by!) || null,
        priority_rid: resData?.task_details.priority_rid,
        priority_name: priorityMap.get(resData?.task_details.priority_rid!) || null,
        task_status_rid: resData?.task_details.task_status_rid,
        task_status_name: taskStatusMap.get(resData?.task_details.task_status_rid!) || null,
        created_datetime: new Date(resData?.task_details.created_datetime!).toISOString(),
        task_description: resData?.task_details.task_description,
        effective_start_datetime: resData?.task_details.effective_start_datetime,
        effective_end_datetime: resData?.task_details.effective_end_datetime,
        checklist_rid: resData?.task_details?.checklists?.rid,
        checklist_name: resData?.task_details?.checklists?.checklist_name,
        case_team_member_role_rid: resData?.task_details.case_team_member_role_rid,
        case_team_member_role_name: findRole[0][0] !== undefined ? findRole[0][0].role_name : null,
        weightage_rid: resData?.task_details?.weightage_rid,
        weightage_value: weightageValue,
        task_category_rid: resData?.task_details?.task_category_rid,
        task_category_name: taskCategoryValue,
        checklists: checkListData,
        tags: resData?.task_details.tags.filter((f: taskTags) => f.tag_rid !== null).map((d: taskTags) => {
          return {
            tag_rid: d.tag_rid,
            tag_name: tagMap.get(d.tag_rid) || null
          }
        }) || [],
        workflow_connector: finalWorkflowData
      }
      return {
        statusCode: HttpStatus.SUCCESS,
        data: finalStruture
      }
    } else {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        data: null
      }
    }
  }



}