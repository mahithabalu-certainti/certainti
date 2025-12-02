import { Op, Sequelize } from "sequelize";
import { initOrgSequelize } from "../../config/orgDataSource";
import { initMainDbSequelize } from "../../config/mainDataSource";
// import { ICreateNotesSchema, IUpdateNotesSchema } from "./notesSchemas";
import { HttpStatus, MAIN_SCHEMA_NAME, rawQueries, STATUS_MESSAGE } from "../../utils/constants";
import { Notes, setupNotesSeq } from "../../models/notes";
import { NotesTimeline, setupNotesTimelineSequence } from "../../models/notesTimeline";
import { TaskSummary } from "../../models/taskSummary";
import SchemaService from "../schemaService";
import { Logger } from "winston";
import { deleteFromAzureBlob, uploadToAzureBlob } from "../../utils/helpers";
import ProjectIngestionService from "../projectIngestionService";
import { ResourceService } from "../resourceServices";
import ResourceCostService from "../resourceCostService";
import ResourceSkillService from "../resourceSkillService";
import moment from "moment";
import { IFetchNotesDetailsInput } from "../../utils/types";
import { fetchActiveStatus, fetchNotesById, fetchUsers } from "../../utils/rawQueries";
import { generateSasUrl } from "../../utils/blob";
import { isValidTimezone } from "../../utils/valideTimeChecker";
import { EnrichedTask } from "../interfaces/interface";

export class TaskService {
    private logger: Logger;
    private schemaService: SchemaService;
    private projectIngestionService: ProjectIngestionService;
    private resourceService: ResourceService;
    private resourceCostService: ResourceCostService;
    private resourceSkillService: ResourceSkillService;
    private mainDbSequelize : Sequelize | null = null
    private orgDbSequelize : Sequelize | null = null

    constructor(logger: Logger) {
        this.logger = logger;
        this.schemaService = new SchemaService();
        this.projectIngestionService = new ProjectIngestionService(logger);
        this.resourceService = new ResourceService();
        this.resourceCostService = new ResourceCostService();
        this.resourceSkillService = new ResourceSkillService();
    }

    async fetchMainDb () {
      if(!this.mainDbSequelize) {
        this.mainDbSequelize = await initMainDbSequelize()
      }
      return this.mainDbSequelize;
    }

    async fetchOrgDb () {
      if(!this.orgDbSequelize) {
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
    fiscalYear: number = 0
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
      let assignedToFilter, createdByFilter, modifiedByFilter, taskNameFilter, statusFilter, priorityFilter;
      
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

      // Build where clause
      const { whereClause } = this.buildRawWhereClause(filters, search);
      if (typeof globalFilters === 'string') globalFilters = JSON.parse(globalFilters);
      whereClause[Op.and] = whereClause[Op.and] || [];

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
  
      await Promise.all(
        Array.from(schemaAttachmentMap.entries()).map(async ([schemaNumber, attachments]) => {
          const {displayNames, parentRid, currencyRid} = await this.getAttachmentDisplayNames(attachments, schemaNumber);
          Object.assign(attachmentDisplayNames, displayNames);
        })
      );

      // Get related resources (status, priority, assigned to)
      const resourceRids = [
        ...new Set(tasksRaw.flatMap(task => [
          task.status_rid,
          task.priority_rid,
          task.assigned_to
        ]))
      ];

      const resources = resourceRids.length > 0 
        ? await mainSequelize.query(
            `SELECT rid, resource_name FROM ${MAIN_SCHEMA_NAME}.resources WHERE rid IN (:resourceRids)`,
            { replacements: { resourceRids }, type: 'SELECT' }
          )
        : [];

      const resourceMap = new Map(resources.map((r: any) => [r.rid, r.resource_name]));

      // Get user names for created_by and modified_by
      const userIds = [...new Set(tasksRaw.flatMap(task => [task.created_by, task.modified_by]))];
      const users = userIds.length > 0 
        ? await mainSequelize.query(
            `SELECT rid, CONCAT(first_name, ' ', last_name) as full_name FROM ${MAIN_SCHEMA_NAME}.user WHERE rid IN (:userIds)`,
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
          r_number: taskData.r_number,
          task_name: taskData.task_name,
          description: taskData.description,
          fiscal_year: taskData.fiscal_year,
          created_by_name: userMap.get(task.created_by) || task.created_by,
          modified_by_name: userMap.get(task.modified_by) || task.modified_by,
          status_name: resourceMap.get(task.status_rid) || null,
          priority_name: resourceMap.get(task.priority_rid) || null,
          assigned_to_name: resourceMap.get(task.assigned_to) || task.assigned_to,
          account_status_rid: accountStatusInfo?.status_rid || null,
          account_status_name: accountStatusInfo?.status_name || null,
          effective_start_datetime: taskData.effective_start_datetime,
          effective_end_datetime: taskData.effective_end_datetime,
          attachment_level: taskData.attachment_level,
          attach_to: attachmentDisplayNames[taskData.rid] || taskData.attach_to,
          task_rid: taskData.task_rid
        };
      }));

      // Apply frontend filters
      if (assignedToFilter) {
        tasks = tasks.filter(task => {
          const displayName = (task.assigned_to_name || '').toLowerCase();
          const operator = Object.keys(assignedToFilter)[0];
          const filterValue = (assignedToFilter[operator] || '').toLowerCase();
          switch (operator) {
            case 'contains': return displayName.includes(filterValue);
            case 'equals': return displayName === filterValue;
            case 'not_equals': return displayName !== filterValue || displayName === null;
            default: return false;
          }
        });
      }

      if (taskNameFilter) {
        tasks = tasks.filter(task => {
          const taskName = (task.task_name || '').toLowerCase();
          const operator = Object.keys(taskNameFilter)[0];
          const filterValue = (taskNameFilter[operator] || '').toLowerCase();
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
          const filterValue = (statusFilter[operator] || '').toLowerCase();
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
          const filterValue = (priorityFilter[operator] || '').toLowerCase();
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
          else filterValue = (createdByFilter[operator] || '').toLowerCase();
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
          else filterValue = (modifiedByFilter[operator] || '').toLowerCase();
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
        'effective_end_datetime', 'description', 'attachment_level'
      ];
      
      const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_datetime';
      const finalSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

      tasks.sort((a: EnrichedTask, b: EnrichedTask) => {
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
  timezone: string = ''
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
    let assignedToFilter, createdByFilter, modifiedByFilter, taskNameFilter, statusFilter, priorityFilter;
    
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

    await Promise.all(
      Array.from(schemaAttachmentMap.entries()).map(async ([schemaNumber, attachments]) => {
        const {displayNames, parentRid, currencyRid} = await this.getAttachmentDisplayNames(attachments, schemaNumber);
        Object.assign(attachmentDisplayNames, displayNames);
      })
    );

    // Get related resources (status, priority, assigned to)
    const resourceRids = [
      ...new Set(tasksRaw.flatMap(task => [
        task.status_rid,
        task.priority_rid,
        task.assigned_to
      ]))
    ];

    const resources = resourceRids.length > 0 
      ? await mainSequelize.query(
          `SELECT rid, resource_name FROM ${MAIN_SCHEMA_NAME}.resources WHERE rid IN (:resourceRids)`,
          { replacements: { resourceRids }, type: 'SELECT' }
        )
      : [];

    const resourceMap = new Map(resources.map((r: any) => [r.rid, r.resource_name]));

    // Get user names for created_by and modified_by
    const userIds = [...new Set(tasksRaw.flatMap(task => [task.created_by, task.modified_by]))];
    const users = userIds.length > 0 
      ? await mainSequelize.query(
          `SELECT rid, CONCAT(first_name, ' ', last_name) as full_name FROM ${MAIN_SCHEMA_NAME}.user WHERE rid IN (:userIds)`,
          { replacements: { userIds }, type: 'SELECT' }
        )
      : [];
    const userMap = new Map(users.map((u: any) => [u.rid, u.full_name]));

    // Enrich task data
    let tasks = await Promise.all(tasksRaw.map(async task => {
      const taskData = task.get({ plain: true });
      
      return {
        ...taskData,
        created_by_name: userMap.get(task.created_by) || task.created_by,
        modified_by_name: userMap.get(task.modified_by) || task.modified_by,
        status_name: resourceMap.get(task.status_rid) || null,
        priority_name: resourceMap.get(task.priority_rid) || null,
        assigned_to_name: resourceMap.get(task.assigned_to) || task.assigned_to,
        attached_to: attachmentDisplayNames[task.rid] || task.attach_to,
      };
    }));

    // Apply frontend filters
    if (assignedToFilter) {
      tasks = tasks.filter(task => {
        const displayName = (task.assigned_to_name || '').toLowerCase();
        const operator = Object.keys(assignedToFilter)[0];
        const filterValue = (assignedToFilter[operator] || '').toLowerCase();
        switch (operator) {
          case 'contains': return displayName.includes(filterValue);
          case 'equals': return displayName === filterValue;
          case 'not_equals': return displayName !== filterValue || displayName === null;
          default: return false;
        }
      });
    }

    if (taskNameFilter) {
      tasks = tasks.filter(task => {
        const taskName = (task.task_name || '').toLowerCase();
        const operator = Object.keys(taskNameFilter)[0];
        const filterValue = (taskNameFilter[operator] || '').toLowerCase();
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
        const filterValue = (statusFilter[operator] || '').toLowerCase();
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
        const filterValue = (priorityFilter[operator] || '').toLowerCase();
        switch (operator) {
          case 'contains': return priorityName.includes(filterValue);
          case 'equals': return priorityName === filterValue;
          case 'not_equals': return priorityName !== filterValue || priorityName === null;
          default: return false;
        }
      });
    }

    if (createdByFilter) {
      tasks = tasks.filter(task => {
        const createdByName = (task.created_by_name || '').toLowerCase();
        const operator = Object.keys(createdByFilter)[0];
        const filterValue = (createdByFilter[operator] || '').toLowerCase();
        switch (operator) {
          case 'contains': return createdByName.includes(filterValue);
          case 'equals': return createdByName === filterValue;
          case 'not_equals': return createdByName !== filterValue || createdByName === null;
          default: return false;
        }
      });
    }

    if (modifiedByFilter) {
      tasks = tasks.filter(task => {
        const modifiedByName = (task.modified_by_name || '').toLowerCase();
        const operator = Object.keys(modifiedByFilter)[0];
        const filterValue = (modifiedByFilter[operator] || '').toLowerCase();
        switch (operator) {
          case 'contains': return modifiedByName.includes(filterValue);
          case 'equals': return modifiedByName === filterValue;
          case 'not_equals': return modifiedByName !== filterValue || modifiedByName === null;
          default: return false;
        }
      });
    }

    // Sorting logic
    const validSortFields = [
      'r_number', 'task_name', 'fiscal_year', 'assigned_to_name', 
      'status_name', 'priority_name', 'created_by_name', 'created_datetime', 
      'modified_by_name', 'modified_datetime', 'effective_start_datetime',
      'effective_end_datetime', 'description', 'attachment_level'
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

    // Apply field-level access control for export
    const allowedFieldsForExport = await this.schemaService.getAllowedExportFields(userId, "tasks_view_edit");
    const allowedFieldSet = new Set<string>();
    for (const field of allowedFieldsForExport) {
      if (field.read) {
        allowedFieldSet.add(field.field_desc);
      }
    }

    const labelMap: Record<string, string> = {
      "Task ID": "Task ID",
      "Task Name": "Task Name",
      "Description": "Description",
      "Fiscal Year": "Fiscal Year",
      "Assigned To": "Assigned To",
      "Status": "Status",
      "Priority": "Priority",
      "Effective Start Date": "Effective Start Date",
      "Effective End Date": "Effective End Date",
      "Attachment Level": "Attachment Level",
      "Attached To": "Attached To",
      "Account ID": "Account ID",
      "Created By": "Created By",
      "Created On": "Created On",
      "Modified By": "Modified By",
      "Modified On": "Modified On"
    };

    // Map tasks to export format
    tasks = tasks.map((task) => {
      const rawMapped = this.mapTaskToExportFormat(task, timezone);
      const filtered: Record<string, any> = {};
      
      for (const [fieldKey, value] of Object.entries(rawMapped)) {
        const label = labelMap[fieldKey];
        if (allowedFieldSet.has(label)) {
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
private mapTaskToExportFormat(task: any, timezone: string): Record<string, any> {
  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return '';
    try {
      const dateObj = new Date(date);
      return dateObj.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        timeZone: timezone || 'UTC'
      });
    } catch {
      return String(date);
    }
  };

  const formatDateTime = (date: Date | string | null | undefined): string => {
    if (!date) return '';
    try {
      const dateObj = new Date(date);
      return dateObj.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timezone || 'UTC'
      });
    } catch {
      return String(date);
    }
  };

  return {
    "Task ID": task.r_number || '',
    "Task Name": task.task_name || '',
    "Description": task.description || '',
    "Fiscal Year": task.fiscal_year || '',
    "Assigned To": task.assigned_to_name || '',
    "Status": task.status_name || '',
    "Priority": task.priority_name || '',
    "Effective Start Date": formatDate(task.effective_start_datetime),
    "Effective End Date": formatDate(task.effective_end_datetime),
    "Attachment Level": task.attachment_level || '',
    "Attached To": task.attach_to || '',
    "Account ID": task.account_rid || '',
    "Created By": task.created_by_name || '',
    "Created On": formatDateTime(task.created_datetime),
    "Modified By": task.modified_by_name || '',
    "Modified On": formatDateTime(task.modified_datetime)
  };
}

    // Helper method to get display names for attachments
private async getAttachmentDisplayNames(attachments: any[], schemaNumber: string): Promise<any> {
  const displayNames: Record<string, string> = {};
  let parentRid : Record<string, string> = {}
  let currencyRid : Record<string, string> = {}
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
          parentRid[attachment.attach_to] =''
          currencyRid[attachment.attach_to] = project?.currency_rid || ''
          break;
        case 'project_resource':
          const projectResource = await this.projectIngestionService.fetchProjectResourceById(schemaNumber, attachment.attach_to);
          displayNames[attachment.rid] = (projectResource as { r_number?: string })?.r_number || attachment.attach_to;
          parentRid[attachment.attach_to] = (projectResource as {project_fiscal_rid? : string})?.project_fiscal_rid || ''
          currencyRid[attachment.attach_to] = (projectResource as {currency_rid? : string})?.currency_rid || ''
          break;
        case 'project_task':
          const projectTask = await this.projectIngestionService.fetchProjectTaskById(schemaNumber, attachment.attach_to);
          displayNames[attachment.rid] = (projectTask as { r_number?: string })?.r_number || attachment.attach_to;
          parentRid[attachment.attach_to] = (projectTask as {project_fiscal_rid? : string})?.project_fiscal_rid || ''
          currencyRid[attachment.attach_to] = (projectTask as {currency_rid? : string})?.currency_rid || ''
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
          parentRid[attachment.attach_to] = (resourceCost as {resource_rid? : string})?.resource_rid || attachment.attach_to
          currencyRid[attachment.attach_to] = ''
          break;
        case 'resource_skill': 
          const resourceSkill = await this.projectIngestionService.fetchResourceSkillById(schemaNumber, attachment.attach_to);
          displayNames[attachment.rid] = (resourceSkill as { r_number?: string })?.r_number || attachment.attach_to;
          parentRid[attachment.attach_to] = (resourceSkill as {resource_rid? : string})?.resource_rid || ''
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

private mapAttachmentToCommonFormat(at: any, timezone : string) {
  return {
  "Note ID": at.r_number || "-",
  "Title": at.title || "-",
  "Note Owner": at.notes_owner_name || "-",
  "Related Entity": at.attachment_level || "-",
  "Related To ID": at.attach_to || "-",
  "Related To Name": at.attached_to || "-", // added as per labelMap
  "Fiscal Year": `FY-${at.fiscal_year}` || "-",
  "Document Name": at.document_name || "-",
  "Format": at.format || "-",
  "Size": at.size_in_mb || "-",
  "Created By": at.created_by_name || "-",
  "Created On": at.created_datetime
    ? timezone && isValidTimezone(timezone)
    ? moment(at.created_datetime)
        .tz(timezone)
        .format("YYYY-MMM-DD, hh:mm:ss A")
    : moment(at.created_datetime).format(
        "YYYY-MMM-DD, hh:mm:ss A"
      )
  : "-",
  "Modified By": at.modified_by_name || "-",
  "Modified On": at.modified_datetime 
    ? timezone && isValidTimezone(timezone)
    ? moment(at.modified_datetime)
        .tz(timezone)
        .format("YYYY-MMM-DD, hh:mm:ss A")
    : moment(at.modified_datetime).format(
        "YYYY-MMM-DD, hh:mm:ss A"
      )
  : "-",
  "Download": at.browse_file || "-"
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

    async getTaskDetailsById (data : IFetchNotesDetailsInput) : Promise<{
    statusCode : number,
    statusMessage : string,
    data : any
  }> {
        const mainDb = await this.fetchMainDb();
        const orgDb = await this.fetchOrgDb();

        const fetchParentAccount : any = await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb))
        if(fetchParentAccount[0].length > 0) {
          let schemaName = rawQueries.fetchSchemaName(fetchParentAccount[0][0].r_number);

          const fetchNotes = await orgDb.query(fetchNotesById(schemaName, data.rid))
          if(fetchNotes[0].length > 0) {
            const fetchActiveStatusId : any = await mainDb.query(fetchActiveStatus())
            const uniqueUserIds = [...new Set(fetchNotes[0].flatMap((d : any) => [d.created_by, d.modified_by, d.notes_owner]))]
            const allUsers = await mainDb.query(fetchUsers(fetchActiveStatusId[0][0].rid, uniqueUserIds))

            const createdUserMap : Map<string, string> = new Map(allUsers[0].map((d : any) => [d.rid, `${d.first_name} ${d.last_name}`]))

            const finalStructuredData = await Promise.all(fetchNotes[0].map(async (n : any) => {
              return {
                ...n,
                created_by_name : createdUserMap.get(n.created_by) || null,
                modified_by_name : createdUserMap.get(n.modified_by) || null,
                notes_owner_name : createdUserMap.get(n.notes_owner) || null,
                browse_file : n.browse_file !== '' && n.browse_file !== null && n.browse_file !== undefined ? await generateSasUrl(n.browse_file) : null,
              }
            }))
            return {
              statusCode : HttpStatus.SUCCESS,
              statusMessage : STATUS_MESSAGE.notesFetchedSuccess,
              data : finalStructuredData[0]
            }
          } else {
            return {
              statusCode : HttpStatus.NOT_FOUND,
              statusMessage : STATUS_MESSAGE.noNotesRecordFound,
              data : {}
            } 
          }
        } else {
          return {
              statusCode : HttpStatus.NOT_FOUND,
              statusMessage : STATUS_MESSAGE.accountNoFound,
              data : {}
            } 
        }
    }

    // async updateNotes (notesData : IUpdateNotesSchema, userId: string, file?: Express.Multer.File, isFileDeleted? : boolean) : Promise<any> {
    //   try {
    //     const sequelize = await initOrgSequelize();
    //     const mainDdSequilze = await initMainDbSequelize();
    //     const { account_rid, attachment_level } = notesData;
    //     const accountData = await this.schemaService.fetchAccountById(account_rid);

    //     if (!accountData) {
    //     throw new Error("Notes updation failed: Invalid account ID");
    //     }

    //     if (accountData.status !== "active") {
    //     throw new Error(
    //         "Notes updation failed: The selected account is inactive. Please choose an active account."
    //     );
    //     }
    //     let accountNumber = accountData.r_number;
    //     if (accountData.is_parent && attachment_level !== "account") {
    //         throw new Error("Notes updation failed: Invalid account ID");
    //     }

    //     if (accountData.storage_type === "store_in_parent") {
    //         accountNumber = await this.schemaService.fetchParentAccount(
    //         accountData.parent_account_rid
    //         );
    //     }
    //     const isExists = await this.schemaService.checkIfSchemaExists(
    //         accountNumber
    //     );

    //     if (!isExists) {
    //         throw new Error("Notes updation failed: schema doesn't exists");
    //     }

    //     const schemaName = `trd365_${accountNumber.replace(/\D/g, "")}`;
    //     const NotesModel = Notes.initialize(sequelize, schemaName)
    //     const NotesTimelineModel = NotesTimeline.initialize(sequelize, schemaName)
    //     const TaskSummaryModel = TaskSummary.initialize(mainDdSequilze)

    //     const isNotesExists = await Notes.findOne({
    //       where : {
    //         rid : notesData.rid
    //       }
    //     })

    //     if(!isNotesExists) {
    //       return {
    //         statusCode: HttpStatus.NOT_FOUND,
    //         message: HttpStatus.NOT_FOUND_MESSAGE,
    //         data: { affectedCount : 0 }
    //     };
    //     } 
    //     else {
    //       let name : string | null = null
    //       let url : string | null = null
    //       let extension : string | null = null
    //       let size : number | null = null
    //       if(isFileDeleted && file == undefined) {
    //         await deleteFromAzureBlob(isNotesExists.browse_file)
    //         name = null
    //         url = null
    //         extension = null
    //         size = null
    //       }
    //       else if(file && !isFileDeleted) {
    //         await deleteFromAzureBlob(isNotesExists.browse_file)
    //         const uploadResult = await uploadToAzureBlob(file, account_rid, "notes");
    //       if(uploadResult.name.length > 100) {
    //         throw new Error("Document name cannot exceed 100 characters");
    //       }  
    //         name = uploadResult.name
    //         url = uploadResult.url
    //         extension = uploadResult.extension
    //         size = uploadResult.size
    //     } else {
    //         name = isNotesExists.document_name
    //         url = isNotesExists.browse_file
    //         extension = isNotesExists.format
    //         size = isNotesExists.size_in_mb
    //     }      
    //     const [affectedCount] = await NotesModel.update({
    //       browse_file: url,
    //       document_name: name,
    //       attach_to: notesData.attach_to,
    //       attachment_level: notesData.attachment_level,
    //       fiscal_year: notesData.fiscal_year,
    //       account_rid: account_rid,
    //       format: extension,
    //       size_in_mb: size,
    //       title: notesData.title,
    //       notes_owner: notesData.notes_owner,
    //       descriptions: notesData.descriptions || null,
    //       modified_by: userId,
    //       modified_datetime : new Date()
    //   }, {
    //     where : {
    //       rid : isNotesExists.rid
    //     }
    //     });
    //     if(affectedCount > 0) {
    //       await NotesTimelineModel.create({
    //           notes_rid : notesData.rid,
    //           document_name: name,
    //           title : notesData.title,
    //           descriptions: notesData.descriptions || null,
    //           notes_owner : notesData.notes_owner,
    //           created_by: userId,
    //           modified_by: userId,
    //           attach_to: notesData.attach_to,
    //           attachment_level: notesData.attachment_level,
    //           event_type: 'ui handler',
    //           event_status: 'success',
    //           event_name: 'update',
    //           event_datetime: new Date(),
    //       })

    //       await TaskSummaryModel.update({
    //           browse_file: url,
    //           document_name: name,
    //           attach_to: notesData.attach_to,
    //           attachment_level: notesData.attachment_level,
    //           fiscal_year: notesData.fiscal_year,
    //           account_rid: account_rid,
    //           format: extension,
    //           size_in_mb: size,
    //           title: notesData.title,
    //           notes_owner : notesData.notes_owner,
    //           descriptions : notesData.descriptions || null,
    //           modified_by : userId,
    //           modified_datetime : new Date()
    //       }, {
    //         where : {
    //           notes_rid : notesData.rid
    //         }
    //       });

    //       return {
    //           statusCode: HttpStatus.SUCCESS,
    //           message: HttpStatus.SUCCESS_MESSAGE,
    //           data: { affectedCount: affectedCount }
    //         };
    //       }
    //     }
    //   }
    //   catch (error) {
    //     console.error('Error updating notes:', error);

    //     return {
    //         statusCode: 500,
    //         message: 'Failed to update Notes',
    //         errorMessage: error instanceof Error ? error.message : 'An unknown error occurred'
    //     };
    //   }
    // }




}