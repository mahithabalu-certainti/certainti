import { Op, Sequelize, Transaction } from "sequelize";
import { CaseModelService } from "../caseModelsService";
import { CreateTaskTemplateType, ICreateChecklist, ICreateChecklistItem } from "../../utils/types";
import { logMessage } from "../../utils/helpers";
import { HttpStatus, STATUS_MESSAGE } from "../../utils/constants";

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
      checklist_rid : data.checklist_rid,
      status_rid : data.status_rid,
      priority_rid : data.priority_rid,
      task_type : "Milestone",
      milestone_rid : data.milestone_rid
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
        },
        milestone_rid : {
          [Op.in] : [data.milestone_rid]
        }
      }, raw : true
    })
    return checkTaskNameExists
  }
}
export { CaseManagementSchemaService };
