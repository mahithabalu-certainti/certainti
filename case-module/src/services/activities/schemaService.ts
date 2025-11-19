import { initOrgSequelize } from "../../config/orgDataSource";
import dayjs from "dayjs";
import { initMainDbSequelize } from "../../config/mainDataSource";
import {
  col,
  fn,
  Op,
  QueryTypes,
  Sequelize,
  Transaction,
  UUIDV4,
  where,
} from "sequelize";
import { CaseModelService } from "../caseModelsService";
import {
  ALPHANUMERIC_CONDITIONS,
  filtersColumnsForCaseSummary,
  filtersColumnsForReviewProjects,
  filterTypesForCaseSummary,
  filterTypesForReviewProjects,
  HttpStatus,
  MAIN_SCHEMA_NAME,
  mainTableFilters,
  rawQueries,
  SCHEMANAME_PREFIX,
  STATUS_MESSAGE,
} from "../../utils/constants";
import {
  buildDatetimeFilterCondition,
  buildNumericFilterCondition,
  buildStringFilterCondition,
  deleteFromAzureBlob,
  errorLog,
  generateSasUrl,
  getColumnsNamesForTaskCommentsUpdate,
  getColumnsNamesForTaskUpdate,
  logMessage,
  uploadToAzureBlob,
} from "../../utils/helpers";
import {
  AddCommentsType,
  assignProjectType,
  CaseHeadersColumns,
  CaseTaskQueryType,
  CreateCaseTaskType,
  DeleteCommentsType,
  FilterType,
  filterType,
  IActivityTask,
  ICreateCases,
  ICreateCaseTeam,
  ICreateChecklist,
  ICreateChecklistItem,
  TaskTypeResponse,
  TeamMember,
  UpdateCaseTaskType,
  UpdateCommentsType,
} from "../../utils/types";

// Define filterType interface
import { Case, setupCaseSequence } from "../../models/caseModel";
import {
  fetchCaseDetails,
  fetchCasesHeadersDatas,
  fetchCaseSpecificTaskQuery,
  fetchMilestoneTaskTemplate,
  fetchProjectsForCases,
  listAllCasesSummaryQuery,
  listReviewProjectsInfo,
} from "../../utils/rawQueries";
import { CaseProject } from "../../models/caseProjectsModel";
import {
  CaseTimeline,
  setupCaseTimelineSequence,
} from "../../models/caseTimeline";
import {
  CaseHistory,
  setupCaseHistorySequence,
} from "../../models/caseHistory";
import { CaseTeam, setupCaseTeamSequence } from "../../models/caseTeamModel";
import { Jurisdiction } from "../../models/jurisdiction";
import {
  CaseHistorySubmission,
  setupCaseHistorySubmissionSequence,
} from "../../models/caseHistorySubmissionModel";
import { log } from "console";
import { CheckList, setupCheckListSequence } from "../../models/checkListModel";
import { CheckListItem } from "../../models/checkListItemModel";
import { CaseTask, setupCaseTaskSequence } from "../../models/caseTaskModel";
import {
  CaseMilestone,
  setupCaseMilestoneSequence,
} from "../../models/caseMilestoneModel";
import {
  setupTaskCollaboratorsSequence,
  TaskCollaborators,
} from "../../models/taskCollaboratorsModel";
import { setupTaskTagSequence, TaskTag } from "../../models/taskTagsModel";
import { Tags } from "../../models/tagsModel";
import {
  setupTaskCommentsSequence,
  TaskComments,
} from "../../models/taskCommentsModel";
import {
  CommentsAttachments,
  setupCommentsAttachmentsSequence,
} from "../../models/commentsAttachmentModel";
import {
  setupTaskAttachmentsSequence,
  TaskAttachments,
} from "../../models/taskAttachmentModel";
import { Activities } from "../../models/activitiesModel";
import { CaseManagementSchemaService } from "../casesManagement/schemaService";
import CaseSchemaService from "../cases/schemaService";

class ActivitySchemaService {
  private orgDbSequelize: Sequelize | null = null;
  private mainDbSequelize: Sequelize | null = null;
  private caseModelService: CaseModelService;
  private caseSchemaService: CaseSchemaService;

  constructor() {
    this.caseModelService = new CaseModelService();
    this.caseSchemaService = new CaseSchemaService();
  }

  /**
   * Checks if a table exists in the specified schema
   */
  private async checkTableExists(
    schemaName: string,
    tableName: string
  ): Promise<boolean> {
    try {
      if (!this.orgDbSequelize) {
        this.orgDbSequelize = await this.caseModelService.getSequelize();
      }

      const checkTableQuery = rawQueries.checkCaseTableExists(schemaName);

      const [tableExists] = await this.orgDbSequelize.query(checkTableQuery, {
        type: "SELECT",
      });

      if ((tableExists as any).exists === false) {
        return false;
      }
      return true;
    } catch (error) {
      logMessage(`Error checking table existence: ${error}`);
      return false;
    }
  }

  async fetchValidAccountNumberById(accountId: string) {
    try {
      if (!this.mainDbSequelize) {
        this.mainDbSequelize = await this.caseModelService.getMainSequelize();
      }

      const [account]: any[] = await this.mainDbSequelize.query(
        rawQueries.fetchParentAccountDetails,
        {
          replacements: { rid: accountId },
          type: "SELECT",
        }
      );

      let accountRnumber = account?.r_number;

      if (account?.storage_type === "store_in_parent") {
        const [accountData]: any[] = await this.mainDbSequelize.query(
          rawQueries.fetchParentAccountDetails,
          {
            replacements: { rid: account?.parent_account_rid },
            type: "SELECT",
          }
        );
        accountRnumber = accountData?.r_number;
      }

      return {
        accountNumber: accountRnumber,
        accountId: account?.rid,
        accountName: account?.account_name,
        parentAccountId: account?.parent_account_rid,
      };
    } catch (err) {
      logMessage(`Error fetching account: ${err}`);
      throw new Error("Error fetching account : " + (err as Error).message);
    }
  }

  async fetchCheckListForTask(accountNumber: string, caseRid: string) {
    try {
      const { CheckList, CheckListItem } =
        await this.caseModelService.getModels(accountNumber);
      const checklistData = await CheckList.findOne({
        where: { rid: caseRid },
      });
      const checklistItems = await CheckListItem.findAll({
        attributes: [
          "checklist_item_name",
          "checklist_item_description",
          "status_rid",
        ],
        where: { checklist_rid: checklistData?.rid },
      });

      // Fetch status names for each status_rid
      const statusRids = [
        ...new Set(
          checklistItems.map((item) => item.status_rid).filter(Boolean)
        ),
      ].filter((rid): rid is string => typeof rid === "string");
      let statusMap: Record<string, string> = {};
      if (statusRids.length > 0) {
        if (!this.mainDbSequelize) {
          this.mainDbSequelize = await this.caseModelService.getMainSequelize();
        }
        const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
          /\D/g,
          ""
        )}`;
        const statusQuery = rawQueries.fetchCheckListStatusNamesByRids(
          schemaName,
          statusRids
        );
        const statusResults = await this.mainDbSequelize.query(statusQuery, {
          type: "SELECT",
        });
        statusMap = Object.fromEntries(
          statusResults.map((s: any) => [s.rid, s.status_name])
        );
      }

      // Attach status_name to each checklist item
      const response = checklistItems.map((item) => ({
        ...(item.get ? item.get({ plain: true }) : item),
        status_name: item.status_rid
          ? statusMap[item.status_rid] || null
          : null,
      }));

      return {
        checklistData,
        checklistItems: response,
      };
    } catch (err) {
      logMessage(`Error fetching checklist for task: ${err}`);
      throw new Error(
        "Error fetching checklist for task: " + (err as Error).message
      );
    }
  }
  async getTaskType() {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.caseModelService.getMainSequelize();
    }
    const [result] = await this.mainDbSequelize.query<TaskTypeResponse>(
      rawQueries.getSpecificTaskType(),
      { type: QueryTypes.SELECT }
    );
    if (result) return result;
    else return null;
  }
  async getTaskStatus() {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.caseModelService.getMainSequelize();
    }
    const [result] = await this.mainDbSequelize.query<TaskTypeResponse>(
      rawQueries.getSpecificTaskStatus(),
      { type: QueryTypes.SELECT }
    );
    if (result) return result;
    else return null;
  }
  async createActivityTask(
    accountNumber: string,
    taskRequest: IActivityTask,
    transaction: Transaction
  ) {
    // Implementation for creating interactions in the database
    try {
      const { Activities } = await this.caseModelService.getModels(
        accountNumber
      );

      // Ensure account_rid is properly set and not undefined
      const activityData = {
        ...taskRequest,
        activity_type: "Task",
        account_rid: taskRequest.accountRid || taskRequest.account_rid || "",
      };

      const casecreationResponse = await Activities.create(activityData, {
        transaction,
      });

      await this.addTaskManagementTimeline(
        accountNumber,
        casecreationResponse.rid,
        taskRequest.account_rid!,
        taskRequest,
        taskRequest.created_by || "",
        "created",
        "success",
        null,
        taskRequest.attachment_level || "case"
      );

      return casecreationResponse;
    } catch (error) {
      logMessage(`Error creating case: ${error}`);
      throw new Error("Error creating case: " + error);
    }
  }
  async updateActivityTask(
    accountNumber: string,
    taskRequest: IActivityTask,
    transaction: Transaction,
    userId: string
  ) {
    // Implementation for updating interactions in the database
    try {
      const { Activities } = await this.caseModelService.getModels(
        accountNumber
      );
      const existingTask = await Activities.findOne({
        where: { rid: taskRequest.task_rid },
        transaction,
      });
      const [updatedResult] = await Activities.update(taskRequest, {
        where: {
          rid: taskRequest.task_rid,
        },
        transaction,
      });
      const checkIsDifferentCollaborator = await this.isNewCollaborator(
        taskRequest.modified_by!,
        accountNumber
      );
      if (!checkIsDifferentCollaborator && taskRequest?.modified_by) {
        const checkCollaboratorExists = await this.isCollaboratorAlreadyAdded(
          taskRequest.modified_by!,
          taskRequest.task_rid,
          taskRequest.account_rid!,
          accountNumber
        );
        if (!checkCollaboratorExists) {
          await TaskCollaborators.create(
            {
              account_rid: taskRequest.account_rid!,
              task_rid: taskRequest.task_rid,
              assigned_to: taskRequest?.modified_by,
              created_by: taskRequest.modified_by,
              created_datetime: new Date(),
            },
            { transaction }
          );
        }
      }
      await this.updateTaskHistory(
        accountNumber,
        taskRequest.task_rid as string,
        { ...taskRequest, modified_by: userId },
        existingTask
      );
      await this.addTaskManagementTimeline(
        accountNumber,
        taskRequest.task_rid,
        taskRequest.account_rid!,
        taskRequest,
        userId,
        "updated",
        "success",
        existingTask
      );

      return updatedResult;
    } catch (error) {
      logMessage(`Error creating case: ${error}`);
      throw new Error("Error creating case: " + error);
    }
  }
  async isNewCollaborator(rid: string, accountNumber: string) {
    const { Activities } = await this.caseModelService.getModels(accountNumber);
    const result = await Activities.findOne({
      where: {
        assigned_to: rid,
      },
      raw: true,
    });
    if (result) return result;
    else return null;
  }
  async isCollaboratorAlreadyAdded(
    assignedTo: string,
    taskRid: string,
    accountRid: string,
    accountNumber: string
  ) {
    const { TaskCollaborators } = await this.caseModelService.getModels(
      accountNumber
    );
    const result = await TaskCollaborators.findOne({
      where: {
        assigned_to: assignedTo,
        account_rid: accountRid,
        task_rid: taskRid,
      },
      raw: true,
    });
    if (result) return result;
    else return null;
  }
  async fetchActivities(
    accountNumber: string,
    fiscalYear: number,
    attachmentLevel?: string,
    entityId?: string,
    accountRid?: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
    filters: Record<string, any> = {},
    sortBy: string = "created_datetime",
    sortOrder: string = "DESC",
    apiType: string = "list",
    graphqlData?: any
  ) {
    try {
      const { Activities } = await this.caseModelService.getModels(
        accountNumber
      );
      let allChecklists: any[] = [];

      // Handle attached_to and uploaded_by filters separately
      let attachedToFilter;
      let createdByFilter;
      let modifiedByFilter;
      let notesOwnerFilter;
      if (filters.attached_to) {
        attachedToFilter = filters.attached_to;
        delete filters.attached_to;
      }
      if (filters.created_by_name) {
        createdByFilter = filters.created_by_name;
        delete filters.created_by_name;
      }
      if (filters.modified_by_name) {
        modifiedByFilter = filters.modified_by_name;
        delete filters.modified_by_name;
      }

      const { whereClause } = this.caseSchemaService.buildRawWhereClause(
        filters,
        search
      );
      if (fiscalYear !== 0) {
        if (!whereClause[Op.and] || !Array.isArray(whereClause[Op.and])) {
          whereClause[Op.and] = [];
        }
        whereClause[Op.and].push({ fiscal_year: fiscalYear });
      }
      const fetchAttachments = async (
        model: any,
        level: string,
        attachToIds: string[]
      ) => {
        if (attachToIds.length === 0) return [];
        let where;
        where = {
          [Op.and]: [
            { attachment_level: level },
            { attach_to: { [Op.in]: attachToIds } },
            ...(whereClause[Op.and] || []),
          ],
        };
        return model.findAll({ where });
      };
      // 🔷 Optimized project resource + task attachments fetch for multiple projects
      const fetchProjectResourceTaskAttachmentsBulk = async (
        model: any,
        projectIds: string[]
      ) => {
        let projectChildAttachments: any[] = [];
        if (projectIds.length === 0) return projectChildAttachments;

        // 🔹 Fetch all project_resources under projects in one call
        const projectResources =
          await this.caseSchemaService.getProjectResourcesByProjectIds(
            accountNumber,
            projectIds
          );
        const projectResourceIds = projectResources.map((r) => r.rid);

        if (projectResourceIds.length > 0) {
          const projectResourceAttachments = await fetchAttachments(
            model,
            "project_resource",
            projectResourceIds
          );
          projectChildAttachments.push(...projectResourceAttachments);
        }

        // 🔹 Fetch all project_tasks under projects in one call
        const projectTasks =
          await this.caseSchemaService.getProjectTasksByProjectIds(
            accountNumber,
            projectIds
          );
        const projectTaskIds = projectTasks.map((t) => t.rid);

        if (projectTaskIds.length > 0) {
          const projectTaskAttachments = await fetchAttachments(
            model,
            "project_task",
            projectTaskIds
          );
          projectChildAttachments.push(...projectTaskAttachments);
        }

        return projectChildAttachments;
      };

      // 🔷 Optimized resource cost and skill attachments fetch for multiple resources
      const fetchResourceCostSkillAttachmentsBulk = async (
        model: any,
        resourceIds: string[]
      ) => {
        let resourceCostSkillAttachments: any[] = [];
        if (resourceIds.length === 0) return resourceCostSkillAttachments;

        // 🔹 Fetch all resource_costs in one call
        const resourceCosts =
          await this.caseSchemaService.getResourceCostsByResourceIds(
            accountNumber,
            resourceIds
          );
        const allResourceCostIds = resourceCosts.map((rc) => rc.rid);
        if (allResourceCostIds.length > 0) {
          const resourceCostAttachments = await fetchAttachments(
            model,
            "resource_cost",
            allResourceCostIds
          );
          resourceCostSkillAttachments.push(...resourceCostAttachments);
        }

        // 🔹 Fetch all resource_skills in one call
        const resourceSkills =
          await this.caseSchemaService.getResourceSkillsByResourceIds(
            accountNumber,
            resourceIds
          );
        const allResourceSkillIds = resourceSkills.map((rs) => rs.rid);
        if (allResourceSkillIds.length > 0) {
          const resourceSkillAttachments = await fetchAttachments(
            model,
            "resource_skill",
            allResourceSkillIds
          );
          resourceCostSkillAttachments.push(...resourceSkillAttachments);
        }

        return resourceCostSkillAttachments;
      };
      if (attachmentLevel === "case" && entityId) {
        const caseAttachments = await fetchAttachments(Activities, "case", [
          entityId,
        ]);
        allChecklists.push(...caseAttachments);
      } else if (attachmentLevel === "account" && entityId) {
        const accountAttachments = await fetchAttachments(
          Activities,
          "account",
          [entityId]
        );
        allChecklists.push(...accountAttachments);
        const caseAttachments = await fetchAttachments(Activities, "case", [
          entityId,
        ]);
        allChecklists.push(...caseAttachments);

        const projects = await this.caseSchemaService.getProjectsByAccountId(
          accountNumber,
          entityId
        );
        const projectIds = projects.map((p: { rid: any }) => p.rid);
        if (projectIds.length > 0) {
          const projectAttachments = await fetchAttachments(
            Activities,
            "project",
            projectIds
          );
          allChecklists.push(...projectAttachments);

          const projectChildAttachments =
            await fetchProjectResourceTaskAttachmentsBulk(
              Activities,
              projectIds
            );
          allChecklists.push(...projectChildAttachments);
        }

        const resources = await this.caseSchemaService.getResourcesByAccountId(
          accountNumber,
          entityId
        );
        const resourceIds = resources.map((r) => (r as { rid: string }).rid);
        if (resourceIds.length > 0) {
          const resourceAttachments = await fetchAttachments(
            Activities,
            "resource",
            resourceIds
          );
          allChecklists.push(...resourceAttachments);

          const resourceCostSkillAttachments =
            await fetchResourceCostSkillAttachmentsBulk(
              Activities,
              resourceIds
            );
          allChecklists.push(...resourceCostSkillAttachments);
        }
      } else if (attachmentLevel === "project" && entityId) {
        const projectAttachments = await fetchAttachments(
          Activities,
          "project",
          [entityId]
        );
        allChecklists.push(...projectAttachments);

        const projectChildAttachments =
          await fetchProjectResourceTaskAttachmentsBulk(Activities, [entityId]);
        allChecklists.push(...projectChildAttachments);
      }
      // 🔷 Project_resource logic
      else if (attachmentLevel === "project_resource" && entityId) {
        const projectResourceAttachments = await fetchAttachments(
          Activities,
          "project_resource",
          [entityId]
        );
        allChecklists.push(...projectResourceAttachments);
        const projectResource =
          await this.caseSchemaService.fetchProjectResourceById(
            accountNumber,
            entityId
          );
        const projectTasks =
          await this.caseSchemaService.getProjectTasksByProjectIds(
            accountNumber,
            [(projectResource as any)?.project_fiscal_rid]
          );
        const projectTaskIds = projectTasks.map((t) => t.rid);
        if (projectTaskIds.length > 0) {
          const projectTaskAttachments = await fetchAttachments(
            Activities,
            "project_task",
            projectTaskIds
          );
          allChecklists.push(...projectTaskAttachments);
        }
      }

      // 🔷 Resource logic
      else if (attachmentLevel === "resource" && entityId) {
        const resourceAttachments = await fetchAttachments(
          Activities,
          "resource",
          [entityId]
        );
        allChecklists.push(...resourceAttachments);

        const resourceCostSkillAttachments =
          await fetchResourceCostSkillAttachmentsBulk(Activities, [entityId]);
        allChecklists.push(...resourceCostSkillAttachments);
      } else {
        if (!whereClause[Op.and] || !Array.isArray(whereClause[Op.and])) {
          whereClause[Op.and] = [];
        }
        if (entityId) {
          whereClause[Op.and].push({ attach_to: entityId });
        } else if (attachmentLevel) {
          whereClause[Op.and].push({ attachment_level: attachmentLevel });
        }

        try {
          const result = await Activities.findAll({ where: whereClause });
          allChecklists.push(...result);
        } catch (error) {
          console.error("Error fetching attachments:", error);
          throw new Error("Failed to fetch attachments");
        }
      }
      // 🔷 Fetch display names
      if (graphqlData?.document_rid) {
        allChecklists = allChecklists.filter((d: any) => d != null);
      }
      const { displayNames } =
        await this.caseSchemaService.getAttachmentDisplayNames(
          allChecklists,
          accountNumber
        );
      if (attachedToFilter) {
        allChecklists = allChecklists.filter((attachment) => {
          let displayName =
            displayNames[attachment.rid] || String(attachment.attach_to) || "";
          const displayValue = displayName.toLowerCase();
          const operator = Object.keys(attachedToFilter)[0];
          const filterValue = (
            operator ? attachedToFilter[operator] || "" : ""
          ).toLowerCase();
          switch (operator) {
            case "contains":
              return displayValue.includes(filterValue);
            case "equals":
              return displayValue === filterValue;
            case "not_equals":
              return displayValue !== filterValue || displayValue === null;
            default:
              return false;
          }
        });
      }

      // 🔷 Sort
      const validSortFields = [
        "task_name",
        "r_number",
        "attachment_level",
        "attached_to",
        "created_datetime",
        "descriptions",
        "created_by_name",
        "fiscal_year",
        "modified_by_name",
        "modified_datetime",
      ];
      const finalSortBy = validSortFields.includes(sortBy)
        ? sortBy
        : "created_datetime";
      const finalSortOrder = ["ASC", "DESC"].includes(sortOrder.toUpperCase())
        ? sortOrder.toUpperCase()
        : "DESC";

      allChecklists.sort((a, b) => {
        // Special handling for created_datetime
        if (finalSortBy === "created_datetime") {
          const aDate = new Date(a[finalSortBy]).getTime();
          const bDate = new Date(b[finalSortBy]).getTime();
          return finalSortOrder === "ASC" ? aDate - bDate : bDate - aDate;
        }

        let aVal =
          finalSortBy === "attached_to"
            ? displayNames[a.rid] ?? ""
            : a[finalSortBy] ?? "";
        let bVal =
          finalSortBy === "attached_to"
            ? displayNames[b.rid] ?? ""
            : b[finalSortBy] ?? "";

        // Convert to string safely
        aVal =
          typeof aVal === "string"
            ? aVal.toLowerCase()
            : String(aVal).toLowerCase();
        bVal =
          typeof bVal === "string"
            ? bVal.toLowerCase()
            : String(bVal).toLowerCase();

        const aEmpty = !aVal || aVal.trim() === "";
        const bEmpty = !bVal || bVal.trim() === "";

        if (aEmpty && bEmpty) return 0; // Both empty – equal
        if (aEmpty) return finalSortOrder === "ASC" ? 1 : -1; // a empty comes last in ASC, first in DESC
        if (bEmpty) return finalSortOrder === "ASC" ? -1 : 1; // b empty comes last in ASC, first in DESC

        // Both non-empty, normal comparison
        return finalSortOrder === "ASC"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      });
      const paginatedAttachments = allChecklists;

      // 🔷 Map document types and users
      const userIds = [
        ...new Set(
          paginatedAttachments.flatMap((att) => [
            att.created_by,
            att.modified_by,
            att.notes_owner,
          ])
        ),
      ];

      const mainSequelize = await initMainDbSequelize();
      const [users] = await Promise.all([
        userIds.length > 0
          ? mainSequelize.query(rawQueries.listUsersByIds(userIds), {
              replacements: { userIds },
              type: "SELECT",
            })
          : Promise.resolve([]),
      ]);
      const userMap = new Map(users.map((u: any) => [u.rid, u.full_name]));

      let checklists: any[];
      // Enhanced fiscal_year enrichment for all checklist types
      const getFiscalYearForChecklist = async (attachment: any) => {
        // CASE: fetch from Case model
        if (attachment.attachment_level === "case" && attachment.attach_to) {
          const caseData = await this.caseSchemaService.fetchCaseById(
            accountNumber,
            attachment.attach_to
          );
          return caseData?.fiscal_year ?? null;
        }
        // ACCOUNT: use fiscal_year from checklist model itself
        if (attachment.attachment_level === "account") {
          return attachment.fiscal_year ?? null;
        }
        // PROJECT: fetch from project info (project fiscal_year)
        if (attachment.attachment_level === "project" && attachment.attach_to) {
          const project = await this.caseSchemaService.fetchProjectInfoById(
            accountNumber,
            attachment.attach_to
          );
          return project?.fiscal_year ?? null;
        }
        // PROJECT_RESOURCE: fetch project_resource, then project fiscal_year
        if (
          attachment.attachment_level === "project_resource" &&
          attachment.attach_to
        ) {
          let projectResource: any =
            await this.caseSchemaService.fetchProjectResourceById(
              accountNumber,
              attachment.attach_to
            );
          if (Array.isArray(projectResource))
            projectResource = projectResource[0];
          if (projectResource && projectResource.project_fiscal_rid) {
            const project = await this.caseSchemaService.fetchProjectInfoById(
              accountNumber,
              projectResource.project_fiscal_rid
            );
            return project?.fiscal_year ?? null;
          }
          return null;
        }
        // PROJECT_TASK: fetch project_task, then project fiscal_year
        if (
          attachment.attachment_level === "project_task" &&
          attachment.attach_to
        ) {
          let projectTask: any =
            await this.caseSchemaService.fetchProjectTaskById(
              accountNumber,
              attachment.attach_to
            );
          if (Array.isArray(projectTask)) projectTask = projectTask[0];
          if (projectTask && projectTask.project_fiscal_rid) {
            const project = await this.caseSchemaService.fetchProjectInfoById(
              accountNumber,
              projectTask.project_fiscal_rid
            );
            return project?.fiscal_year ?? null;
          }
          return null;
        }

        // Default: fallback to null
        return null;
      };

      checklists = await Promise.all(
        paginatedAttachments.map(async (attachment) => {
          const fiscal_year = await getFiscalYearForChecklist(attachment);
          return {
            ...attachment.get({ plain: true }),
            created_by_name:
              userMap.get(attachment.created_by) || attachment.created_by,
            modified_by_name:
              userMap.get(attachment.modified_by) || attachment.modified_by,
            attached_to: displayNames[attachment.rid] || attachment.attach_to,
            fiscal_year,
          };
        })
      );
      if (sortBy === "created_by_name") {
        checklists.sort((a, b) => {
          const aType = a.created_by_name || "";
          const bType = b.created_by_name || "";
          const aEmpty = !aType || aType.trim() === "";
          const bEmpty = !bType || bType.trim() === "";

          if (aEmpty && bEmpty) return 0;
          if (aEmpty) return finalSortOrder === "ASC" ? 1 : -1;
          if (bEmpty) return finalSortOrder === "ASC" ? -1 : 1;

          return finalSortOrder === "ASC"
            ? aType.localeCompare(bType)
            : bType.localeCompare(aType);
        });
      }

      if (sortBy === "modified_by_name") {
        checklists.sort((a, b) => {
          const aType = a.modified_by_name || "";
          const bType = b.modified_by_name || "";
          const aEmpty = !aType || aType.trim() === "";
          const bEmpty = !bType || bType.trim() === "";

          if (aEmpty && bEmpty) return 0;
          if (aEmpty) return finalSortOrder === "ASC" ? 1 : -1;
          if (bEmpty) return finalSortOrder === "ASC" ? -1 : 1;

          return finalSortOrder === "ASC"
            ? aType.localeCompare(bType)
            : bType.localeCompare(aType);
        });
      }
      if (createdByFilter) {
        let filterValue;
        checklists = checklists.filter((checklist) => {
          const uploadedBy = checklist.created_by_name?.toLowerCase() || "";
          const operator = Object.keys(createdByFilter)[0];
          if (operator === "is_empty") filterValue = "";
          else
            filterValue = (
              operator ? createdByFilter[operator] || "" : ""
            ).toLowerCase();
          switch (operator) {
            case "contains":
              return uploadedBy.includes(filterValue);
            case "equals":
              return uploadedBy === filterValue;
            case "not_equals":
              return uploadedBy !== filterValue;
            case "is_empty":
              return uploadedBy === null || uploadedBy === "";
            default:
              return false;
          }
        });
      }
      if (modifiedByFilter) {
        let filterValue;
        checklists = checklists.filter((checklist) => {
          const uploadedBy = checklist.modified_by_name?.toLowerCase() || "";
          const operator = Object.keys(modifiedByFilter)[0];
          if (operator === "is_empty") filterValue = "";
          else
            filterValue = (
              operator && modifiedByFilter[operator]
                ? modifiedByFilter[operator]
                : ""
            ).toLowerCase();
          switch (operator) {
            case "contains":
              return uploadedBy.includes(filterValue);
            case "equals":
              return uploadedBy === filterValue;
            case "not_equals":
              return uploadedBy !== filterValue;
            case "is_empty":
              return uploadedBy === null || uploadedBy === "";
            default:
              return false;
          }
        });
      }
      const totalCount = checklists.length;
      if (apiType === "download") {
        return {
          checklists,
          totalCount,
        };
      }
      checklists = checklists.slice((page - 1) * limit, page * limit);
      return {
        activities: checklists,
        totalCount,
      };
    } catch (err) {
      logMessage(`Error in fetch cases checklists: ${err}`);
      errorLog("Error in fetch cases checklists:", (err as Error).message);
      return [];
    }
  }

  async addTaskTimeline(
    accountNumber: string,
    entity_rid: string,
    accountRid: string,
    description: string,
    userId: string,
    eventName: string,
    eventStatus: string,
    taskRid: string = ""
  ) {
    try {
      const {Activities} = await this.caseModelService.getModels(
        accountNumber
      );
      const entityresponse:any = await Activities.findOne({
        where: { rid: taskRid },
        raw: true,
      });
    if(!entityresponse) {
      logMessage(`No entity found for rid: ${taskRid}`);
      return;
    }
    else {
      const attachmentLevel = entityresponse?.attachment_level || "case";
      if(!this.orgDbSequelize) {
          this.orgDbSequelize = await this.caseModelService.getSequelize();
        }
        const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
          /\D/g,
          ""
        )}`;
        let insertQuery = "";
      console.log("In add task timeline...", entity_rid, accountRid, attachmentLevel);
      if (attachmentLevel === "case") {
        /*const { CaseTimeline } = await this.caseModelService.getModels(
          accountNumber
        );
        console.log("Adding case timeline...", entity_rid, accountRid, userId);
        await CaseTimeline.create({
          account_rid: accountRid,
          event_name: eventName,
          event_status: eventStatus,
          event_type: "ui handler",
          entity_rid: entity_rid || "",
          description: description,
          created_by: userId,
          event_datetime: new Date(),
          created_datetime: new Date(),
        }); */
          insertQuery = rawQueries.insertTimeline(schemaName,"case_timeline");
      }
      else if(attachmentLevel === "project") {
         insertQuery = rawQueries.insertTimeline(schemaName,"project_timeline");
      }
      else if(attachmentLevel === "project_resource") {
         insertQuery = rawQueries.insertTimeline(schemaName,"project_resource_timeline");
      }
      else if(attachmentLevel === "project_task") {
         insertQuery = rawQueries.insertTimeline(schemaName,"project_task_timeline");
      }
      else if(attachmentLevel === "resource") {
         insertQuery = rawQueries.insertTimeline(schemaName,"resource_timeline");
      }
      else {
        insertQuery = rawQueries.insertTimeline(schemaName,"account_timeline");
      }


        await this.orgDbSequelize.query(insertQuery, {
          type: QueryTypes.INSERT,
          replacements: {
            event_name: eventName,
            event_status: eventStatus,
            event_type: "ui handler",
            entity_rid: entity_rid || "",
            description: description,
            created_by: userId,
            event_datetime: new Date(),
            created_datetime: new Date()
          }
        });
      }
    } catch (err) {
      logMessage(`Error creating case team timeline: ${err}`);
    }
  }

  async addTaskManagementTimeline(
    accountNumber: string,
    taskRid: string,
    accountRid: string,
    taskData: any,
    userId: string,
    operation: "created" | "updated",
    eventStatus: string = "success",
    existingTaskData?: any,
    attachmentLevel: string = "case"
  ) {
    try {
      console.log("Adding task management timeline...", taskRid, accountRid, userId, operation);
      const eventName =
        operation === "created" ? "Task Created" : "Task Updated";
      let description = "";

      if (operation === "created") {
        description = `Task created with name: ${taskData.task_name || "N/A"}`;
      } else {
        // For updates, show specific fields that changed
        const changes = this.generateChangeDescription(
          taskData,
          existingTaskData
        );
        description =
          changes.length > 0
            ? `Task updated: ${changes.join(", ")}`
            : "Task updated";
      }

      await this.addTaskTimeline(
        accountNumber,
        taskRid,
        accountRid,
        description,
        userId,
          eventName,
        eventStatus,
        attachmentLevel
      );
    } catch (err) {
      logMessage(`Error creating task management timeline: ${err}`);
      // Don't throw error for timeline issues to avoid breaking main functionality
    }
  }
  private generateChangeDescription(newData: any, existingData: any): string[] {
    if (!existingData) return [];

    const changes: string[] = [];
    const fieldMappings: { [key: string]: string } = {
      task_name: "task name",
      description: "description",
      fiscal_year: "fiscal year",
      priority_rid: "priority",
      status_rid: "status",
    };

    // Define which fields are dates
    const dateFields = ["effective_start_datetime", "effective_end_datetime"];

    for (const [field, displayName] of Object.entries(fieldMappings)) {
      if (
        newData[field] !== undefined &&
        newData[field] !== existingData[field]
      ) {
        let oldValue = existingData[field] || "N/A";
        let newValue = newData[field] || "N/A";

        // Format dates using the same function as case team timeline
        if (dateFields.includes(field)) {
          oldValue =
            oldValue !== "N/A" ? this.formatDateForDisplay(oldValue) : "N/A";
          newValue =
            newValue !== "N/A" ? this.formatDateForDisplay(newValue) : "N/A";
        }

        changes.push(`${displayName} changed to "${newValue}"`);
      }
    }

    return changes;
  }
  /**
   * Formats dates for display in error messages
   */
  private formatDateForDisplay(date: Date | string | null): string {
    if (!date) return "";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toISOString().split("T")[0] || "invalid-date";
  }

  async updateTaskHistory(
    accountNumber: string,
    taskId: string,
    newTaskData: any,
    existingTaskData: any
  ) {
    try {
      const { TaskHistory } = await this.caseModelService.getModels(
        accountNumber
      );

      const excludedFields = [
        "created_by",
        "modified_by",
        "task_rid",
        "account_rid",
        "modified_datetime",
      ];

      const cleanedNewData = Object.fromEntries(
        Object.entries(newTaskData).filter(
          ([key]) => !excludedFields.includes(key)
        )
      );

      const historyChanges = Object.entries(cleanedNewData)
        .filter(([key, newValue]) => {
          const oldValue = existingTaskData[key];

          if (newValue == null && oldValue == null) return false;

          if (typeof newValue === "number" || typeof oldValue === "number") {
            return Number(newValue) !== Number(oldValue);
          }

          return String(newValue ?? "") !== String(oldValue ?? "");
        })
        .map(([key, newValue]) => ({
          task_rid: taskId,
          attribute_name: key,
          old_value:
            existingTaskData[key] !== null &&
            existingTaskData[key] !== undefined
              ? String(existingTaskData[key])
              : "",
          new_value:
            newValue !== null && newValue !== undefined ? String(newValue) : "",
          created_by: newTaskData["modified_by"],
        }));

      if (historyChanges.length === 0) return;

      // Use individual create operations to avoid sequence conflicts
      for (const historyChange of historyChanges) {
        await TaskHistory.create(historyChange);
      }
    } catch (err) {
      logMessage(`Error updating project history : ${JSON.stringify(err)}`);
      errorLog("Error updating project history : " + (err as Error).message);
      throw new Error(
        "Error updating project history : " + (err as Error).message
      );
    }
  }

   async checkIsActivityTaskUnique(
      taskReq: any,
      accountNumber: string
    ): Promise<boolean> {
      const { Activities } = await this.caseModelService.getModels(accountNumber);
      const response = await Activities.findOne({
        where: {
          [Op.and]: [
            where(
              fn("LOWER", col("task_name")),
              Op.eq,
              taskReq.task_name.toLowerCase()
            ),
            {activity_type: 'task' }
          ]
        }
      });
      return !response;
    }

  async  checkIsExistingActivityTaskUnique(taskReq: any, accountNumber: string): Promise<boolean> {
  const { Activities } = await this.caseModelService.getModels(accountNumber);
  const response = await Activities.findOne({
    where: {
      [Op.and]: [
        where(
          fn("LOWER", col("task_name")),
          Op.eq,
          taskReq.task_name.toLowerCase()
        ),
        { rid: { [Op.ne]: taskReq.task_rid } },
        {activity_type: 'task' }
      ]
    }
  });
  return !response;
}
}

export default ActivitySchemaService;
