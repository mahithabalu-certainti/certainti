import { Op, Sequelize, Transaction } from "sequelize";
import {
  MAIN_SCHEMA_NAME,
  rawQueries,
  ruleNames,
  ruleTemplateNames,
  SCHEMANAME_PREFIX,
} from "../../utils/constants";
import { CaseModelService } from "../caseModelsService";
import { errorLog, logMessage } from "../../utils/helpers";
import { ICreateChecklist, ICreateChecklistItem } from "../../utils/types";
import { ChecklistSchemaService } from "./caseChecklist/checklistSchemaService";
import { initMainDbSequelize } from "../../config/mainDataSource";
import axios from "axios";

export class HelperMethods {
  private orgDbSequelize: Sequelize | null = null;
  private mainDbSequelize: Sequelize | null = null;
  private caseModelService: CaseModelService;
  private checklistService?: ChecklistSchemaService;

  constructor(
    caseModelService: CaseModelService
  ) {
    this.caseModelService = caseModelService
  }

  /**
   * Fetches project tasks for multiple project IDs using a single SQL query
   *
   * @param {string} accountNumber - Account number to determine schema
   * @param {string[]} projectIds - Array of project IDs
   * @returns {Promise<any[]>} - Project_task data
   */
  async getProjectTasksByProjectIds(
    accountNumber: string,
    projectIds: string[]
  ): Promise<any[]> {
    try {
      if (!projectIds?.length) return [];

      const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
        /\D/g,
        ""
      )}`;
      if (!this.orgDbSequelize) {
        this.orgDbSequelize = await this.caseModelService.getSequelize();
      }

      // Check if project_task table exists
      const checkTableQuery = rawQueries.checkProjectTaskExists(schemaName);

      const [tableExists] = await this.orgDbSequelize.query(checkTableQuery, {
        type: "SELECT",
      });

      if ((tableExists as any).exists === false) {
        return [];
      }

      const query = rawQueries.fetchProjectTaskAndFiscal(schemaName);

      const results = await this.orgDbSequelize.query(query, {
        replacements: { projectIds },
        type: "SELECT",
      });

      return results;
    } catch (error) {
      console.error("Error fetching project tasks:", error);
      throw error;
    }
  }
  async fetchChecklistTemplateDetailsById(checklistId: string) {
    ``;
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.caseModelService.getMainSequelize();
    }

    const [checklistDetailsResult] = (await this.mainDbSequelize.query(
      rawQueries.fetchChecklistTemplates,
      {
        replacements: { checklistId },
        type: "SELECT",
      }
    )) as [any[], any];

    if (!checklistDetailsResult || checklistDetailsResult.length === 0) {
      return null;
    }

    const checklistDetails = checklistDetailsResult as any;

    let checklistItems = await this.fetchChecklistTemplateItems(checklistId);

    const userInfo = await this.insertUserDetails(
      checklistDetails.created_by ?? "",
      checklistDetails.modified_by ?? ""
    );

    const response: any = {
      checklist_template_rid: checklistDetails?.rid,
      checklist_name: checklistDetails?.checklist_name ?? "",
      checklist_description: checklistDetails?.checklist_description ?? "",
      r_number: checklistDetails.r_number ?? "",
      status_rid: checklistDetails.status_rid ?? "",
      status_name: checklistDetails.status_name ?? "",
      modified_by: userInfo.modified_name ?? checklistDetails.modified_by,
      created_by: userInfo.created_name ?? checklistDetails.created_by,
      created_datetime: checklistDetails.created_datetime ?? null,
      modified_datetime: checklistDetails.modified_datetime ?? null,
      checklist_items: checklistItems ?? [],
    };

    return response;
  }
  async fetchChecklistTemplateItems(checklistId: string) {
    try {
      const { AdminCheckListItem } = await this.caseModelService.getModels("");
      // Convert Sequelize instances to plain objects

      const items = await AdminCheckListItem.findAll({
        attributes: [
          "rid",
          "checklist_item_name",
          "checklist_template_rid",
          "description",
        ],
        order: [["created_datetime", "ASC"]],
        where: { $checklist_template_rid$: checklistId },
      });
      const plainItems = items.map((item) => item.get({ plain: true }));
      return items;
    } catch (err) {
      logMessage(`Error fetching interaction template items: ${err}`);
      throw new Error(
        "Error fetching interaction template items: " + (err as Error).message
      );
    }
  }
  async insertUserDetails(
    createdById: string,
    modifiedById: string
  ): Promise<any> {
    try {
      if (!this.mainDbSequelize) {
        this.mainDbSequelize = await this.caseModelService.getMainSequelize();
      }

      const getUserFullName = async (userId: string) => {
        if (!userId) return null;

        const [results]: any = await this.mainDbSequelize?.query(
          rawQueries.getUserNameByIdQuery(),
          {
            replacements: { userId },
            type: "SELECT",
          }
        );

        if (!results) return null;

        const { first_name, middle_name, last_name } = results as any;
        return [first_name, middle_name, last_name].filter(Boolean).join(" ");
      };

      const createdName = await getUserFullName(createdById);
      const modifiedName = await getUserFullName(modifiedById);

      return {
        created_name: createdName || null,
        modified_name: modifiedName || null,
      };
    } catch (err) {
      logMessage(`Error adding user details: ${err}`);
      throw new Error("Error adding user details" + (err as Error).message);
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
  async manageCheckListItems(
    accountNumber: string,
    checklistReq: ICreateChecklist,
    checklistRid: string,
    transaction: Transaction
  ): Promise<any[]> {
    // Implementation for managing checklist items based on action type (add, edit, delete)
    try {
      const { CheckListItem } = await this.caseModelService.getModels(
        accountNumber
      );

      const processedItems = [];

      for (const item of checklistReq.checklist_items) {
        // Use the utility function to process each item based on its action type
        const result = await this.processChecklistItemByAction(
          CheckListItem,
          checklistRid,
          item,
          checklistReq,
          transaction
        );

        if (result) {
          processedItems.push({
            ...result,
            action_type: item.action_type,
          });
        }
      }

      return processedItems;
    } catch (error) {
      logMessage(`Error processing checklist items: ${error}`);
      throw new Error("Error processing checklist items: " + error);
    }
  }
  /**
   * Utility function to process a single checklist item based on its action type
   * @param AdminCheckListItem - The model instance
   * @param checklistTemplateRid - Parent checklist RID
   * @param item - Checklist item data
   * @param createdBy - User ID performing the action
   * @param transaction - Database transaction
   * @returns Promise resolving to the processed item result
   */
  async processChecklistItemByAction(
    CheckListItem: any,
    checklistRid: string,
    item: ICreateChecklistItem,
    checkListReq: ICreateChecklist,
    transaction: Transaction
  ) {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.caseModelService.getMainSequelize();
    }
    const [checkListStatus]: any[] = await this.mainDbSequelize.query(
      rawQueries.fetchChecklistStatusByName("Open"),
      { type: "SELECT" }
    );
    switch (item.action_type) {
      case "add":
        return await this.checklistService?.addChecklistItem(
          CheckListItem,
          checklistRid,
          item,
          checkListReq.created_by,
          checkListReq.account_rid,
          checkListStatus?.rid,
          transaction
        );

      case "edit":
        return await this.checklistService?.editChecklistItem(
          CheckListItem,
          checklistRid,
          item,
          checkListReq.created_by,
          transaction
        );

      case "delete":
        return await this.checklistService?.deleteChecklistItem(
          CheckListItem,
          checklistRid,
          item,
          transaction
        );

      default:
        logMessage(
          `Warning: Unknown action type '${item.action_type}' for checklist item: ${item.checklist_item_name}`
        );
        throw new Error(
          `Invalid action type: ${item.action_type}. Supported types are: add, edit, delete`
        );
    }
  }

  async fetchProjectInfoById(accountNumber: string, projectId: string) {
    const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
      /\D/g,
      ""
    )}`;
    const query = rawQueries.fetchProjectInfoById(schemaName);
    if (!this.orgDbSequelize) {
      this.orgDbSequelize = await this.caseModelService.getSequelize();
    }
    const [result]: any[] = await this.orgDbSequelize.query(query, {
      replacements: { projectId },
      type: "SELECT",
    });
    return result || null;
  }
  async fetchProjectTaskById(accountNumber: string, projectTaskId: string) {
    const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
      /\D/g,
      ""
    )}`;

    const query = rawQueries.fetchProjectTaskById(schemaName);

    if (!this.orgDbSequelize) {
      this.orgDbSequelize = await this.caseModelService.getSequelize();
    }
    const result = await this.orgDbSequelize.query(query, {
      replacements: { projectTaskId },
      type: "SELECT",
      raw: true,
    });
    return result[0];
  }
  async fetchResourceById(accountNumber: string, resourceId: string) {
    const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
      /\D/g,
      ""
    )}`;

    const query = rawQueries.fetchResourceById(schemaName);

    if (!this.orgDbSequelize) {
      this.orgDbSequelize = await this.caseModelService.getSequelize();
    }
    const result = await this.orgDbSequelize.query(query, {
      replacements: { resourceId },
      type: "SELECT",
      raw: true,
    });

    return result[0];
  }

  async fetchResourceCostById(accountNumber: string, resourceCostId: string) {
    const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
      /\D/g,
      ""
    )}`;

    const query = rawQueries.fetchResourceCostById(schemaName);

    if (!this.orgDbSequelize) {
      this.orgDbSequelize = await this.caseModelService.getSequelize();
    }
    const result = await this.orgDbSequelize.query(query, {
      replacements: { resourceCostId },
      type: "SELECT",
      raw: true,
    });

    return result[0];
  }

  async fetchResourceSkillById(accountNumber: string, resourceSkillId: string) {
    const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
      /\D/g,
      ""
    )}`;

    const query = rawQueries.fetchResourceSkillById(schemaName);

    if (!this.orgDbSequelize) {
      this.orgDbSequelize = await this.caseModelService.getSequelize();
    }
    const result = await this.orgDbSequelize.query(query, {
      replacements: { resourceSkillId },
      type: "SELECT",
      raw: true,
    });

    return result[0];
  }
  /**
   * Fetches project resources for multiple project IDs using a single SQL query
   *
   * @param {string} accountNumber - Account number to determine schema
   * @param {string[]} projectIds - Array of project IDs
   * @returns {Promise<any[]>} - Project_resources data
   */
  async getProjectResourcesByProjectIds(
    accountNumber: string,
    projectIds: string[]
  ): Promise<any[]> {
    try {
      if (projectIds.length === 0) return [];

      const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
        /\D/g,
        ""
      )}`;

      const query = rawQueries.fetchProjectResourceAndFiscal(schemaName);

      if (!this.orgDbSequelize) {
        this.orgDbSequelize = await this.caseModelService.getSequelize();
      }
      const results = await this.orgDbSequelize.query(query, {
        replacements: { projectIds },
        type: "SELECT",
      });

      return results;
    } catch (error) {
      console.error("Error fetching project resources (bulk):", error);
      throw error;
    }
  }

  async getResourceSkillsByResourceIds(
    accountNumber: string,
    resourceIds: string[]
  ): Promise<any[]> {
    try {
      if (resourceIds.length === 0) return [];

      const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
        /\D/g,
        ""
      )}`;

      const query = rawQueries.getLatestResourceSkillsQuery(schemaName);

      if (!this.orgDbSequelize) {
        this.orgDbSequelize = await this.caseModelService.getSequelize();
      }
      const results = await this.orgDbSequelize.query(query, {
        replacements: { resourceIds },
        type: "SELECT",
      });

      return results;
    } catch (error) {
      errorLog(
        "Error fetching resource skills by resource IDs: " +
          (error as Error).message
      );
      throw error;
    }
  }

  async getResourceCostsByResourceIds(
    accountNumber: string,
    resourceIds: string[]
  ): Promise<any[]> {
    try {
      if (resourceIds.length === 0) return [];

      const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
        /\D/g,
        ""
      )}`;

      const query = rawQueries.getLatestResourceCostEntriesQuery(schemaName);

      if (!this.orgDbSequelize) {
        this.orgDbSequelize = await this.caseModelService.getSequelize();
      }
      const results = await this.orgDbSequelize.query(query, {
        replacements: { resourceIds },
        type: "SELECT",
      });

      return results;
    } catch (error) {
      errorLog(
        `Error fetching resource costs by resource IDs: ${
          (error as Error).message
        }`
      );
      throw error;
    }
  }

  async fetchProjectResourceById(
    accountNumber: string,
    projectResourceId: string
  ) {
    const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
      /\D/g,
      ""
    )}`;

    const query = rawQueries.fetchProjectResourceById(schemaName);
    if (!this.orgDbSequelize) {
      this.orgDbSequelize = await this.caseModelService.getSequelize();
    }
    const result = await this.orgDbSequelize.query(query, {
      replacements: { projectResourceId },
      type: "SELECT",
      raw: true,
    });
    return result[0];
  }

  async getResourcesByAccountId(accountNumber: string, accountRid: string) {
    try {
      const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
        /\D/g,
        ""
      )}`;

      const query = rawQueries.getResourcesByAccountQuery(schemaName);
      if (!this.orgDbSequelize) {
        this.orgDbSequelize = await this.caseModelService.getSequelize();
      }
      const results = await this.orgDbSequelize.query(query, {
        replacements: { accountRid },
        type: "SELECT",
      });

      return results;
    } catch (error) {
      errorLog(
        "Error fetching resources by account ID:",
        (error as Error).message
      );
      throw error;
    }
  }

  async getProjectsByAccountId(
    accountNumber: string,
    accountRid: string,
    accessibleIds: string[]
  ) {
    if (!this.orgDbSequelize) {
      this.orgDbSequelize = await this.caseModelService.getSequelize();
    }
    const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(
      /\D/g,
      ""
    )}`;
    const [results]: any[] = await this.orgDbSequelize.query(
      rawQueries.getAllProjectsByAccountId(
        schemaName,
        accountRid,
        accessibleIds
      )
    );
    return results;
  }

  async getCasesByAccountId(accountNumber: string, accountRid: string) {
    if (!this.orgDbSequelize) {
      this.orgDbSequelize = await this.caseModelService.getSequelize();
    }
    const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(
      /\D/g,
      ""
    )}`;
    const [results]: any[] = await this.orgDbSequelize.query(
      rawQueries.getAllCasesByAccountId(schemaName, accountRid)
    );
    return results;
  }
  buildRawWhereClause(
    filters: Record<string, any>,
    search?: string
  ): { whereClause: any } {
    const whereClause: any = {
      [Op.and]: [],
    };

    // Search logic
    if (search) {
      whereClause[Op.and].push({
        [Op.or]: [
          { checklist_name: { [Op.iLike]: `%${search}%` } },
          { r_number: { [Op.iLike]: `%${search}%` } },
          { checklist_description: { [Op.iLike]: `%${search}%` } },
          { attachment_level: { [Op.iLike]: `%${search}%` } },
        ],
      });
    }

    // Filter logic for your input structure
    Object.entries(filters).forEach(([field, filter]) => {
      if (!filter || typeof filter !== "object") {
        return;
      }

      const operator = Object.keys(filter)[0];
      const value = operator ? filter[operator] : undefined;

      if (!operator || value === undefined) {
        return;
      }

      const condition: any = {};

      switch (field) {
        case "checklist_name":
        case "attachment_level":
        case "descriptions":
        case "checklist_description":
        case "attached_to":
        case "attach_to":
        case "r_number":
          switch (operator.toLowerCase()) {
            case "equals":
              condition[field] = { [Op.iLike]: value };
              break;
            case "not_equals":
              condition[field] = {
                [Op.or]: [{ [Op.notILike]: value }, { [Op.is]: null }],
              };
              break;
            case "contains":
              condition[field] = { [Op.iLike]: `%${value}%` };
              break;
            case "is_empty":
              condition[field] = {
                [Op.or]: [{ [Op.is]: null }, { [Op.eq]: "" }],
              };
              break;
            case "in":
              condition[field] = {
                [Op.in]: Array.isArray(value) ? value : [value],
              };
              break;
          }
          break;
        case "created_datetime":
        case "modified_datetime":
          switch (operator.toLowerCase()) {
            case "equals": {
              const date = new Date(value);
              condition[field] = Sequelize.literal(
                `DATE("${field}") = DATE('${date.toISOString()}')`
              );
              break;
            }
            case "before": {
              const date = new Date(value);
              condition[field] = Sequelize.literal(
                `DATE("${field}") < DATE('${date.toISOString()}')`
              );
              break;
            }
            case "after": {
              const date = new Date(value);
              condition[field] = Sequelize.literal(
                `DATE("${field}") > DATE('${date.toISOString()}')`
              );
              break;
            }
            case "between": {
              if (Array.isArray(value)) {
                const startDate = new Date(value[0]);
                const endDate = new Date(value[1]);
                condition[field] = Sequelize.literal(
                  `DATE("${field}") BETWEEN DATE('${startDate.toISOString()}') AND DATE('${endDate.toISOString()}')`
                );
              }
              break;
            }
            case "is_empty":
              condition[field] = { [Op.is]: null };
              break;
          }
          break;
        case "fiscal_year":
          switch (operator.toLowerCase()) {
            case "equals":
              condition[field] = { [Op.eq]: value };
              break;
            case "not_equals":
              condition[field] = {
                [Op.or]: [{ [Op.ne]: value }, { [Op.is]: null }],
              };
              break;
            case "in":
              condition[field] = {
                [Op.in]: Array.isArray(value) ? value : [value],
              };
              break;
            case "is_empty":
              condition[field] = {
                [Op.or]: [{ [Op.is]: null }, { [Op.eq]: "" }],
              };
              break;
          }
          break;

        default:
          logMessage(`Unhandled filter field: ${field}`);
      }

      if (Object.keys(condition).length > 0) {
        whereClause[Op.and].push(condition);
      }
    });

    return { whereClause: whereClause[Op.and].length > 0 ? whereClause : {} };
  }

  async getAttachmentDisplayNames(
    attachments: any[],
    schemaNumber: string
  ): Promise<any> {
    const displayNames: Record<string, string> = {};
    let parentRid: Record<string, string> = {};
    let currencyRid: Record<string, string> = {};
    for (const attachment of attachments) {
      try {
        switch (attachment.attachment_level) {
          case "case":
            const caseData = await this.fetchCaseById(
              schemaNumber,
              attachment.attach_to
            );
            displayNames[attachment.rid] =
              caseData?.case_name || attachment.attach_to;
            parentRid[attachment.attach_to] = "";
            currencyRid[attachment.attach_to] = "";
            break;
          case "account":
            const account = await this.fetchAccountById(attachment.attach_to);
            displayNames[attachment.rid] =
              account?.account_name || attachment.attach_to;
            parentRid[attachment.attach_to] = "";
            currencyRid[attachment.attach_to] = "";
            break;
          case "project":
            const project = await this.fetchProjectInfoById(
              schemaNumber,
              attachment.attach_to
            );
            displayNames[attachment.rid] =
              project?.project_code || attachment.attach_to;
            parentRid[attachment.attach_to] = "";
            currencyRid[attachment.attach_to] = project?.currency_rid || "";
            break;
          case "project_resource":
            const projectResource = await this.fetchProjectResourceById(
              schemaNumber,
              attachment.attach_to
            );
            displayNames[attachment.rid] =
              (projectResource as { r_number?: string })?.r_number ||
              attachment.attach_to;
            parentRid[attachment.attach_to] =
              (projectResource as { project_fiscal_rid?: string })
                ?.project_fiscal_rid || "";
            currencyRid[attachment.attach_to] =
              (projectResource as { currency_rid?: string })?.currency_rid ||
              "";
            break;
          case "project_task":
            const projectTask = await this.fetchProjectTaskById(
              schemaNumber,
              attachment.attach_to
            );
            displayNames[attachment.rid] =
              (projectTask as { r_number?: string })?.r_number ||
              attachment.attach_to;
            parentRid[attachment.attach_to] =
              (projectTask as { project_fiscal_rid?: string })
                ?.project_fiscal_rid || "";
            currencyRid[attachment.attach_to] =
              (projectTask as { currency_rid?: string })?.currency_rid || "";
            break;
          case "resource":
            const resource = await this.fetchResourceById(
              schemaNumber,
              attachment.attach_to
            );
            displayNames[attachment.rid] =
              (resource as { resource_code?: string })?.resource_code ||
              attachment.attach_to;
            parentRid[attachment.attach_to] = "";
            currencyRid[attachment.attach_to] = "";
            break;
          case "resource_cost":
            const resourceCost = await this.fetchResourceCostById(
              schemaNumber,
              attachment.attach_to
            );
            displayNames[attachment.rid] =
              (resourceCost as { r_number?: string })?.r_number ||
              attachment.attach_to;
            parentRid[attachment.attach_to] =
              (resourceCost as { resource_rid?: string })?.resource_rid ||
              attachment.attach_to;
            currencyRid[attachment.attach_to] = "";
            break;
          case "resource_skill":
            const resourceSkill = await this.fetchResourceSkillById(
              schemaNumber,
              attachment.attach_to
            );
            displayNames[attachment.rid] =
              (resourceSkill as { r_number?: string })?.r_number ||
              attachment.attach_to;
            parentRid[attachment.attach_to] =
              (resourceSkill as { resource_rid?: string })?.resource_rid || "";
            currencyRid[attachment.attach_to] = "";
            break;
          default:
            displayNames[attachment.rid] = attachment.attach_to;
        }
      } catch (err) {
        console.error(
          `Error fetching display name for attachment ${attachment.rid}:`,
          err
        );
        displayNames[attachment.rid] = attachment.attach_to;
      }
    }

    return {
      displayNames,
      parentRid,
      currencyRid,
    };
  }
  async fetchAccountById(accountId: string) {
    try {
      if (!this.mainDbSequelize) {
        this.mainDbSequelize = await this.caseModelService.getMainSequelize();
      }
      const [accountData]: any[] = await this.mainDbSequelize.query(
        rawQueries.getAccountWithStatusByRidQuery(),
        {
          replacements: { rid: accountId },
          type: "SELECT",
        }
      );

      return accountData;
    } catch (err) {
      errorLog("Error fetching Accounts: " + (err as Error).message);
      throw new Error("Error fetching Accounts: " + (err as Error).message);
    }
  }
  async fetchCaseById(schemaNumber: string, caseId: string) {
    try {
      const schemaName = `${MAIN_SCHEMA_NAME}_${schemaNumber.replace(
        /\D/g,
        ""
      )}`;
      if (!this.orgDbSequelize) {
        this.orgDbSequelize = await this.caseModelService.getSequelize();
      }
      if (!this.mainDbSequelize) {
        this.mainDbSequelize = await this.caseModelService.getMainSequelize();
      }
      let [caseData]: any[] = await this.orgDbSequelize.query(
        rawQueries.fetchCaseById(schemaName),
        {
          replacements: { caseId },
          type: "SELECT",
        }
      );
      const [accountInfo]: any[] = await this.mainDbSequelize.query(
        rawQueries.fetchAccountAndCountryDetails(caseData.account_rid),
        {
          type: "SELECT",
        }
      );
      // Compose case name: accountName-countryCode-fiscalYear-caseName
      const accountName = accountInfo.account_name || "";
      const countryCode = accountInfo.country_code || "";
      const fiscalYear = caseData.fiscal_year || "";
      const originalCaseName = caseData.case_name || "";
      const composedCaseName = `${accountName}-${countryCode}-${fiscalYear}-${originalCaseName}`;
      caseData.case_name = composedCaseName;
      return caseData;
    } catch (err) {
      errorLog("Error fetching Cases: " + (err as Error).message);
      throw new Error("Error fetching Cases: " + (err as Error).message);
    }
  }
  async getAccessibleProjectIds(
    userId: string,
    isdefaultparent: boolean,
    isPOC: boolean = false,
    userEmail?: string,
    isCustomGlobal: boolean = false
  ): Promise<string[]> {
    const mainDbSequelize = await initMainDbSequelize();
    const MAIN_SCHEMA_NAME = "trd365";

    const replacements: any[] = [];

    let accessControlWhere = "WHERE 1=1";
    logMessage(
      `isCustomGlobal: ${isCustomGlobal}, isPOC: ${isPOC}, isdefaultparent: ${isdefaultparent}, userEmail: ${userEmail}, userId: ${userId}`
    );

    if (isCustomGlobal) {
      // If isPOC is also true, restrict to POC email
      if (isPOC && userEmail) {
        accessControlWhere += ` AND (ps.project_point_of_contact_email = ? OR pfs.project_point_of_contact_email = ?)`;
        replacements.push(userEmail, userEmail);
      }
      // Else allow all projects (no extra access checks)
    } else {
      // Non-global user – apply account/project access checks
      const accountAccessSubquery = rawQueries.GET_ACCOUNT_ACCESS;
      replacements.push(userId, userId, userId, userId);
      accessControlWhere += ` AND ${accountAccessSubquery}`;

      if (!isdefaultparent) {
        // Add project-level access checks if not a parent group
        accessControlWhere += rawQueries.GET_PROJECT_ACCESS;
        replacements.push(userId, userId, userId, userId);
      }

      // Only non-global users can be further filtered by POC
      if (isPOC && userEmail) {
        accessControlWhere += ` AND (ps.project_point_of_contact_email = ? OR pfs.project_point_of_contact_email = ?)`;
        replacements.push(userEmail, userEmail);
      }
    }

    const query = rawQueries.fetchProjectFiscalSummary(accessControlWhere);

    const results = await mainDbSequelize.query(query, {
      replacements,
      type: "SELECT",
    });

    return results.map((row: any) => row.project_fiscal_rid);
  }
  async triggerDynamicRuleEngine(eventType: string, payload: any, extra: Record<string, any> = {}, accessToken: string) {
    let templateName = '';
    let event_name = '';
    switch (eventType) {
      case 'create':
        templateName = ruleTemplateNames.taskCreated;
        event_name = ruleNames.taskCreated;
        break;
      case 'status_change':
        templateName = ruleTemplateNames.statusUpdated;
        event_name =  ruleNames.taskCreated;
        break;
      case 'assignee_change':
        templateName = ruleTemplateNames.assigneeChanged;
        event_name =  ruleNames.taskCreated;
        break;
      default:
        templateName = eventType;
        event_name = eventType;
    }
    const ruleEnginePayload = {
      ...payload,
      ...extra,
      templateName,
      event_name
    };
    await this.triggerRuleEngine(ruleEnginePayload, accessToken);
  }

  async triggerRuleEngine(data: any, accessToken: string): Promise<void> {
      try {
        console.log("Triggering rule engine with data:", data); 
        const RULE_ENGINE_BASE_URL = process.env.RULEBUILDER_BASE_URL;
        const response = await axios.post(
                `${RULE_ENGINE_BASE_URL}/workflow/execute`,
                {
                  ...data
                },
                {
                  headers: {
                    "x-user-id": data.userId,
                    Authorization: `Bearer ${accessToken}`,
                  },
                }
              );
      } catch (err) {
        logMessage(`Error triggering rule engine: ${err}`);
      }
    }
}
