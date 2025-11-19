import { col, fn, Op, QueryTypes, Sequelize, Transaction, where } from "sequelize";
import { CaseModelService } from "../caseModelsService";
import { CreateTaskTemplateType, filterType, ICreateChecklistTemplate, ICreateChecklistItemTemplate, TaskType, UpdateTaskTemplateType, MilestoneResponse, ICreateEmailTemplate, WorkflowConnectorType } from "../../utils/types";
import { buildDatetimeFilterCondition, buildDatetimeFilterConditionTemplates, buildNumericFilterCondition, buildStringFilterCondition, errorLog, logMessage } from "../../utils/helpers";
import { HttpStatus, STATUS_MESSAGE, filtersColumnsForCaseSummary, filterTypesForCaseSummary, filterTypesForAdminCheckList, filtersColumnsForAdminCheckList, rawQueries, filterTypesForEmailTemplate, filtersColumnsForEmailTemplate, relationshipTypes } from "../../utils/constants";
import { fetchCaseTemplateData, listAllCheckList, listAllEmailTemplates } from "../../utils/rawQueries";
import { initOrgSequelize } from "../../config/orgDataSource";
import { initMainDbSequelize } from "../../config/mainDataSource";



/**
 * Utility function to add a new checklist item
 * @param AdminCheckListItem - The model instance
 * @param checklistTemplateRid - Parent checklist RID
 * @param item - Checklist item data
 * @param createdBy - User ID who is creating the item
 * @param transaction - Database transaction
 * @returns Promise resolving to the created item
 */
async function addChecklistItem(
  AdminCheckListItem: any,
  checklistTemplateRid: string,
  item: ICreateChecklistItemTemplate,
  createdBy: string,
  transaction: Transaction
) {
  const result = await AdminCheckListItem.create(
    {
      checklist_template_rid: checklistTemplateRid,
      checklist_item_name: item.checklist_item_name,
      description: item.description,
      created_by: createdBy,
      created_datetime: new Date(),
    },
    { transaction }
  );
  logMessage(
    `Added new checklist item: ${item.checklist_item_name}`
  );
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
async function editChecklistItem(
  AdminCheckListItem: any,
  checklistTemplateRid: string,
  item: ICreateChecklistItemTemplate,
  createdBy: string,
  transaction: Transaction
) {
  // First, find the existing item by template_rid and sequence_no
  const existingItem = await AdminCheckListItem.findOne({
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
        description: item.description,
        modified_by: createdBy,
        modified_datetime: new Date(),
      },
      { transaction }
    );
    logMessage(
      `Updated checklist item at sequence : ${item.checklist_item_name}`
    );
    return result;
  } else {
    // Item doesn't exist, create it as fallback
    logMessage(
      `Warning: Checklist item at sequence  not found for editing`
    );
    const result = await AdminCheckListItem.create(
      {
        checklist_item_name: item.checklist_item_name,
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
async function deleteChecklistItem(
  AdminCheckListItem: any,
  checklistTemplateRid: string,
  item: ICreateChecklistItemTemplate,
  transaction: Transaction
) {
  // Find the item to delete
  const itemToDelete = await AdminCheckListItem.findOne({
    where: {
      checklist_template_rid: checklistTemplateRid,
      rid: item.checklist_item_rid,
    },
    transaction,
  });

  if (itemToDelete) {
    await itemToDelete.destroy({ transaction });
    logMessage(
      `Deleted checklist item at sequence : ${item.checklist_item_name}`
    );
  } else {
    logMessage(
      `Warning: Checklist item at sequence not found for deletion`
    );
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
async function processChecklistItemByAction(
  AdminCheckListItem: any,
  checklistTemplateRid: string,
  item: ICreateChecklistItemTemplate,
  createdBy: string,
  transaction: Transaction
) {
  switch (item.action_type) {
    case "add":
      return await addChecklistItem(
        AdminCheckListItem,
        checklistTemplateRid,
        item,
        createdBy,
        transaction
      );

    case "edit":
      return await editChecklistItem(
        AdminCheckListItem,
        checklistTemplateRid,
        item,
        createdBy,
        transaction
      );

    case "delete":
      return await deleteChecklistItem(
        AdminCheckListItem,
        checklistTemplateRid,
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

class CaseManagementSchemaService {
  private orgDbSequelize: Sequelize | null = null;
  private mainDbSequelize: Sequelize | null = null;
  private caseModelService: CaseModelService;

  constructor() {
    this.caseModelService = new CaseModelService();
  }
  async createAdminCheckList(
    caseRequest: ICreateChecklistTemplate,
    transaction: Transaction
  ) {
    // Implementation for creating checklist in the database
    try {
      const { AdminChecklist } = await this.caseModelService.getModels("");
      const createdChecklist = await AdminChecklist.create(
        {
          checklist_name: caseRequest.checklist_name,
          checklist_description: caseRequest.checklist_description,
          status_rid: caseRequest.status_rid,
          created_by: caseRequest.created_by,
          //modified_by: caseRequest.modified_by,
          created_datetime: new Date(),
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

  async updateAdminChecklist(data: any, userId: string) {
    try {
      const { AdminChecklist } = await this.caseModelService.getModels("");
      
      // Find the checklist by RID
      const existingChecklist = await AdminChecklist.findOne({
        where: { rid: data.checklist_template_rid }
      });

      if (!existingChecklist) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: STATUS_MESSAGE.checkListNotFound,
          errorMessage: STATUS_MESSAGE.checkListNotFoundError,
        };
      }

      // Prepare update data - only include fields that are provided
      const updateData: any = {
        modified_by: userId,
        modified_datetime: new Date(),
      };

      if (data.checklist_name !== undefined) {
        updateData.checklist_name = data.checklist_name;
      }

      if (data.checklist_description !== undefined) {
        updateData.checklist_description = data.checklist_description;
      }

      // Update the checklist
      const [affectedCount] = await AdminChecklist.update(
        updateData,
        {
          where: { rid: data.checklist_template_rid },
          returning: true
        }
      );

      if (affectedCount === 0) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: "No checklist was updated",
          errorMessage: "Failed to update the checklist",
        };
      }

      // Fetch the updated checklist
      const updatedChecklist = await AdminChecklist.findOne({
        where: { rid: data.checklist_template_rid }
      });

      return {
        statusCode: HttpStatus.SUCCESS,
        message: "Admin checklist updated successfully",
        data: updatedChecklist,
      };
    } catch (error) {
      logMessage(`Error updating checklist: ${error}`);
      return {
        statusCode: HttpStatus.FAILED,
        message: "Failed to update checklist",
        errorMessage: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  async manageAdminCheckListItems(
    checklistReq: ICreateChecklistTemplate,
    checklistTemplateRid: string,
    transaction: Transaction
  ): Promise<any[]> {
    // Implementation for managing checklist items based on action type (add, edit, delete)
    try {
      const { AdminCheckListItem } = await this.caseModelService.getModels("");

      const processedItems = [];

      for (const item of checklistReq.checklist_items) {
        // Use the utility function to process each item based on its action type
        const result = await processChecklistItemByAction(
          AdminCheckListItem,
          checklistTemplateRid,
          item,
          checklistReq.created_by,
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

  getSortColumnForAdminCheckList = (sortField: string): string => {
    const sortMapping: Record<string, string> = {
      r_number: "r_number",
      created_datetime: "created_datetime",
      modified_datetime: "modified_datetime",
      status_rid: "status_name",
      created_user_name: "created_user_name",
      modified_user_name: "modified_user_name",
      checklist_name: "checklist_name",
      checklist_description: "checklist_description",
      createdAt: "created_datetime"
    };

    return sortMapping[sortField] || "r_number";
  };

  getSortColumnForEmailTemplate = (sortField: string): string => {
    const sortMapping: Record<string, string> = {
      r_number: "r_number",
      created_datetime: "created_datetime",
      modified_datetime: "modified_datetime",
      status_rid: "status_name",
      created_user_name: "created_user_name",
      modified_user_name: "modified_user_name",
      template_name: "template_name",
      description: "description",
      createdAt: "created_datetime"
    };

    return sortMapping[sortField] || "r_number";
  };

  /**
   * Simplified filter processing for cases
   * @param filters - Filter object
   * @param andConditions - AND conditions string
   * @param filteredQueryArray - Array to store filter conditions
   * @param filterTypes - Filter types mapping
   * @param filterColumns - Filter columns mapping
   * @returns Object with filtered query array and conditions
   */
   filterForCheckList(
    filters: filterType,
    andConditions: string,
    filteredQueryArray: string[],
    filterTypes: any,
    filterColumns: any
  ) {
    let filteredColumns: string | undefined;
    if (filters && Object.keys(filters).length > 0) {
      for (let [key, conditions] of Object.entries(filters)) {
        if (Object.keys(filterTypes).includes(key)) {
          filteredColumns = filterColumns[key];
          andConditions = ` AND `;
        }
        for (let [condition, values] of Object.entries(conditions)) {
          switch (filterTypes[key]) {
            case "string": {
              let dynamicReference = `ct`;
  
              const stringCondition = buildStringFilterCondition(
                condition,
                values,
                filteredColumns!,
                dynamicReference
              );
              if (stringCondition) {
                filteredQueryArray.push(stringCondition);
              }
              break;
            }
            case "number": {
              const numericCondition = buildNumericFilterCondition(
                condition,
                values,
                filteredColumns!
              );
              if (numericCondition) {
                filteredQueryArray.push(numericCondition);
              }
              break;
            }
            case "datetime": {
              let dynamicReference = `ct`;
              const datetimeCondition = buildDatetimeFilterConditionTemplates(
                condition,
                values,
                filteredColumns!,
                dynamicReference
              );
              if (datetimeCondition) {
                filteredQueryArray.push(datetimeCondition);
              }
              break;
            }
          }
        }
      }
      return {
        filteredQueryArray,
        andConditions,
      };
    } else {
      filteredQueryArray = [];
      andConditions = ` `;
      return {
        filteredQueryArray,
        andConditions,
      };
    }
  }
  
  filterForEmailTemplate(
    filters: filterType,
    andConditions: string,
    filteredQueryArray: string[],
    filterTypes: any,
    filterColumns: any
  ) {
    let filteredColumns: string | undefined;
    if (filters && Object.keys(filters).length > 0) {
      for (let [key, conditions] of Object.entries(filters)) {
        if (Object.keys(filterTypes).includes(key)) {
          filteredColumns = filterColumns[key];
          andConditions = ` AND `;
        }
        for (let [condition, values] of Object.entries(conditions)) {
          switch (filterTypes[key]) {
            case "string": {
              let dynamicReference = `et`;
  
              const stringCondition = buildStringFilterCondition(
                condition,
                values,
                filteredColumns!,
                dynamicReference
              );
              if (stringCondition) {
                filteredQueryArray.push(stringCondition);
              }
              break;
            }
            case "number": {
              const numericCondition = buildNumericFilterCondition(
                condition,
                values,
                filteredColumns!
              );
              if (numericCondition) {
                filteredQueryArray.push(numericCondition);
              }
              break;
            }
            case "datetime": {
              let dynamicReference = `et`;
              const datetimeCondition = buildDatetimeFilterConditionTemplates(
                condition,
                values,
                filteredColumns!,
                dynamicReference
              );
              if (datetimeCondition) {
                filteredQueryArray.push(datetimeCondition);
              }
              break;
            }
          }
        }
      }
      return {
        filteredQueryArray,
        andConditions,
      };
    } else {
      filteredQueryArray = [];
      andConditions = ` `;
      return {
        filteredQueryArray,
        andConditions,
      };
    }
  }

   async listAdminCheckList(
      page: number,
      limit: number,
      apiType: string,
      filters: filterType,
      search: string,
      sortBy: string,
      sortOrder: string,
    ) {
      try {
        // Ensure filters is not null or undefined
        filters = filters || {};
        let offset = (page - 1) * limit;
        let pagination = `LIMIT ${limit} OFFSET ${offset}`;
        if (apiType === "download") {
          pagination = ``;
        }
        if (!this.mainDbSequelize) {
          this.mainDbSequelize = await this.caseModelService.getMainSequelize();
        }
        let filteredQueryArray: string[] = [];
        let andConditions = ``;
        let filterQueryValues;
        let whereKey: string = ``;
        let sortValue;
        let searchValue: string;
        let filterDatas = this.filterForCheckList(
          filters,
          andConditions,
          filteredQueryArray,
          filterTypesForAdminCheckList,
          filtersColumnsForAdminCheckList
        );
        // Optimize filter query processing
        filterQueryValues = filterDatas?.filteredQueryArray?.length
          ? filterDatas.filteredQueryArray.join(" AND ")
          : "";
  
        
        searchValue = search ? `%${search}%` : `%%`;
        whereKey = `1 = 1`;
  
        // Optimized conditions joining
        const conditions = [
          filterQueryValues,
        ].filter(Boolean);
  
        const joinedConditions =
          conditions.length > 0 ? " AND " + conditions.join(" AND ") : "";
  
        // Optimized sorting logic using extracted utility function
        const sortColumn = this.getSortColumnForAdminCheckList(sortBy);
        const sortDirection = sortOrder || "ASC";
        logMessage(
          `Sorting by column: ${sortColumn}, direction: ${sortDirection}`
        );
        sortValue = `ORDER BY ${sortColumn} ${sortDirection}`;
        let caseSummaryQuery = await listAllCheckList(
          searchValue,
          whereKey,
          joinedConditions,
          sortValue,
          pagination
        );
        const [result]: any[] = await this.mainDbSequelize.query(
          caseSummaryQuery,
          { type: "SELECT" }
        );
        return result.admin_checklists;
      } catch (err) {
        logMessage(`Error in fetching admin check list template: ${err}`);
        errorLog("Error in fetching admin check list template:", (err as Error).message);
        return [];
      }
    }
  async createTaskTemplate (data : CreateTaskTemplateType, userId : string) {
    if(!this.mainDbSequelize) {
      this.mainDbSequelize = await initMainDbSequelize();
    }
    const { TaskTemplate } = await this.caseModelService.getModels("");
    let sequenceNumber = 0
    let dynamicData;
    const getTaskType : any = await this.mainDbSequelize.query(rawQueries.getTaskTypeRid(data.task_type_rid));
    if(getTaskType[0][0].task_type_name === 'Milestone') {
      const checkTaskNameExists = await this.checkTaskExists(data, getTaskType[0][0].rid);
      if(checkTaskNameExists) {
        return {
          statusCode : HttpStatus.BAD_REQUEST,
          statusMessage : STATUS_MESSAGE.taskNameExistsAlready
        }
    }
      const findSequenceOrder = await this.fetchSequenceOrder(data.milestone_template_rid);
      if(findSequenceOrder.length > 0) {
        sequenceNumber = findSequenceOrder[0]?.sequence_no! + 1
      } else {
        sequenceNumber = sequenceNumber + 1
      }
      dynamicData = {
        created_by : userId,
        task_name : data.task_name,
        sequence_no : sequenceNumber,
        effort_in_days : data.effort_in_days,
        effective_start_datetime : data.effective_start_datetime,
        effective_end_datetime : data.effective_end_datetime,
        case_team_member_role_rid : data.case_team_member_role_rid,
        checklist_template_rid : data.checklist_template_rid,
        status_rid : data.status_rid,
        priority_rid : data.priority_rid,
        task_type_rid : data.task_type_rid,
        milestone_template_rid : data.milestone_template_rid,
        task_description : data.task_description
      }
    } else {
      sequenceNumber = 0
      dynamicData = {
        created_by : userId,
        task_name : data.task_name,
        sequence_no : sequenceNumber,
        task_description : data.task_description,
        checklist_template_rid : data.checklist_template_rid,
        priority_rid : data.priority_rid,
      }
    }
    const result = await TaskTemplate.create(dynamicData);
    if(result) {
      if(Object.keys(data.workflow_connector).length > 0) {
        data.workflow_connector.source_rid = result.dataValues.rid
        if(data.workflow_connector.target_rid.length > 0) {
          await this.taskWorkflowConnector(data.workflow_connector);
        }
      }
    }
    return {
      statusCode : HttpStatus.SUCCESS,
      statusMessage : STATUS_MESSAGE.taskCreatedSuccess
    };
  }
  async fetchSequenceOrder (milestone_template_rid : string) {
    const { TaskTemplate } = await this.caseModelService.getModels("");
    const findSequenceOrder = await TaskTemplate.findAll({
      attributes : ['sequence_no'],
      where : {
        milestone_template_rid : milestone_template_rid
      },
      order : [['created_datetime', 'DESC']],
      raw : true
    })
    return findSequenceOrder;
  }
  async checkTaskExists (data : any, taskTypeRid : string) {
    const { TaskTemplate } = await this.caseModelService.getModels("");
    const checkTaskNameExists = await TaskTemplate.findOne({
      attributes : ['task_name'],
      where : {
        task_name : {
          [Op.iLike] : data.task_name
        },
        task_type_rid : taskTypeRid
      },raw : true
    })
    return checkTaskNameExists
  }

   async updateTaskTemplate (data : UpdateTaskTemplateType, userId : string) {
     const { TaskTemplate } = await this.caseModelService.getModels("");
    const checkTaskExists = await this.checkTaskExistsForUpdate(data.rid);
    if(checkTaskExists) {
      const checkTaskNameExists = await this.checkTaskNameExistsForUpdate(data)
      if(checkTaskNameExists) {
        return {
          statusCode : HttpStatus.BAD_REQUEST,
          statusMessage : STATUS_MESSAGE.taskNameExistsAlready
        }        
      }
      data.modified_by = userId
      data.modified_datetime = new Date()
      const [result] = await TaskTemplate.update(data, {
        where : {
          rid : data.rid
        }
      })
      if(result === 1) {
        if(Object.keys(data.workflow_connector).length > 0) {
          if(data.workflow_connector.target_rid.length > 0) {
            await this.taskWorkflowConnector(data.workflow_connector);
          }
        }
        return {
          statusCode : HttpStatus.SUCCESS,
          statusMessage : STATUS_MESSAGE.taskUpdatedSuccess
        }
      } else {
      return {
        statusCode : HttpStatus.FAILED,
        statusMessage : STATUS_MESSAGE.taskUpdateFailed
      }        
      }
    } else {
      return {
        statusCode : HttpStatus.NOT_FOUND,
        statusMessage : STATUS_MESSAGE.dataNotAvailable
      }
    }
  }
  async checkTaskExistsForUpdate (rid : string) {
    const { TaskTemplate } = await this.caseModelService.getModels("");
    const checkTaskExists = await TaskTemplate.findOne({
      where : {
        rid : rid
      }, 
      raw : true
    })
    if(checkTaskExists) return checkTaskExists
    else return null
  }

  async checkTaskNameExistsForUpdate (data : UpdateTaskTemplateType) {
    const { TaskTemplate } = await this.caseModelService.getModels("");
    const checkTaskExists = await TaskTemplate.findOne({
      attributes : ['rid'],
      where : {
        task_name : {
          [Op.iLike] : data.task_name
        },
        rid : {
          [Op.notIn] : [data.rid]
        }
      }, 
      raw : true
    })
    if(checkTaskExists) return checkTaskExists
    else return null
  }

async fetchChecklistTemplateDetailsById(
  checklistId: string
) {``
  if (!this.mainDbSequelize) {
    this.mainDbSequelize = await this.caseModelService.getMainSequelize();
  }

  const [checklistDetailsResult] = await this.mainDbSequelize.query(rawQueries.fetchChecklistTemplates, {
    replacements: { checklistId },
    type: "SELECT"
  }) as [any[], any];

  if (!checklistDetailsResult || checklistDetailsResult.length === 0) {
    return null;
  }

  const checklistDetails = checklistDetailsResult as any;

  let checklistItems = await this.fetchChecklistTemplateItems(
    checklistId
  );

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
  async fetchChecklistTemplateItems(
    checklistId: string,
  ) {
    try {
      const {
        AdminCheckListItem,
      } = await this.caseModelService.getModels("");
      // Convert Sequelize instances to plain objects

      const items = await AdminCheckListItem.findAll({
        attributes: [
          "rid",
          "checklist_item_name",
          "checklist_template_rid",
          "description"
          ],
        order: [
          ["created_datetime", "ASC"],
        ],
        where: { $checklist_template_rid$: checklistId},
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
        this.mainDbSequelize =
          await this.caseModelService.getMainSequelize();
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
  async fetchTaskTypes () {
    if(!this.mainDbSequelize) {
      this.mainDbSequelize = await this.caseModelService.getMainSequelize();
    }
    const result = await this.mainDbSequelize.query<TaskType>(rawQueries.getTaskType(), {type : QueryTypes.SELECT});
    return result;
  }
  async fetchKanbanBoard (schemaName : string, caseRid : string, accountRid : string) {
    if(!this.orgDbSequelize) {
      this.orgDbSequelize = await initOrgSequelize();
    }

    const result : any = await this.orgDbSequelize.query(fetchCaseTemplateData(schemaName,caseRid, accountRid));
    
    if(result[0].length > 0) {
      return result[0][0]
    } else {
      return []
    }

  }
  async createEmailTemplate(
    emailRequest: ICreateEmailTemplate
  ) {
    // Implementation for creating checklist in the database
    try {
      const { EmailTemplate } = await this.caseModelService.getModels("");
      const emailTemplate = await EmailTemplate.create(
        {
          template_name: emailRequest.template_name,
          description: emailRequest.description,
          status_rid: emailRequest.status_rid,
          created_by: emailRequest.created_by!,
          subject: emailRequest.subject,
          body_html: emailRequest.body_html,
          created_datetime: new Date(),
          category_rid: emailRequest.category_rid
        }
      );

      return emailTemplate;
    } catch (error) {
      logMessage(`Error creating email template: ${error}`);
      throw new Error("Error creating email template: " + error);
    }
  }

   async checkIsEmailTemplateUnique(
    emailReq: any
  ): Promise<boolean> {
    const { EmailTemplate } = await this.caseModelService.getModels("");
    const response = await EmailTemplate.findOne({
      where: {
        [Op.and]: [
          where(
            fn("LOWER", col("template_name")),
            Op.eq,
            emailReq.template_name.toLowerCase()
          ),
          { category_rid: emailReq.category_rid }
        ]
      }
    });
    return !response;
  }

   async  checkisExistingTemplateUnique(emailReq: any): Promise<boolean> {
  const { EmailTemplate } = await this.caseModelService.getModels("");
  const response = await EmailTemplate.findOne({
    where: {
      [Op.and]: [
        where(
          fn("LOWER", col("template_name")),
          Op.eq,
          emailReq.template_name.toLowerCase()
        ),
        { category_rid: emailReq.category_rid },
        { rid: { [Op.ne]: emailReq.email_template_rid } },
      ]
    }
  });
  return !response;
}

  async updateEmailTemplate(
    emailRequest: ICreateEmailTemplate
  ) {
    // Implementation for creating checklist in the database
    try {
      const { EmailTemplate } = await this.caseModelService.getModels("");
      const emailTemplate = await EmailTemplate.update(
        {
          template_name: emailRequest.template_name,
          description: emailRequest.description,
          status_rid: emailRequest.status_rid,
          modified_by: emailRequest.modified_by,
          subject: emailRequest.subject,
          body_html: emailRequest.body_html,
          modified_datetime: new Date(),
          category_rid: emailRequest.category_rid
        },
        {
          where: {
            rid: emailRequest.email_template_rid
          }
        } 
      );

      return emailTemplate;
    } catch (error) {
      logMessage(`Error updating email template: ${error}`);
      throw new Error("Error updating email template: " + error);
    }
  }

  async getEmailPlaceHolders(
  ) {
     try {
        if (!this.mainDbSequelize) {
          this.mainDbSequelize = await this.caseModelService.getMainSequelize();
        }
        const users = await this.mainDbSequelize.query(
          rawQueries.getEmailPlaceHolders(),
          {
            type: "SELECT",
          }
        );
        return users;
      } catch (err) {
        logMessage(`Error in fetching users for case team: ${err}`);
        errorLog(
          "Error in fetching users for case team:",
          (err as Error).message
        );
        return [];
      }
    }
  async listEmailTemplates(
  page: number,
  limit: number,
  apiType: string,
  filters: filterType,
  search: string,
  sortBy: string,
  sortOrder: string,
  email_template_rid?: string,
) {
  try {
    // Ensure filters is not null or undefined
    filters = filters || {};
    let offset = (page - 1) * limit;
    let pagination = `LIMIT ${limit} OFFSET ${offset}`;
    if (apiType === "download") {
      pagination = ``;
    }
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.caseModelService.getMainSequelize();
    }
    let filteredQueryArray: string[] = [];
    let andConditions = ``;
    let filterQueryValues;
    let whereKey: string = ``;
    let sortValue;
    let searchValue: string;
    let templateQuery: string = ``;
    let filterDatas = this.filterForEmailTemplate(
      filters,
      andConditions,
      filteredQueryArray,
      filterTypesForEmailTemplate,
      filtersColumnsForEmailTemplate
    );
    // Optimize filter query processing
    filterQueryValues = filterDatas?.filteredQueryArray?.length
      ? filterDatas.filteredQueryArray.join(" AND ")
      : "";

    
    searchValue = search ? `%${search}%` : `%%`;
    whereKey = `1 = 1`;

    if (apiType === "graphql") {
        templateQuery = ` et.rid = '${email_template_rid}'`;
      }

    // Optimized conditions joining
    const conditions = [
      filterQueryValues,
      templateQuery
    ].filter(Boolean);

    const joinedConditions =
      conditions.length > 0 ? " AND " + conditions.join(" AND ") : "";

    // Optimized sorting logic using extracted utility function
    const sortColumn = this.getSortColumnForEmailTemplate(sortBy);
    const sortDirection = sortOrder || "ASC";
    logMessage(
      `Sorting by column: ${sortColumn}, direction: ${sortDirection}`
    );
    sortValue = `ORDER BY ${sortColumn} ${sortDirection}`;
    let caseSummaryQuery = await listAllEmailTemplates(
      searchValue,
      whereKey,
      joinedConditions,
      sortValue,
      pagination
    );
    const [result]: any[] = await this.mainDbSequelize.query(
      caseSummaryQuery,
      { type: "SELECT" }
    );
    return result.admin_checklists;
  } catch (err) {
    logMessage(`Error in fetching email template: ${err}`);
    errorLog("Error in fetching email template:", (err as Error).message);
    return [];
  }
}

async fetchEmailTemplateDetailsById(
  emailTemplateId: string
) {``
  if (!this.mainDbSequelize) {
    this.mainDbSequelize = await this.caseModelService.getMainSequelize();
  }

  const [emailTemplateDetails] = await this.mainDbSequelize.query(rawQueries.fetchEmailTemplates, {
    replacements: { emailTemplateId },
    type: "SELECT"
  }) as [any[], any];

  if (!emailTemplateDetails || emailTemplateDetails.length === 0) {
    return null;
  }

  const emailTemplateDetailsResult = emailTemplateDetails as any;

   const userInfo = await this.insertUserDetails(
     emailTemplateDetailsResult.created_by ?? "",
     emailTemplateDetailsResult.modified_by ?? ""
   );

   const [statusInfo]: any[] = await this.mainDbSequelize.query(
         rawQueries.getStatusDetails(emailTemplateDetailsResult?.status_rid ?? ""),
         {
           type: "SELECT",
         }
       );
   const [categoryInfo]: any[] = await this.mainDbSequelize.query(
         rawQueries.getCategoryDetails(emailTemplateDetailsResult?.category_rid ?? ""),
         {
           type: "SELECT",
         }
       );

  const response: any = {
    email_template_rid: emailTemplateDetailsResult?.rid,
    email_template_name: emailTemplateDetailsResult?.template_name ?? "",
    email_template_description: emailTemplateDetailsResult?.description ?? "",
    r_number: emailTemplateDetailsResult.r_number ?? "",
    status_rid: emailTemplateDetailsResult.status_rid ?? "",
    status_name: statusInfo.status_name ?? "",
    subject: emailTemplateDetailsResult.subject ?? "",
    body_html: emailTemplateDetailsResult.body_html ?? "",
    category_rid: emailTemplateDetailsResult.category_rid ?? "",
    category_name: categoryInfo.category_name ?? "",
    modified_by: userInfo.modified_name ?? emailTemplateDetailsResult.modified_by,
    created_by: userInfo.created_name ?? emailTemplateDetailsResult.created_by,
    created_datetime: emailTemplateDetailsResult.created_datetime ?? null,
    modified_datetime: emailTemplateDetailsResult.modified_datetime ?? null
  };

  return response;
  }

async fetchEmailCategoryPlaceHolders(categoryRid: string
) {
    try {
      if (!this.mainDbSequelize) {
        this.mainDbSequelize = await this.caseModelService.getMainSequelize();
      }
      const response = await this.mainDbSequelize.query(
        rawQueries.getEmailCategoryPlaceHolders(categoryRid),
        {
          type: "SELECT",
        }
      );
      return response;
    } catch (err) {
      logMessage(`Error in fetching users for case team: ${err}`);
      errorLog(
        "Error in fetching users for case team:",
        (err as Error).message
      );
      return [];
    }
  }
async getEmailTemplateCategory(
  ) {
     try {
        if (!this.mainDbSequelize) {
          this.mainDbSequelize = await this.caseModelService.getMainSequelize();
        }
        const users = await this.mainDbSequelize.query(
          rawQueries.getEmailTemplateCategory(),
          {
            type: "SELECT",
          }
        );
        return users;
      } catch (err) {
        logMessage(`Error in fetching users for case team: ${err}`);
        errorLog(
          "Error in fetching users for case team:",
          (err as Error).message
        );
        return [];
      }
    }
async getWorkFlowConnector () {
  if(!this.mainDbSequelize) {
    this.mainDbSequelize = await this.caseModelService.getMainSequelize();
  }
  const result = await this.mainDbSequelize.query<WorkflowConnectorType>(rawQueries.fetchWorkFlowConnector(), {type : QueryTypes.SELECT});
  if(result.length > 0) {
    return result
  } 
  else return []
}
  async taskWorkflowConnector (data : any) {
    const {WorkflowConnector, WorkflowConnectorMapping} = await this.caseModelService.getModels("");
    let iterationCount : number = 0;
    let totalIteration = data.target_rid.length
    for(let d of data.target_rid) {
      const workFlowConnectorData = await WorkflowConnector.findOne({
        where : {
          rid : data.relationship_connector_rid
        }, raw : true
      })
      let workFlowConnectorDetails;
      let dynamicRelationTypeName : string = ``
      if(workFlowConnectorData) {
        if(workFlowConnectorData.relationship_type === 'blocks') {
          dynamicRelationTypeName = relationshipTypes.isBlockedBy
        } else if (workFlowConnectorData.relationship_type === 'enables') {
          dynamicRelationTypeName = relationshipTypes.isEnabledBy
        } else if (workFlowConnectorData.relationship_type === 'is_enabled_by') {
          dynamicRelationTypeName = relationshipTypes.enables
        } else if (workFlowConnectorData.relationship_type === 'is_blocked_by') {
          dynamicRelationTypeName = relationshipTypes.blocks
        }
      }
      if(workFlowConnectorData) {
        const checkIsAlreadyMapped = await WorkflowConnectorMapping.findOne({
          where : {
            source_rid : data.source_rid,
            target_rid : d,
            relationship_connector_rid : data.relationship_connector_rid
          }, raw : true
        });
        if(!checkIsAlreadyMapped) {
          return {
            statusCode : HttpStatus.BAD_REQUEST,
            statusMessage : STATUS_MESSAGE.dataAlreadyMapped
          }
        } else {
          const result = await WorkflowConnectorMapping.create({
            created_by : data.created_by,
            created_datetime : new Date(),
            source_rid : data.source_rid,
            target_rid : d,
            relationship_connector_rid : data.relationship_connector_rid
          });
          if(result) {
            workFlowConnectorDetails = await WorkflowConnector.findOne({
              where : {
                relationship_type : dynamicRelationTypeName
              }, raw : true
            })
            if(workFlowConnectorDetails) {
              await WorkflowConnectorMapping.create({
                created_by : data.created_by,
                created_datetime : new Date(),
                source_rid : d,
                target_rid : data.source_rid,
                relationship_connector_rid : workFlowConnectorDetails.rid!
              });
            }
          }
      }
    } 
    else 
      {
        return {
          statusCode : HttpStatus.NOT_FOUND,
          statusMessage : STATUS_MESSAGE.taskNotFound
      }
    }
    iterationCount += 1
  }
  if(iterationCount === totalIteration) {
    return {
      statusCode : HttpStatus.SUCCESS,
      statusMessage : STATUS_MESSAGE.workflowConnectorMappedSuccess
    }
  } else {
    return {
      statusCode : HttpStatus.FAILED,
      statusMessage : STATUS_MESSAGE.workflowConnectorMappedFailed
    }
  }
}

  async deleteTaskWorkConnector (data : any) {
    const {WorkflowConnector, WorkflowConnectorMapping} = await this.caseModelService.getModels("");
    const checkDataExists = await WorkflowConnectorMapping.findOne({
      where : {
        rid : data.rid
      }
    });
    if(checkDataExists) {
      let workFlowConnectorDetails;
      let dynamicRelationTypeName : string = ``
      const workFlowConnectorData = await WorkflowConnector.findOne({
        where : {
          rid : checkDataExists.relationship_connector_rid
        }, raw : true
      })
      if(workFlowConnectorData) {
        if(workFlowConnectorData.relationship_type === 'blocks') {
          dynamicRelationTypeName = relationshipTypes.isBlockedBy
        } else if (workFlowConnectorData.relationship_type === 'enables') {
          dynamicRelationTypeName = relationshipTypes.isEnabledBy
        } else if (workFlowConnectorData.relationship_type === 'is_enabled_by') {
          dynamicRelationTypeName = relationshipTypes.enables
        } else if (workFlowConnectorData.relationship_type === 'is_blocked_by') {
          dynamicRelationTypeName = relationshipTypes.blocks
        }
      }
      workFlowConnectorDetails = await WorkflowConnector.findOne({
          where : {
            relationship_type : dynamicRelationTypeName
          }, raw : true
        })
      if(workFlowConnectorDetails) {
        const deleteData = await WorkflowConnectorMapping.destroy({
          where : {
            source_rid : checkDataExists.target_rid,
            target_rid : checkDataExists.source_rid,
            relationship_connector_rid : workFlowConnectorDetails.rid
          }
        });
        if(deleteData === 1) {
          await WorkflowConnectorMapping.destroy({
            where : {
              rid : data.rid
            }
          })
          return {
            statusCode : HttpStatus.SUCCESS,
            statusMessage : STATUS_MESSAGE.workflowConnectorMappedDeleted
          }
        } else {
          return {
            statusCode : HttpStatus.FAILED,
            statusMessage : STATUS_MESSAGE.workflowConnectorMappedDeletedFailed
          }
        }
      }
    } else {
      return {
        statusCode : HttpStatus.NOT_FOUND,
        statusMessage : STATUS_MESSAGE.dataNotAvailable
      }
    }
  }
  async listTasksDropdown (data : any) {
    const {TaskTemplate} = await this.caseModelService.getModels("");
    const result = await TaskTemplate.findAll({
      attributes : ['rid', 'task_name'],
      where : {
        task_name : {
          [Op.iLike] : data.search == "" ? '%%' : `%${data.search}%`
        } 
      },
      order : [['task_name', 'ASC']]
    });
    return result;
  }
  async getCaseDetails (caseRid : string, accountNumber : string) {
    const {Case} = await this.caseModelService.getModels(accountNumber)
    const result = await Case.findOne({
      attributes : ['status_rid'],
      where : {
        rid : caseRid
      }, raw : true
    });
    return result;
  }
}

export { CaseManagementSchemaService };
