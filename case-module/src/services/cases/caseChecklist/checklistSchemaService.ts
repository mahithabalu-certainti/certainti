import { Op, Sequelize, Transaction } from "sequelize";
import {
  CreateCaseTaskType,
  ICreateChecklist,
  ICreateChecklistItem,
  UpdateCaseTaskType,
} from "../../../utils/types";
import { CaseModelService } from "../../../services/caseModelsService";
import { v4 as uuidv4 } from "uuid";
import {
  ENV_PREFIX,
  HttpStatus,
  MAIN_SCHEMA_NAME,
  rawQueries,
  STATUS_MESSAGE,
} from "../../../utils/constants";
import { HelperMethods } from "../helperMethods";
import { initMainDbSequelize } from "../../../config/mainDataSource";
import { errorLog, logMessage } from "../../../utils/helpers";
import {
  fetchCaseDetails,
  fetchChecklistAttachToDetails,
} from "../../../utils/rawQueries";

export class ChecklistSchemaService {
  private orgDbSequelize: Sequelize | null = null;
  private mainDbSequelize: Sequelize | null = null;
  private caseModelService: CaseModelService;
  private helperMethod: HelperMethods;

  constructor() {
    this.caseModelService = new CaseModelService();
    this.helperMethod = new HelperMethods(
      this.caseModelService
    );
  }

  /**
   * Utility function to add a new checklist item
   * @param AdminCheckListItem - The model instance
   * @param checklistTemplateRid - Parent checklist RID
   * @param item - Checklist item data
   * @param createdBy - User ID who is creating the item
   * @param transaction - Database transaction
   * @returns Promise resolving to the created item
   */
  async addChecklistItem(
    CheckListItem: any,
    checklistRid: string,
    item: ICreateChecklistItem,
    createdBy: string,
    accountRid: string,
    statusRid: string,
    transaction: Transaction
  ) {
    const result = await CheckListItem.create(
      {
        account_rid: accountRid,
        checklist_rid: checklistRid,
        checklist_item_name: item.checklist_item_name,
        checklist_item_description: item.checklist_item_description,
        status_rid: statusRid,
        created_by: createdBy,
        created_datetime: new Date(),
      },
      { transaction }
    );
    logMessage(`Added new checklist item: ${item.checklist_item_name}`);
    return result;
  }

  /**
   * Utility function to edit/update an existing checklist item
   * @param AdminCheckListItem - The model instance
   * @param checklistTemplateRid - Parent checklist RID
   * @param item - Checklist item data
   * @param createdBy - User ID who is modifying the item
   * @param transaction - Database transaction
   * @returns Promise resolving to the updated or created item
   */
  async editChecklistItem(
    CheckListItem: any,
    checklistRid: string,
    item: ICreateChecklistItem,
    createdBy: string,
    transaction: Transaction
  ) {
    // First, find the existing item by template_rid and sequence_no
    const existingItem = await CheckListItem.findOne({
      where: {
        rid: item.checklist_item_rid,
      },
      transaction,
    });

    if (existingItem) {
      // Update existing item
      const result = await existingItem.update(
        {
          checklist_item_name: item.checklist_item_name,
          checklist_item_description: item.checklist_item_description,
          status_rid: item.status_rid,
          modified_by: createdBy,
          modified_datetime: new Date(),
        },
        { transaction }
      );
      logMessage(`Updated checklist item  ${item.checklist_item_name}`);
      return result;
    } else {
      // Item doesn't exist, create it as fallback
      logMessage(`Warning: Checklist item  not found for editing`);
      const result = await CheckListItem.create(
        {
          checklist_item_name: item.checklist_item_name,
          status_rid: item.status_rid,
          created_by: createdBy,
          created_datetime: new Date(),
        },
        { transaction }
      );
      logMessage(
        `Created new checklist item (edit fallback): ${item.checklist_item_name}`
      );
      return result;
    }
  }

  /**
   * Utility function to delete an existing checklist item
   * @param AdminCheckListItem - The model instance
   * @param checklistTemplateRid - Parent checklist RID
   * @param item - Checklist item data
   * @param transaction - Database transaction
   * @returns Promise resolving to the deletion result
   */
  async deleteChecklistItem(
    CheckListItem: any,
    checklistRid: string,
    item: ICreateChecklistItem,
    transaction: Transaction
  ) {
    // Find the item to delete
    const itemToDelete = await CheckListItem.findOne({
      where: {
        rid: item.checklist_item_rid,
      },
      transaction,
    });

    if (itemToDelete) {
      await itemToDelete.destroy({ transaction });
      logMessage(`Deleted checklist item: ${item.checklist_item_name}`);
    } else {
      logMessage(`Warning: Checklist item not found for deletion`);
    }
  }

  async fetchChecklistItems(
    checklistId: string,
    accountNumber: string,
    mainDb?: Sequelize
  ) {
    try {
      const { CheckListItem } = await this.caseModelService.getModels(
        accountNumber
      );
      // Convert Sequelize instances to plain objects

      const items = await CheckListItem.findAll({
        attributes: [
          "rid",
          "checklist_item_name",
          "status_rid",
          "checklist_item_description",
          "created_by",
          "modified_by",
        ],
        order: [["created_datetime", "ASC"]],
        where: { checklist_rid: checklistId },
        raw: true,
      });
      const createdIds: string[] = [
        ...new Set(items.map((d: any) => d.created_by)),
      ];
      const modifiedIds = [...new Set(items.map((d: any) => d.modified_by))];
      let combinedIds: string[] = [];
      combinedIds.push(...createdIds, ...modifiedIds);
      const checklistItemStatusIds = [
        ...new Set(items.map((d: any) => d.status_rid)),
      ];
      const getStatusDetails: any = await mainDb?.query(
        rawQueries.getChecklistItemsStatusDetails(checklistItemStatusIds)
      );
      const getUserDetails: any = await mainDb?.query(
        rawQueries.getOwnerDetails(combinedIds)
      );
      const userMap = new Map(
        getUserDetails[0].map((d: any) => [d.rid, d.name])
      );
      const statusMap = new Map(
        getStatusDetails[0].map((d: any) => [d.rid, d.status_name])
      );

      const finalData = items.map((data: any) => {
        return {
          ...data,
          created_by_name: userMap.get(data.created_by) || null,
          modified_by_name: userMap.get(data.modified_by) || null,
          status_name: statusMap.get(data.status_rid),
        };
      });
      return finalData;
    } catch (err) {
      logMessage(`Error fetching checklist items: ${err}`);
      throw new Error(
        "Error fetching checklist items: " + (err as Error).message
      );
    }
  }

  async fetchChecklistDetailsById(
    checklistId: string,
    accountNumber: string,
    accountRid: string,
    mainDb?: Sequelize
  ) {
    if (!this.orgDbSequelize) {
      this.orgDbSequelize = await this.caseModelService.getSequelize();
    }
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.caseModelService.getMainSequelize();
    }
    const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
      /\D/g,
      ""
    )}`;
    const [checklistDetails]: any[] = await this.orgDbSequelize.query(
      fetchCaseDetails(schemaName, checklistId),
      { type: "SELECT" }
    );
    const [attach_toDetails]: any[] = await this.orgDbSequelize.query(
      fetchChecklistAttachToDetails(
        schemaName,
        checklistDetails.attach_to,
        checklistDetails.attachment_level,
        checklistId
      ),
      { type: "SELECT" }
    );
    if (!checklistDetails) {
      throw new Error("Checklist not found");
    }

    let checklistItems = await this.fetchChecklistItems(
      checklistId,
      accountNumber,
      mainDb
    );

    const userInfo = await this.helperMethod.insertUserDetails(
      checklistDetails.created_by ?? "",
      checklistDetails.modified_by ?? ""
    );

    const [accountInfo]: any[] = await this.mainDbSequelize.query(
      rawQueries.fetchAccountAndCountryDetails(accountRid),
      {
        type: "SELECT",
      }
    );

    const [statusInfo]: any[] = await this.mainDbSequelize.query(
      rawQueries.getStatusDetails(checklistDetails?.status_rid ?? ""),
      {
        type: "SELECT",
      }
    );
    let attached_to = checklistDetails?.attached_to ?? "";
    if (
      checklistDetails?.attach_to === "case" ||
      checklistDetails?.attachment_level === "case"
    ) {
      const [caseInfo]: any[] = await this.orgDbSequelize.query(
        rawQueries.fetchCaseInfo(schemaName, checklistDetails.attach_to),
        {
          type: "SELECT",
        }
      );
      // Compose case name: accountName-countryCode-fiscalYear-caseName
      const accountName = accountInfo.account_name || "";
      const countryCode = accountInfo.country_code || "";
      const fiscalYear = caseInfo?.fiscal_year || "";
      const originalCaseName = caseInfo?.case_name || "";
      const composedCaseName = `${accountName}-${countryCode}-${fiscalYear}-${originalCaseName}`;
      attached_to = composedCaseName;
    }

    // Fetch fiscal_year based on attach_to
    let fiscal_year = null;
    const attachTo = checklistDetails?.attach_to;
    const attachmentLevel = checklistDetails?.attachment_level;
    if (attachmentLevel === "case" && attachTo) {
      const [caseInfo]: any[] = await this.orgDbSequelize.query(
        rawQueries.fetchCaseInfo(schemaName, attachTo),
        { type: "SELECT" }
      );
      fiscal_year = caseInfo?.fiscal_year ?? null;
    } else if (attachmentLevel === "account" && attachTo) {
      fiscal_year = checklistDetails?.fiscal_year ?? null;
    } else if (attachmentLevel === "resource" && attachTo) {
      fiscal_year = checklistDetails?.fiscal_year ?? null;
    } else if (attachmentLevel === "project" && attachTo) {
      const project = await this.helperMethod.fetchProjectInfoById(
        accountNumber,
        attachTo
      );
      fiscal_year = project?.fiscal_year ?? null;
    } else if (attachmentLevel === "project_resource" && attachTo) {
      let projectResource: any =
        await this.helperMethod.fetchProjectResourceById(
          accountNumber,
          attachTo
        );
      if (Array.isArray(projectResource)) projectResource = projectResource[0];
      if (projectResource && projectResource.project_fiscal_rid) {
        const project = await this.helperMethod.fetchProjectInfoById(
          accountNumber,
          projectResource.project_fiscal_rid
        );
        fiscal_year = project?.fiscal_year ?? null;
      }
    } else if (attachmentLevel === "project_task" && attachTo) {
      let projectTask: any = await this.helperMethod.fetchProjectTaskById(
        accountNumber,
        attachTo
      );
      if (Array.isArray(projectTask)) projectTask = projectTask[0];
      if (projectTask && projectTask.project_fiscal_rid) {
        const project = await this.helperMethod.fetchProjectInfoById(
          accountNumber,
          projectTask.project_fiscal_rid
        );
        fiscal_year = project?.fiscal_year ?? null;
      }
    }
    /*else if (attachmentLevel === 'resource' && attachTo) {
          let resource:any = await this.fetchResourceById(accountNumber, attachTo);
          if (Array.isArray(resource)) resource = resource[0];
          if (resource && resource.project_fiscal_rid) {
            const project = await this.fetchProjectInfoById(accountNumber, resource.project_fiscal_rid);
            fiscal_year = project?.fiscal_year ?? null;
          }
        } else if (attachmentLevel === 'resource_cost' && attachTo) {
          let resourceCost:any = await this.fetchResourceCostById(accountNumber, attachTo);
          if (Array.isArray(resourceCost)) resourceCost = resourceCost[0];
          if (resourceCost && resourceCost.resource_rid) {
            let resource :any = await this.fetchResourceById(accountNumber, resourceCost.resource_rid);
            if (Array.isArray(resource)) resource = resource[0];
            if (resource && resource.project_fiscal_rid) {
              const project = await this.fetchProjectInfoById(accountNumber, resource.project_fiscal_rid);
              fiscal_year = project?.fiscal_year ?? null;
            }
          }
        } else if (attachmentLevel === 'resource_skill' && attachTo) {
          let resourceSkill:any = await this.fetchResourceSkillById(accountNumber, attachTo);
          if (Array.isArray(resourceSkill)) resourceSkill = resourceSkill[0];
          if (resourceSkill && resourceSkill.resource_rid) {
            let resource:any = await this.fetchResourceById(accountNumber, resourceSkill.resource_rid);
            if (Array.isArray(resource)) resource = resource[0];
            if (resource && resource.project_fiscal_rid) {
              const project = await this.fetchProjectInfoById(accountNumber, resource.project_fiscal_rid);
              fiscal_year = project?.fiscal_year ?? null;
            }
          }
        } */

    const response: any = {
      attach_to: checklistDetails?.attach_to ?? "",
      attachment_level: checklistDetails?.attachment_level ?? "",
      attached_to: attach_toDetails?.name ?? "",
      checklist_rid: checklistDetails?.rid,
      checklist_name: checklistDetails?.checklist_name ?? "",
      checklist_description: checklistDetails?.checklist_description ?? "",
      r_number: checklistDetails.r_number ?? "",
      status_rid: checklistDetails.status_rid ?? "",
      account_rid: checklistDetails.account_rid ?? "",
      fiscal_year,
      status_name: statusInfo?.status_name ?? "",
      modified_by: userInfo.modified_name ?? checklistDetails.modified_by,
      created_by: userInfo.created_name ?? checklistDetails.created_by,
      created_datetime: checklistDetails.created_datetime ?? null,
      modified_datetime: checklistDetails.modified_datetime ?? null,
      checklist_items: checklistItems ?? [],
    };

    return response;
  }

  async fetchChecklists(
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
    accessibleIds: string[] = [],
    graphqlData?: any
  ) {
    try {
      const { CheckList } = await this.caseModelService.getModels(
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

      const { whereClause } = this.helperMethod.buildRawWhereClause(
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
          await this.helperMethod.getProjectResourcesByProjectIds(
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
          await this.helperMethod.getProjectTasksByProjectIds(
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
          await this.helperMethod.getResourceCostsByResourceIds(
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
          await this.helperMethod.getResourceSkillsByResourceIds(
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
        const caseAttachments = await fetchAttachments(CheckList, "case", [
          entityId,
        ]);
        allChecklists.push(...caseAttachments);
      } else if (attachmentLevel === "account" && entityId) {
        const accountAttachments = await fetchAttachments(
          CheckList,
          "account",
          [entityId]
        );
        allChecklists.push(...accountAttachments);
         const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
          /\D/g,
          ""
        )}`;
        const tableExists = await this.helperMethod.checkTableExists(schemaName, "cases");
      if (tableExists) {
        const cases = await this.helperMethod.getCasesByAccountId(
          accountNumber,
          entityId
        );
        const caseIds = cases.map((c: { rid: any }) => c.rid);
        const caseAttachments = await fetchAttachments(
          CheckList,
          "case",
          caseIds
        );
        allChecklists.push(...caseAttachments);
      }
        const projects = await this.helperMethod.getProjectsByAccountId(
          accountNumber,
          entityId,
          accessibleIds
        );
        const projectIds = projects.map((p: { rid: any }) => p.rid);
        if (projectIds.length > 0) {
          const projectAttachments = await fetchAttachments(
            CheckList,
            "project",
            projectIds
          );
          allChecklists.push(...projectAttachments);

          const projectChildAttachments =
            await fetchProjectResourceTaskAttachmentsBulk(
              CheckList,
              projectIds
            );
          allChecklists.push(...projectChildAttachments);
        }

        const resources = await this.helperMethod.getResourcesByAccountId(
          accountNumber,
          entityId
        );
        const resourceIds = resources.map((r) => (r as { rid: string }).rid);
        if (resourceIds.length > 0) {
          const resourceAttachments = await fetchAttachments(
            CheckList,
            "resource",
            resourceIds
          );
          allChecklists.push(...resourceAttachments);

          const resourceCostSkillAttachments =
            await fetchResourceCostSkillAttachmentsBulk(CheckList, resourceIds);
          allChecklists.push(...resourceCostSkillAttachments);
        }
      } else if (attachmentLevel === "project" && entityId) {
        const projectAttachments = await fetchAttachments(
          CheckList,
          "project",
          [entityId]
        );
        allChecklists.push(...projectAttachments);

        const projectChildAttachments =
          await fetchProjectResourceTaskAttachmentsBulk(CheckList, [entityId]);
        allChecklists.push(...projectChildAttachments);
      }
      // 🔷 Project_resource logic
      else if (attachmentLevel === "project_resource" && entityId) {
        const projectResourceAttachments = await fetchAttachments(
          CheckList,
          "project_resource",
          [entityId]
        );
        allChecklists.push(...projectResourceAttachments);
        const projectResource =
          await this.helperMethod.fetchProjectResourceById(
            accountNumber,
            entityId
          );
        const projectTasks =
          await this.helperMethod.getProjectTasksByProjectIds(accountNumber, [
            (projectResource as any)?.project_fiscal_rid,
          ]);
        const projectTaskIds = projectTasks.map((t) => t.rid);
        if (projectTaskIds.length > 0) {
          const projectTaskAttachments = await fetchAttachments(
            CheckList,
            "project_task",
            projectTaskIds
          );
          allChecklists.push(...projectTaskAttachments);
        }
      }

      // 🔷 Resource logic
      else if (attachmentLevel === "resource" && entityId) {
        const resourceAttachments = await fetchAttachments(
          CheckList,
          "resource",
          [entityId]
        );
        allChecklists.push(...resourceAttachments);

        const resourceCostSkillAttachments =
          await fetchResourceCostSkillAttachmentsBulk(CheckList, [entityId]);
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
          const result = await CheckList.findAll({ where: whereClause });
          allChecklists.push(...result);
        } catch (error) {
          throw new Error("Failed to fetch attachments");
        }
      }
      // 🔷 Fetch display names
      if (graphqlData?.document_rid) {
        allChecklists = allChecklists.filter((d: any) => d != null);
      }
      const { displayNames } =
        await this.helperMethod.getAttachmentDisplayNames(
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
        "checklist_name",
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
          const caseData = await this.helperMethod.fetchCaseById(
            accountNumber,
            attachment.attach_to
          );
          return caseData?.fiscal_year ?? null;
        }
        // ACCOUNT: use fiscal_year from checklist model itself
        if (attachment.attachment_level === "account") {
          return attachment.fiscal_year ?? null;
        }
        if (
          attachment.attachment_level === "resource" ||
          attachment.attachment_level === "resource_cost" ||
          attachment.attachment_level === "resource_skill"
        ) {
          return attachment.fiscal_year ?? null;
        }

        // PROJECT: fetch from project info (project fiscal_year)
        if (attachment.attachment_level === "project" && attachment.attach_to) {
          const project = await this.helperMethod.fetchProjectInfoById(
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
            await this.helperMethod.fetchProjectResourceById(
              accountNumber,
              attachment.attach_to
            );
          if (Array.isArray(projectResource))
            projectResource = projectResource[0];
          if (projectResource && projectResource.project_fiscal_rid) {
            const project = await this.helperMethod.fetchProjectInfoById(
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
          let projectTask: any = await this.helperMethod.fetchProjectTaskById(
            accountNumber,
            attachment.attach_to
          );
          if (Array.isArray(projectTask)) projectTask = projectTask[0];
          if (projectTask && projectTask.project_fiscal_rid) {
            const project = await this.helperMethod.fetchProjectInfoById(
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
        checklists,
        totalCount,
      };
    } catch (err) {
      logMessage(`Error in fetch cases checklists: ${err}`);
      errorLog("Error in fetch cases checklists:", (err as Error).message);
      return [];
    }
  }

  async createCheckList(
    accountNumber: string,
    caseRequest: ICreateChecklist,
    transaction: Transaction
  ) {
    // Implementation for creating checklist in the database
    try {
      const { CheckList } = await this.caseModelService.getModels(
        accountNumber
      );
      const createdChecklist = await CheckList.create(
        {
          account_rid: caseRequest.account_rid,
          attach_to: caseRequest.attach_to,
          attachment_level: caseRequest.attachment_level,
          checklist_name: caseRequest.checklist_name,
          checklist_description: caseRequest.checklist_description,
          checklist_template_rid: caseRequest?.checklist_template_rid || "",
          fiscal_year: caseRequest.fiscal_year,
          created_by: caseRequest.created_by,
          status_rid: caseRequest.status_rid,
          //modified_by: caseRequest.modified_by,
          created_datetime: new Date(),
          case_rid: caseRequest?.case_rid || "",
          //  modified_datetime: caseRequest.modified_datetime,
        },
        { transaction }
      );
      return createdChecklist;
    } catch (error) {
      logMessage(`Error creating checklist: ${error}`);
      throw new Error("Error creating checklist: " + error);
    }
  }

  async createCheckListForTask(
    accountNumber: string,
    caseRequest: ICreateChecklist,
    transaction: Transaction
  ) {
    // Implementation for creating checklist in the database
    try {
      const { CheckList } = await this.caseModelService.getModels(
        accountNumber
      );
      const findCheckListAlreadyCreated = await CheckList.findOne({
        where: {
          attach_to: caseRequest.attach_to,
          attachment_level: "task",
          case_rid: caseRequest.case_rid,
          checklist_template_rid: caseRequest.checklist_rid,
        },
        raw: true,
      });
      if (!findCheckListAlreadyCreated) {
        const createdChecklist = await CheckList.create(
          {
            account_rid: caseRequest.account_rid,
            attach_to: caseRequest.attach_to,
            attachment_level: caseRequest.attachment_level,
            checklist_name: caseRequest.checklist_name,
            checklist_description: caseRequest.checklist_description,
            checklist_template_rid: caseRequest.checklist_rid || "",
            fiscal_year: caseRequest.fiscal_year,
            created_by: caseRequest.created_by,
            status_rid: caseRequest.status_rid,
            //modified_by: caseRequest.modified_by,
            created_datetime: new Date(),
            case_rid: caseRequest.case_rid,
            //  modified_datetime: caseRequest.modified_datetime,
          },
          { transaction }
        );
        return createdChecklist;
      } else {
        return null;
      }
    } catch (error) {
      logMessage(`Error creating checklist: ${error}`);
      throw new Error("Error creating checklist: " + error);
    }
  }

  async updateCheckList(
    accountNumber: string,
    caseRequest: ICreateChecklist,
    transaction: Transaction
  ) {
    // Implementation for creating checklist in the database
    try {
      const { CheckList } = await this.caseModelService.getModels(
        accountNumber
      );
      const existingChecklist = await CheckList.findOne({
        where: { rid: caseRequest.checklist_rid },
      });

      if (!existingChecklist) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: STATUS_MESSAGE.checkListNotFound,
          errorMessage: STATUS_MESSAGE.checkListNotFoundError,
        };
      }
      const createdChecklist = await CheckList.update(
        {
          checklist_name: caseRequest.checklist_name,
          checklist_description: caseRequest.checklist_description,
          status_rid: caseRequest.status_rid,
          fiscal_year: caseRequest.fiscal_year,
          checklist_template_rid: caseRequest?.checklist_template_rid || "",
          modified_by: caseRequest.modified_by,
          modified_datetime: new Date(),
        },
        { where: { rid: caseRequest.checklist_rid }, transaction }
      );

      return createdChecklist;
    } catch (error) {
      logMessage(`Error updating checklist: ${error}`);
      throw new Error("Error updating checklist: " + error);
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

    async updateChecklistItems(data: any, accountNumber: string, transaction: Transaction) {
      if (!this.mainDbSequelize) {
        this.mainDbSequelize = await initMainDbSequelize()
      }
      const { CheckListItem } = await this.caseModelService.getModels(accountNumber);
      const fetchChecklistStatusId: any = await this.mainDbSequelize.query(rawQueries.getChecklistStatusByName(data.status_rid));
  
      const [result] = await CheckListItem.update({
        status_rid: fetchChecklistStatusId[0][0].rid
      }, {
        where: {
          rid: data.rid
        },
        transaction
      });
      if (result === 1) {
        transaction.commit();
        return result;
      } else {
        transaction.rollback()
        return result;
      }
    }
}
