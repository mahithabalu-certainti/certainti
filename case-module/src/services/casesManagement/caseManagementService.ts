import { Logger } from "winston";
import { CaseModelService } from "../caseModelsService";
import { QueryTypes, Sequelize } from "sequelize";
import { CaseManagementSchemaService } from "./schemaService";
import { HttpStatus, rawQueries, STATUS_MESSAGE } from "../../utils/constants";
import { logMessage, setTaskTemplateData } from "../../utils/helpers";
import CaseSchemaService from "../cases/schemaService";
import { AdminTaskTemplatePayloadType, AdminTaskTemplateResponseTypes, checkListTypes, CreateTaskTemplateType, ICreateChecklist, ICreateChecklistTemplate, MilestoneTypes, priorityTypes, UpdateTaskTemplateType } from "../../utils/types";
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
          checklist: null,
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
  async updateTaskTemplate (data : UpdateTaskTemplateType, userId : string) {
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
      return {
        statusCode : HttpStatus.SUCCESS,
        statusMessage : STATUS_MESSAGE.taskTemplateSuccess,
        data : result[0]
      }
    } else {
      return {
        statusCode : HttpStatus.NOT_FOUND,
        statusMessage : STATUS_MESSAGE.dataNotAvailable,
        data : null
      }
    }
  }
}
