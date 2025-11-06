import { Op, Sequelize, Transaction } from "sequelize";
import { CaseModelService } from "../caseModelsService";
import { CreateTaskTemplateType, filterType, ICreateChecklist, ICreateChecklistItem, UpdateTaskTemplateType } from "../../utils/types";
import { buildDatetimeFilterCondition, buildNumericFilterCondition, buildStringFilterCondition, errorLog, logMessage } from "../../utils/helpers";
import { HttpStatus, STATUS_MESSAGE, filtersColumnsForCaseSummary, filterTypesForCaseSummary, filterTypesForAdminCheckList, filtersColumnsForAdminCheckList, rawQueries } from "../../utils/constants";
import { listAllCheckList } from "../../utils/rawQueries";



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
  item: ICreateChecklistItem,
  createdBy: string,
  transaction: Transaction
) {
  const result = await AdminCheckListItem.create(
    {
      checklist_template_rid: checklistTemplateRid,
      checklist_item_name: item.checklist_item_name,
      description: item.description,
      sequence_no: item.sequence_no,
      created_by: createdBy,
      created_datetime: new Date(),
    },
    { transaction }
  );
  logMessage(
    `Added new checklist item: ${item.checklist_item_name} at sequence ${item.sequence_no}`
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
  item: ICreateChecklistItem,
  createdBy: string,
  transaction: Transaction
) {
  // First, find the existing item by template_rid and sequence_no
  const existingItem = await AdminCheckListItem.findOne({
    where: {
      rid: checklistTemplateRid,
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
      `Updated checklist item at sequence ${item.sequence_no}: ${item.checklist_item_name}`
    );
    return result;
  } else {
    // Item doesn't exist, create it as fallback
    logMessage(
      `Warning: Checklist item at sequence ${item.sequence_no} not found for editing`
    );
    const result = await AdminCheckListItem.create(
      {
        checklist_item_name: item.checklist_item_name,
        sequence_no: item.sequence_no,
        created_by: createdBy,
        created_datetime: new Date(),
      },
      { transaction }
    );
    logMessage(
      `Created new checklist item (edit fallback): ${item.checklist_item_name} at sequence ${item.sequence_no}`
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
  item: ICreateChecklistItem,
  transaction: Transaction
) {
  // Find the item to delete
  const itemToDelete = await AdminCheckListItem.findOne({
    where: {
      checklist_template_rid: checklistTemplateRid,
      sequence_no: item.sequence_no,
    },
    transaction,
  });

  if (itemToDelete) {
    await itemToDelete.destroy({ transaction });
    logMessage(
      `Deleted checklist item at sequence ${item.sequence_no}: ${item.checklist_item_name}`
    );
  } else {
    logMessage(
      `Warning: Checklist item at sequence ${item.sequence_no} not found for deletion`
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
  item: ICreateChecklistItem,
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
    caseRequest: ICreateChecklist,
    transaction: Transaction
  ) {
    // Implementation for creating checklist in the database
    try {
      const { AdminChecklist } = await this.caseModelService.getModels("");
      const createdChecklist = await AdminChecklist.create(
        {
          checklist_name: caseRequest.checklist_name,
          checklist_description: caseRequest.checklist_description,
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
        where: { rid: data.rid }
      });

      if (!existingChecklist) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: "Checklist not found",
          errorMessage: "Admin checklist with the provided RID does not exist",
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
          where: { rid: data.rid },
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
        where: { rid: data.rid }
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
    checklistReq: ICreateChecklist,
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
            sequence_no: item.sequence_no,
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
      status_name: "status_name",
      created_user_name: "created_user_name",
      updated_user_name: "modified_user_name",
      checklist_name: "checklist_name",
      checklist_description: "checklist_description",
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
              const datetimeCondition = buildDatetimeFilterCondition(
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
    const { TaskTemplate } = await this.caseModelService.getModels("");
    const findSequenceOrder = await this.fetchSequenceOrder();
    let sequenceNumber : number = 0;
    if(findSequenceOrder.length > 0) {
      sequenceNumber = findSequenceOrder[0]?.sequence_no! + 1
    } else {
      sequenceNumber = sequenceNumber + 1
    }
    const checkTaskNameExists = await this.checkTaskExists(data);
    if(checkTaskNameExists) {
      return {
        statusCode : HttpStatus.BAD_REQUEST,
        statusMessage : STATUS_MESSAGE.taskNameExistsAlready
      }
    }
    await TaskTemplate.create({
      created_by : userId,
      task_name : data.task_name,
      sequence_no : sequenceNumber,
      effort_in_days : data.effort_in_days,
      reminder_interval : data.reminder_interval,
      effective_start_datetime : data.effective_start_datetime,
      effective_end_datetime : data.effective_end_datetime,
      case_team_member_role_rid : data.case_team_member_role_rid,
      checklist_template_rid : data.checklist_template_rid,
      status_rid : data.status_rid,
      priority_rid : data.priority_rid,
      task_type_rid : data.task_type_rid,
      milestone_template_rid : data.milestone_template_rid
    })
    return {
      statusCode : HttpStatus.SUCCESS,
      statusMessage : STATUS_MESSAGE.taskCreatedSuccess
    };
  }
  async fetchSequenceOrder () {
    const { TaskTemplate } = await this.caseModelService.getModels("");
    const findSequenceOrder = await TaskTemplate.findAll({
      attributes : ['sequence_no'],
      order : [['created_datetime', 'DESC']],
      raw : true
    })
    return findSequenceOrder;
  }
  async checkTaskExists (data : any) {
    const { TaskTemplate } = await this.caseModelService.getModels("");
    const checkTaskNameExists = await TaskTemplate.findOne({
      attributes : ['task_name'],
      where : {
        task_name : {
          [Op.iLike] : data.task_name
        }
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
          "sequence_no",
          "checklist_item_name",
          "checklist_template_rid",
          "description"
          ],
        order: [
          ["sequence_no", "ASC"],
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
}
export { CaseManagementSchemaService };
