import { Logger } from "winston";
import { CaseModelService } from "../caseModelsService";
import { QueryTypes, Sequelize } from "sequelize";
import { CaseManagementSchemaService } from "./schemaService";
import { HttpStatus, rawQueries, STATUS_MESSAGE } from "../../utils/constants";
import { logMessage, setTaskTemplateData } from "../../utils/helpers";
import CaseSchemaService from "../cases/schemaService";
import { AdminTaskTemplatePayloadType, AdminTaskTemplateResponseTypes, caseStatusType, checkListTypes, CreateTaskTemplateType, ICreateChecklist, ICreateChecklistTemplate, ICreateEmailTemplate, MilestoneTypes, priorityTypes, UpdateTaskTemplateType } from "../../utils/types";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { fetchAdminTemplates } from "../../utils/rawQueries";

/**
 * Service class for managing case-related operations including case creation,
 * admin checklist management, and database operations.
 *
 * Provides high-level business logic for case management workflows,
 * integrating with schema services and database models to handle
 * transactional operations safely.
 */
export class CaseManagementService {
  private caseManangementSchemaService: CaseManagementSchemaService;
  private caseSchemaService: CaseSchemaService;
  private caseModelService: CaseModelService; // Service for database model operations and connection management
  private logger: Logger;
  private orgDbSequelize: Sequelize | null = null;
  private mainDbSequelize: Sequelize | null = null;

  /**
   * Initializes the CaseManagementService with required dependencies.
   *
   * @param logger - Winston logger instance for logging operations and errors
   */
  constructor(logger: Logger) {
    this.logger = logger;
    this.caseManangementSchemaService = new CaseManagementSchemaService();
    this.caseSchemaService = new CaseSchemaService();
    this.caseModelService = new CaseModelService(); // Handles database connections and model operations
  }

  async getMainDb() {
    if(!this.mainDbSequelize) {
      this.mainDbSequelize = await initMainDbSequelize();
    }
    return this.mainDbSequelize
  }
  /**
   * Creates a new admin checklist with associated checklist items within a database transaction.
   *
   * @param {ICreateChecklist} caseRequest - The checklist data including template information and checklist items to create
   * @param {string} userId - The ID of the user creating the checklist (will be set as created_by)
   *
   * @returns {Promise<{
   *   statusCode: number;
   *   message: string;
   *   errorMessage?: string;
   *   data?: { checklist: any };
   * }>} - Result of the creation process with status code, message, and checklist data if successful
   *
   * @description
   * This method performs the following operations within a database transaction:
   * - Initializes a database transaction for atomic operations
   * - Sets the created_by field to the provided userId
   * - Creates the admin checklist record using the schema service
   * - Creates associated checklist items linked to the new checklist
   * - Commits the transaction on success or rolls back on any error
   * - Returns success response with checklist data or error response with details
   * - Logs errors and ensures proper transaction cleanup
   */

  async createAdminCheckList(
    caseRequest: ICreateChecklistTemplate,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { checklist: any };
  }> {
    // Initialize database connection and start transaction for atomic operations
    const dbInit = await this.caseModelService.getMainSequelize();
    const transaction = await dbInit.transaction();
    try {
      // Set the user who is creating this checklist
      caseRequest.created_by = userId;
      const isUnique = await this.caseManangementSchemaService.checkIsCheckListTemplateUnique(caseRequest);
      if (!isUnique) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: HttpStatus.BAD_REQUEST_MESSAGE,
          errorMessage: `An template with the name "${caseRequest.checklist_name}" already exists. Please choose a different name.`,
        };
      }

      // Create the main admin checklist record
      const response =
        await this.caseManangementSchemaService.createAdminCheckList(
          caseRequest,
          transaction
        );

      // If checklist creation was successful, manage associated checklist items (add/edit/delete)
      if (response) {
        await this.caseManangementSchemaService.manageAdminCheckListItems(
          caseRequest,
          response.rid,
          transaction
        );
      }

      // Commit the transaction after all operations succeed
      await transaction.commit();

      return {
        statusCode: HttpStatus.SUCCESS,
        message: STATUS_MESSAGE.adminChecklistCreated,
        data: {
          checklist: response,
        },
      };
    } catch (err) {
      console.log(err);
      logMessage(`Error creating admin checklist: ${err}`);
      await transaction.rollback();
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: STATUS_MESSAGE.adminChecklistFailed,
      };
    }
  }

   /**
   * Updates an existing admin checklist with associated checklist items within a database transaction.
   *
   * @param {ICreateChecklistTemplate} caseRequest - The checklist data including template information, checklist items to update, and checklist_rid for identification
   * @param {string} userId - The ID of the user updating the checklist (will be set as modified_by)
   *
   * @returns {Promise<{
   *   statusCode: number;
   *   message: string;
   *   errorMessage?: string;
   *   data?: { checklist: any };
   * }>} - Result of the update process with status code, message, and updated checklist data if successful
   *
   * @description
   * This method performs the following operations within a database transaction:
   * - Initializes a database transaction for atomic operations
   * - Sets the modified_by field to the provided userId
   * - Updates the existing admin checklist record using the schema service
   * - Manages associated checklist items (add new, update existing, delete removed items)
   * - Uses checklist_rid from caseRequest to identify the checklist to update
   * - Commits the transaction on success or rolls back on any error
   * - Returns success response with updated checklist data or error response with details
   * - Logs errors and ensures proper transaction cleanup
   */

  async updateAdminCheckList(
    caseRequest: ICreateChecklistTemplate,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { checklist: any };
  }> {
    // Initialize database connection and start transaction for atomic operations
    const dbInit = await this.caseModelService.getMainSequelize();
    const transaction = await dbInit.transaction();
    try {
      // Set the user who is creating this checklist
      caseRequest.created_by = userId;
      const isUnique = await this.caseManangementSchemaService.checkisExistingChecklistTemplateUnique(caseRequest);
      if (!isUnique) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: HttpStatus.BAD_REQUEST_MESSAGE,
          errorMessage: `A template with the name "${caseRequest.checklist_name}" . Please choose a different name.`,
        };
      }
      // Create the main admin checklist record
      const response =
        await this.caseManangementSchemaService.updateAdminChecklist(
          caseRequest,userId
        );

      // If checklist creation was successful, manage associated checklist items (add/edit/delete)
      if (response) {
        await this.caseManangementSchemaService.manageAdminCheckListItems(
          caseRequest,
          caseRequest.checklist_template_rid!,
          transaction
        );
      }

      // Commit the transaction after all operations succeed
      await transaction.commit();

      return {
        statusCode: HttpStatus.SUCCESS,
        message: STATUS_MESSAGE.adminChecklistCreated,
        data: {
          checklist: response,
        },
      };
    } catch (err) {
      logMessage(`Error creating admin checklist: ${err}`);
      await transaction.rollback();
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: STATUS_MESSAGE.adminChecklistFailed,
      };
    }
  }

  /**
   * Retrieves admin checklists with comprehensive filtering, pagination, and search capabilities.
   *
   * @param {any} data - Request parameters object containing pagination and sorting options
   * @param {Record<string, any>} filters - Advanced filter conditions for data refinement
   * @param {string} userId - The ID of the user requesting the data (for authorization)
   * @param {string} apiType - Operation type determining response format ("list" or "download")
   *
   * @returns {Promise<{
   *   statusCode: number;
   *   message: string;
   *   errorMessage?: string;
   *   data?: { checklist: any; count: number };
   * }>} - Result object with status code, message, and checklist data if successful
   *
   * @description
   * This method performs the following operations:
   * - Delegates data retrieval to the schema service with provided parameters
   * - Processes pagination, sorting, and filtering options
   * - Applies search functionality across checklist fields
   * - Returns structured response with checklist data and total count
   * - Handles both list view and export scenarios based on apiType
   * - Provides consistent error handling and response formatting
   */
  async listAdminCheckList (
    data: any,
    filters: Record<string, any>,
    userId: string,
    apiType: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { checklist: any; count: number };
  }> {
    const result = await this.caseManangementSchemaService.listAdminCheckList(data.page,data.limit,apiType,filters,data.search, data.sortBy, data.sortOrder);
  if (result != null) {
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          checklist: result,
          count: result[0]?.total_records || 0,
        },
      };
    } else {
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.NOT_FOUND_MESSAGE,
        data: {
          checklist: [],
          count: 0,
        },
      };
    }
  }

  async updateAdminChecklist(
    data: any,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { checklist: any };
  }> {
    try {
      const result = await this.caseManangementSchemaService.updateAdminChecklist(data, userId);
      
      if (result.statusCode === HttpStatus.SUCCESS) {
        return {
          statusCode: HttpStatus.SUCCESS,
          message: "Admin checklist updated successfully",
          data: {
            checklist: result.data,
          },
        };
      } else {
        return {
          statusCode: result.statusCode,
          message: result.message,
          errorMessage: result.errorMessage,
        };
      }
    } catch (error: any) {
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: error.message,
      };
    }
  }

  /**
   * Retrieves detailed admin checklist template information by unique identifier.
   *
   * @param {string} checkListRid - The unique identifier (RID) of the checklist template to retrieve
   *
   * @returns {Promise<{
   *   statusCode: number;
   *   message: string;
   *   errorMessage?: string;
   *   data?: { checklistDetails: any };
   * }>} - Result object with status code, message, and detailed checklist template data if successful
   *
   * @description
   * This method performs the following operations:
   * - Delegates detailed data retrieval to the schema service with the provided checklist RID
   * - Fetches comprehensive checklist template information including associated items and metadata
   * - Validates the existence of the checklist template and returns appropriate error if not found
   * - Returns structured response with complete checklist template details
   * - Provides consistent error handling and response formatting
   * - Logs errors for debugging and audit purposes
   *
   * @throws {Error} - Catches and handles service-level errors, database connection issues, and data retrieval failures
   * 
   * **Response Structure:**
   * - Returns detailed checklist template data including:
   *   - Template metadata (name, description, effective dates, status)
   *   - Associated checklist items with their configurations and sequencing
   *   - User information for created/modified tracking
   *   - Template configuration settings and assignments
   */
  async getCheckListTemplateDetailsById(checkListRid: string): Promise<{
  statusCode: number;
  message: string;
  errorMessage?: string;
  data?: { checklistDetails: any };
}> {
  try {
    const checklistDetails =
      await this.caseManangementSchemaService.fetchChecklistTemplateDetailsById(
        checkListRid
      );

    if (!checklistDetails) {
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: "Invalid CheckList ID",
      };
    }

    return {
      statusCode: HttpStatus.SUCCESS,
      message: HttpStatus.SUCCESS_MESSAGE,
      data: {
        checklistDetails,
      },
    };
  } catch (err) {
    logMessage(`Error fetching checklist details, ${err}`);
     return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: STATUS_MESSAGE.checkListError,
      };
  }
}

  async createTaskTemplate (data : CreateTaskTemplateType, userId : string) {
    const createTaskResult = await this.caseManangementSchemaService.createTaskTemplate(data, userId);
    if(createTaskResult.statusCode == HttpStatus.SUCCESS) {
      return {
        statusCode : createTaskResult.statusCode,
        statusMessage : createTaskResult.statusMessage
      }
    } else {
      return {
        statusCode : createTaskResult.statusCode,
        statusMessage : createTaskResult.statusMessage
      } 
    }
  }
  async getAllPriority () {
    const mainDb = await this.getMainDb();
    const result = await mainDb.query<priorityTypes>(rawQueries.getPriorityTypes(), {
      type : QueryTypes.SELECT
    });
    if(result.length > 0) {
      return {
        statusCode : HttpStatus.SUCCESS,
        data : result
      }
    } else {
      return {
        statusCode : HttpStatus.NOT_FOUND,
        data : []
      }     
    }
  }
  async getMilestones () {
    const mainDb = await this.getMainDb();
    const result = await mainDb.query<MilestoneTypes>(rawQueries.getMilestones(), {type : QueryTypes.SELECT});
    if(result.length > 0) {
      return {
        statusCode : HttpStatus.SUCCESS,
        data : result
      }      
    } else {
      return {
        statusCode : HttpStatus.NOT_FOUND,
        data : []
      }  
    }
  }
  async getChecklist () {
    const mainDb = await this.getMainDb();
    const result = await mainDb.query<checkListTypes>(rawQueries.getChecklistTypes(), {type : QueryTypes.SELECT});
    if(result.length > 0) {
      return {
        statusCode : HttpStatus.SUCCESS,
        data : result
      }      
    } else {
      return {
        statusCode : HttpStatus.NOT_FOUND,
        data : []
      }  
    }
  }
  async updateTaskTemplate (data : UpdateTaskTemplateType, userId : string)  {
    const result = await this.caseManangementSchemaService.updateTaskTemplate(data, userId);
    if(result?.statusCode == HttpStatus.SUCCESS) {
      return {
        statusCode : result.statusCode,
        statusMessage : result.statusMessage
      }
    } else if(result?.statusCode === HttpStatus.NOT_FOUND) {
      return {
        statusCode : result.statusCode,
        statusMessage : result.statusMessage
      }      
    } else if(result?.statusCode === HttpStatus.BAD_REQUEST) {
      return {
        statusCode : result.statusCode,
        statusMessage : result.statusMessage
      }      
    } else {
      return {
        statusCode : result.statusCode,
        statusMessage : result.statusMessage
      }      
    }
  }
  async fetchTaskTemplate (data : AdminTaskTemplatePayloadType, isExport : boolean, isGraphql : boolean, templateRid : string | null) {
    const mainDb = await this.getMainDb();
    const result = await mainDb.query<AdminTaskTemplateResponseTypes>(fetchAdminTemplates(data.page, data.limit, data.sort, data.sort_by, data.filter, data.search, isExport, isGraphql, templateRid), {type : QueryTypes.SELECT});
    if(result.length > 0) {
      return {
        statusCode : HttpStatus.SUCCESS,
        data : result
      }
    } else {
      return {
        statusCode : HttpStatus.NOT_FOUND,
        data : []
      }     
    }
  }
  async inlineEditTaskTemplate (data : any) {
    const mainDb = await this.getMainDb();
    const isTaskExists = await this.caseManangementSchemaService.checkTaskExistsForUpdate(data.rid);
    if(isTaskExists) {
      const setData = setTaskTemplateData(isTaskExists, data, data.userId)
      if(setData.length > 0) {
        const result : any = await mainDb.query(rawQueries.updateTaskTemplate(setData, data.rid));
        if(result[1].rowCount == 1) {
          const responsePayload : AdminTaskTemplatePayloadType = {
            page : 1,
            limit : 1,
            search : "",
            filter : {},
            sort : "",
            sort_by : ""
          }
          const responseData = await this.fetchTaskTemplate(responsePayload, false, true, data.rid);
          if(responseData.data.length > 0) {
          return {
            statusCode : HttpStatus.SUCCESS,
            statusMessage : STATUS_MESSAGE.taskTemplateSuccess,
            data : responseData.data[0]
            }
          }
        }
      } else {
          const responsePayload : AdminTaskTemplatePayloadType = {
          page : 1,
          limit : 1,
          search : "",
          filter : {},
          sort : "",
          sort_by : ""
        }
          const responseData = await this.fetchTaskTemplate(responsePayload, false, true, data.rid);
          if(responseData.data.length > 0) {
          return {
            statusCode : HttpStatus.SUCCESS,
            statusMessage : STATUS_MESSAGE.taskTemplateSuccess,
            data : responseData.data[0]
          }
        }
      }
    }
  }
  async fetchTaskTypeForTemplate () {
    const result = await this.caseManangementSchemaService.fetchTaskTypes();
    if(result.length > 0) {
      return {
        statusCode : HttpStatus.SUCCESS,
        data : result
      }
    } else {
      return {
        statusCode : HttpStatus.NOT_FOUND,
        data : []
      }      
    }
  }
  async getTaskTemplateDetailsById (rid : string) {
    const mainDb = await this.getMainDb();
    const result = await mainDb.query<AdminTaskTemplateResponseTypes>(fetchAdminTemplates(1,1, '', '', {},'', false, true, rid), {type : QueryTypes.SELECT});
    if(result.length > 0) {
      let targetData : any[] = []
      targetData = result.map((d : any) => d.workflow_connector.map((w : any) => {
        return {
          target_rid : w.target_rid,
          target_name : w.target_name
        }
      }));
      const finalStructuredData = result.map((d : any) => {
        return {
          ...d,
          workflow_connector : {
            source_rid : d.workflow_connector[0].source_rid,
            source_name : d.workflow_connector[0].source_name,
            relationship_connector_rid : d.workflow_connector[0].relationship_connector_rid,
            relationship_type_name : d.workflow_connector[0].relationship_type_name,
            target_data : targetData
          }
        }
      })
      return {
        statusCode : HttpStatus.SUCCESS,
        statusMessage : STATUS_MESSAGE.taskTemplateSuccess,
        data : finalStructuredData[0]
      }
    } else {
      return {
        statusCode : HttpStatus.NOT_FOUND,
        statusMessage : STATUS_MESSAGE.dataNotAvailable,
        data : null
      }
    }
  }
  async fetchKanbanBoardForCase (accountRid : string, caseRid : string) {
    const mainDb = await this.getMainDb();
    const fetchParentRnumber : any = await mainDb.query(await rawQueries.fetchParentAccount(accountRid, mainDb));
    if(fetchParentRnumber[0].length > 0) {
      const schemaName = rawQueries.fetchSchemaName(fetchParentRnumber[0][0].r_number);
      const caseDetails = await this.caseManangementSchemaService.getCaseDetails(caseRid, fetchParentRnumber[0][0].r_number);
      const result : any = await this.caseManangementSchemaService.fetchKanbanBoard(schemaName, caseRid, accountRid);
      if(result.array_agg[0].rid !== null) {
        let uniquePriorityIds = [...new Set(result.array_agg.flatMap((d : any) => d.tasks.map((dd : any) => dd.priority_rid)))];
        let uniqueAssignedToIds = [...new Set(result.array_agg.flatMap((d : any) => d.tasks.map((dd : any) => dd.assigned_to)))]
        let uniqueTeamRoleIds = [...new Set(result.array_agg.flatMap((d : any) => d.tasks.map((dd : any) => dd.case_team_member_role_rid)))]
        let uniqueTaskTypeIds = [...new Set(result.array_agg.flatMap((d : any) => d.tasks.map((dd : any) => dd.task_type_rid)))]
        let statusIds = [...new Set(result.array_agg.flatMap((d : any) => d.tasks.map((dd : any) => dd.status_rid)))]
        let taskStatusIds = [...new Set(result.array_agg.flatMap((d : any) => d.tasks.map((a : any) => a.task_status_rid)))];

        let priority;
        let assignedTo;
        let teamRole;
        let tasktype;
        let statusType;
        let taskStatusType;

        let priorityQuery = rawQueries.getAllPriorityTypes(uniquePriorityIds)
        if(priorityQuery) {
          priority = await mainDb.query(priorityQuery) 
        }
        let assignedToQuery = rawQueries.getAllUsers(uniqueAssignedToIds)
        if(assignedToQuery) {
          assignedTo = await mainDb.query(assignedToQuery) 
        }
        let teamRoleQuery = rawQueries.getAllTeamRoles(uniqueTeamRoleIds)
        if(teamRoleQuery) {
          teamRole = await mainDb.query(teamRoleQuery)
        }
        let taskTypeQuery = rawQueries.getAllTaskTypes(uniqueTaskTypeIds);
        if(taskTypeQuery) {
          tasktype = await mainDb.query(taskTypeQuery)
        }
        let statusQuery = rawQueries.getAllStatus(statusIds)
        if(statusQuery) {
          statusType = await mainDb.query(statusQuery)
        }
        let taskStatusQuery = rawQueries.getAllTaskStatus(taskStatusIds);
        if(taskStatusQuery) {
          taskStatusType = await mainDb.query(taskStatusQuery)
        }
        const [fetchCaseStatus] = await mainDb.query<caseStatusType>(rawQueries.getCaseStatusById(caseDetails?.status_rid!), {type : QueryTypes.SELECT});
        
        let priorityMap : Map<string, string> = new Map(priority?.[0]?.map((d : any) => [d.rid, d.priority_name]));
        let assignedToMap : Map<string, string> = new Map(assignedTo?.[0]?.map((d : any) => [d.rid, d.name]));
        let teamRoleMap : Map<string, string> =new Map(teamRole?.[0]?.map((d : any) => [d.rid, d.role_name]));
        let taskTypeMap : Map<string, string> = new Map(tasktype?.[0]?.map((d : any) => [d.rid, d.task_type_name]));
        let statusMap : Map<string, string> = new Map(statusType?.[0]?.map((d : any) => [d.rid, d.status_name]));
        let taskStatusMap : Map<string, string> = new Map(taskStatusType?.[0]?.map((d : any) => [d.rid, d.task_status_name]));
        
        let dynamicResult;
        if(fetchCaseStatus?.status_name.toLowerCase() === "audit review") {
          dynamicResult = result.array_agg
        } else {
          dynamicResult = result.array_agg.filter((d : any) => d.milestone_name.toLowerCase() !== 'audit review')
        }
        
        const finalStructure = dynamicResult.map((d : any) => {
          return {
            rid : d.rid,
            milestone_name : d.milestone_name,
            task_count : d.task_count,
            tasks : d.tasks.map((d : any) => {
              return {
                rid: d.rid,
                r_number: d.r_number,
                task_name: d.task_name,
                created_by: d.created_by,
                status_rid: d.status_rid,
                assigned_to: d.assigned_to,
                sequence_no: d.sequence_no,
                priority_rid: d.priority_rid,
                task_type_rid: d.task_type_rid,
                effort_in_days: d.effort_in_days,
                checklists_count: d.checklists_count,
                comments_count : d.comments_count,
                task_description: d.task_description,
                effective_end_datetime: d.effective_end_datetime,
                effective_start_datetime: d.effective_start_datetime,
                case_team_member_role_rid: d.case_team_member_role_rid,
                milestone_template_rid: d.milestone_template_rid,
                priority_name : priorityMap.get(d.priority_rid) || null,
                assigned_to_name : assignedToMap.get(d.assigned_to) || null,
                case_team_member_role_name : teamRoleMap.get(d.case_team_member_role_rid) || null,
                task_type_name : taskTypeMap.get(d.task_type_rid) || null,
                status_name : statusMap.get(d.status_rid) || null,
                task_status_rid : d.task_status_rid,
                task_status_name : taskStatusMap.get(d.task_status_rid) || null
              }
            })
          }
        })
        return {
          statusCode : HttpStatus.SUCCESS,
          data : finalStructure
        }
      } else {
        return {
        statusCode : HttpStatus.NOT_FOUND,
        data : []
        }
      }
    } else {
        return {
        statusCode : HttpStatus.FAILED,
        data : []
        }
    }
  }
 async createEmailTemplate(
    emailRequest: ICreateEmailTemplate,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { emailTemplate: any };
  }> {
    try {
      // Set the user who is creating this checklist
     emailRequest.created_by = userId;
      
      const result = await this.caseManangementSchemaService.checkEmailTemplateUniquenessAndCategory(emailRequest);
      if (!result.isUnique) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: HttpStatus.BAD_REQUEST_MESSAGE,
          errorMessage: `An template with the name "${emailRequest.template_name}" already exists. Please choose a different name.`,
        };
      }
      if (!result.isSameCategoryExists) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: HttpStatus.BAD_REQUEST_MESSAGE,
          errorMessage: `An template with the category "${result.category_name}" already exists. Please choose a different category.`,
        };
      }

      

     const response = 
       await this.caseManangementSchemaService.createEmailTemplate(
          emailRequest
       ); 

      return {
        statusCode: HttpStatus.SUCCESS,
        message: STATUS_MESSAGE.emailCreatedSuccess,
        data: {
          emailTemplate: response,
        },
      };
    } catch (err) {
      logMessage(`Error creating email template: ${err}`);
      return {
  
      statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: STATUS_MESSAGE.emailCreationFailed,
      };
    }
  }
 async updateEmailTemplate(
  emailRequest: ICreateEmailTemplate,
  userId: string
): Promise<{
  statusCode: number;
  message: string;
  errorMessage?: string;
  data?: { emailTemplate: any };
}> {
  try {
    // Set the user who is creating this checklist

    emailRequest.modified_by = userId;
    if(emailRequest.template_name)
    {
    const result = await this.caseManangementSchemaService.checkisExistingTemplateUnique(emailRequest);
    if (!result.isUnique) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: HttpStatus.BAD_REQUEST_MESSAGE,
        errorMessage: `A template with the name "${emailRequest.template_name}" already exists. Please choose a different name.`,
      };
    }
    if (!result.isSameCategoryExists) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: HttpStatus.BAD_REQUEST_MESSAGE,
        errorMessage: `A template with the category "${result.category_name}" already exists. Please choose a different category.`,
      };
    }
  }
    const response =
      await this.caseManangementSchemaService.updateEmailTemplate(
        emailRequest
      );

    return {
      statusCode: HttpStatus.SUCCESS,
      message: STATUS_MESSAGE.emailUpdatedSuccess,
      data: {
        emailTemplate: response,
      },
    };
  } catch (err) {
    logMessage(`Error updating email templates: ${err}`);
    return {
      statusCode: HttpStatus.FAILED,
      message: HttpStatus.FAILED_MESSAGE,
      errorMessage: STATUS_MESSAGE.emailUpdateFailed,
    };
  }
}
async listEmailTemplates (
    data: any,
    filters: Record<string, any>,
    userId: string,
    apiType: string,
    emailTemplateRid?: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { emailTemplates: any; count: number };
  }> {
    const result = await this.caseManangementSchemaService.listEmailTemplates(data.page,data.limit,apiType,filters,data.search, data.sortBy, data.sortOrder,emailTemplateRid);
    if (result != null) {
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          emailTemplates: result,
          count: result[0]?.total_records || 0,
        },
      };
    } else {
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.NOT_FOUND_MESSAGE,
        data: {
          emailTemplates: [],
          count: 0,
        },
      };
    }
  }
     
 async getEmailPlaceHolders(
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { placeHolders: any };
  }> {
    try {
      const placeHolders = await this.caseManangementSchemaService.getEmailPlaceHolders();

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          placeHolders,
        },
      };
    } catch (err) {
      logMessage(`Error fetching case roles, ${err}`);
      throw this.throwServiceError(err as Error);
    }
  }

  async getEmailTemplateCategory(
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { categories: any };
  }> {
    try {
      const categories = await this.caseManangementSchemaService.getEmailTemplateCategory();
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          categories,
        },
      };
    } catch (err) {
      logMessage(`Error fetching case roles, ${err}`);
      throw this.throwServiceError(err as Error);
    }
  }


  async getEmailCategoryPlaceHolders(templateRid: string): Promise<{
  statusCode: number;
  message: string;
  errorMessage?: string;
  data?: { placeholders: any };
  }> {
  try {
  const result =
    await this.caseManangementSchemaService.fetchEmailCategoryPlaceHolders(
      templateRid
    );
      return {
    statusCode: HttpStatus.SUCCESS,
    message: HttpStatus.SUCCESS_MESSAGE,
    data: {
        placeholders: result,
    },
  };
  }
  catch (err) {
    logMessage(`Error fetching email template details, ${err}`);
    return {
      statusCode: HttpStatus.FAILED,
      message: HttpStatus.FAILED_MESSAGE,
      errorMessage: STATUS_MESSAGE.checkListError,
    };
  }
  }

  async getEmailTemplateDetailsById(templateRid: string): Promise<{
  statusCode: number;
  message: string;
  errorMessage?: string;
  data?: { emailTemplateDetails: any };
  }> {
  try {
  const emailTemplateDetails =
    await this.caseManangementSchemaService.fetchEmailTemplateDetailsById(
      templateRid
    );

  if (!emailTemplateDetails) {
    return {
      statusCode: HttpStatus.FAILED,
      message: HttpStatus.FAILED_MESSAGE,
      errorMessage: "Invalid Email Template ID",
    };
  }

  return {
    statusCode: HttpStatus.SUCCESS,
    message: HttpStatus.SUCCESS_MESSAGE,
    data: {
      emailTemplateDetails,
    },
  };
  } catch (err) {
  logMessage(`Error fetching email template details, ${err}`);
    return {
      statusCode: HttpStatus.FAILED,
      message: HttpStatus.FAILED_MESSAGE,
      errorMessage: STATUS_MESSAGE.checkListError,
    };
  }
  }

    /**
     * Formats an error response to be returned from service methods.
     *
     * @param {Error} err - The caught error object containing error details.
     *
     * @returns {{
     *   statusCode: number;
     *   message: string;
     *   errorMessage: string;
     * }} - Standardized error response object with consistent structure.
     *
     * @description
     * - Converts any caught error into a standardized service error format.
     * - Sets status code to FAILED (500) for consistent error handling.
     * - Preserves the original error message for debugging purposes.
     * - Used across all service methods to maintain consistent error response structure.
     * - Ensures all service errors follow the same format for frontend consumption.
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
  async getWorkflowConnetorData () {
    const result = await this.caseManangementSchemaService.getWorkFlowConnector();
    if(result.length > 0) {
      return {
        statusCode : HttpStatus.SUCCESS,
        data : result
      }
    } else {
      return {
        statusCode : HttpStatus.NOT_FOUND,
        data : result
      }
    }
  }
  async linkTask (data : any) {
      const result = await this.caseManangementSchemaService.taskWorkflowConnector(data);
      return result;
    }
  async deleteLinkTask (data : any) {
    const result = await this.caseManangementSchemaService.deleteTaskWorkConnector(data);
    return result;
  }
  async adminTaskListForDropdown (data : any) {
    const result = await this.caseManangementSchemaService.listTasksDropdown(data);
    if(result.length > 0) return result
    else return []
  }

}