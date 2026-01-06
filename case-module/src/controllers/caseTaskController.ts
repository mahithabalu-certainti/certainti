import { Request, Response } from "express";
import {
  errorLog,
  generateExcelBase64,
  generateExcelBase64WithEmptyCheck,
  handleCustomResponse,
  handleErrorResponse,
  handleSuccessResponse,
  isValidTimezone,
  logMessage,
  successLog,
  validateRequest,
} from "../utils/helpers";
import {
  HttpStatus,

  STATUS_MESSAGE,
} from "../utils/constants";
import {
  caseSubmissionDateSchema,
  checklistByIdSchema,
  checklistSchema,
  createCaseSchema,
  createCaseTeamSchema,
  createTaskSchema,
  exportCasesAccountSchema,
  exportCaseSummarySchema,
  exportCheckListSchema,
  exportReviewProjectSchema,
  getEmailTemplatePreviewSchema,
  listCasesAccountSchema,
  listCaseSummarySchema,
  listCaseTeamSchema,
  listCheckListSchema,
  listReviewProjectSchema,
  sentReviewProjectSchema,
  updateCaseSchema,
  updateChecklistSchema,
  updateTaskSchema,
} from "../lib/joi/schemas/schema";
import configurations from "../config/config";
import moment from "moment";
import { checklistsFieldMappings, reviewProjectsFieldMappings,
    casesFieldMappings,
  casesSummaryFieldMappings,
 } from "../utils/excelExportMapping";

const services = configurations.getInstance().getServices();
const caseTaskService = services.caseTaskService;

/**
 * Controller function to handle the creation of a user-level task.
 *
 * This async function processes HTTP requests for creating a new task by:
 * - Validating the incoming request using the defined schema
 * - Ensuring that a valid user ID is present in the request headers
 * - Delegating the task creation logic to the `caseTaskService.createUserLevelTask` method
 * - Returning appropriate HTTP responses based on the service result (success, bad request, or failure)
 *
 * Error handling:
 * - Logs and returns a `BAD_REQUEST` response if validation or internal errors occur
 *
 * @param {Request} req - Express request object containing the request body and headers
 * @param {Response} res - Express response object used to send the API response
 * @returns {Promise<void>} - Resolves after sending the HTTP response
 * @throws {Error} - Captures and handles any runtime or validation errors
 */
async function createTask (req : Request, res : Response) {
  const methodName = "Create Task";
  try {
  const value = await validateRequest(req, createTaskSchema, res, "POST");
    if (!value) {
      return;    }
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User id is required"
      );
      return;
    }
    const data = req.body;
    data.created_by = userId
    const result = await caseTaskService.createUserLevelTask(data);
    if(result.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.statusMessage,
        data: result.data,
      });       
    } else if(result.statusCode === HttpStatus.BAD_REQUEST) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        statusCodeValue: HttpStatus.BAD_REQUEST_MESSAGE,
        statusMessage: result.statusMessage,
        data: result.data,
      }); 
    } else if(result.statusCode === HttpStatus.FAILED) {
      return res.status(HttpStatus.FAILED).json({
        statusCode: HttpStatus.FAILED,
        statusCodeValue: HttpStatus.FAILED_MESSAGE,
        statusMessage: result.statusMessage,
        data: result.data,
      }); 
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.BAD_REQUEST,
      HttpStatus.BAD_REQUEST_MESSAGE,
      error.message
    );
    return;
  }
}
/**
 * Controller function to handle updating an existing user-level task.
 *
 * This async function processes HTTP PUT requests for updating task details by:
 * - Validating the request body against the `updateTaskSchema`
 * - Ensuring a valid user ID is present in the request headers
 * - Adding the `modified_by` field based on the user ID
 * - Delegating update logic to the `caseTaskService.updateUserLevelTask` method
 * - Returning appropriate responses based on the service execution result
 *
 * Error handling:
 * - Logs and returns a `BAD_REQUEST` response if validation fails or any runtime error occurs
 *
 * @param {Request} req - Express request object containing the updated task data and headers
 * @param {Response} res - Express response object used to send the API response
 * @returns {Promise<void>} - Resolves after sending the HTTP response to the client
 * @throws {Error} - Captures and handles any validation or service-related errors
 */
async function updateTask (req : Request, res : Response) {
  const methodName = "Create Task";
  try {
  const value = await validateRequest(req, updateTaskSchema, res, "PUT");
    if (!value) {
      return;    }
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User id is required"
      );
      return;
    }
    const data = req.body;
    data.modified_by = userId
    console.log(req)
    const accessToken = req.headers['authorization'] as string;
    console.log(accessToken);
    const result = await caseTaskService.updateUserLevelTask(data, accessToken);
    if(result!.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result!.statusMessage
      });       
    } else if(result!.statusCode === HttpStatus.BAD_REQUEST) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        statusCodeValue: HttpStatus.BAD_REQUEST_MESSAGE,
        statusMessage: result!.statusMessage,
      }); 
    } else if(result!.statusCode === HttpStatus.FAILED) {
      return res.status(HttpStatus.FAILED).json({
        statusCode: HttpStatus.FAILED,
        statusCodeValue: HttpStatus.FAILED_MESSAGE,
        statusMessage: result!.statusMessage,
      }); 
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.BAD_REQUEST,
      HttpStatus.BAD_REQUEST_MESSAGE,
      error.message
    );
    return;
  }
}

/**
 * Controller function to fetch the list of tasks associated with a case.
 *
 * This async function processes HTTP requests to retrieve all tasks linked to one or more cases by:
 * - Validating that a valid user ID exists in the request headers
 * - Extracting request body parameters (like filters or case identifiers)
 * - Delegating task retrieval logic to the `caseTaskService.taskListForCases` method
 * - Returning the list of tasks or an empty array if no data is found
 *
 * Error handling:
 * - Returns a `BAD_REQUEST` response if the user ID is missing
 * - Catches and handles any runtime or service-level errors with a `FAILED` response
 *
 * @param {Request} req - Express request object containing case filters or parameters in the body and user ID in headers
 * @param {Response} res - Express response object used to send the list of case tasks or an error message
 * @returns {Promise<void>} - Resolves after sending the HTTP response
 * @throws {Error} - Captures and handles service or validation errors gracefully
 */
async function fetchCaseTaskList (req : Request, res : Response) {
  const methodName = "fetchCaseTaskList";
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    const data = req.body;
    const result = await caseTaskService.taskListForCases(data, false);
    if(result.statusCode == HttpStatus.SUCCESS) {
      let total = parseInt(result.data[0]?.total_result!);
      result.data.forEach((d : any) => {
        delete d.total_result
      })
      const finalData = {
        page : data.page,
        limit : data.limit,
        total_result : total,
        data : result.data
      }
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.userLevelTaskFetchSuccess,
        data: finalData,
      });      
    } else {
      const finalData = {
        page : data.page,
        limit : data.limit,
        total_result : 0,
        data : []
      }
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.dataNotAvailable,
        data: finalData,
      });       
    }   
  } catch (error: any) {
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

/**
 * Controller function to handle the creation or mapping of tags to cases or entities.
 *
 * This async function processes HTTP requests to either create new tags or map existing ones by:
 * - Validating that a valid user ID exists in the request headers
 * - Extracting tag-related data from the request body
 * - Delegating the business logic to `caseTaskService.createOrMapTags`
 * - Returning a success response with created/mapped tags or a fallback message if no data is available
 *
 * Error handling:
 * - Returns a `BAD_REQUEST` response if the user ID is missing
 * - Catches and handles runtime or service-level errors gracefully with a `FAILED` response
 *
 * @param {Request} req - Express request object containing tag creation/mapping data and user ID in headers
 * @param {Response} res - Express response object used to send the operation result back to the client
 * @returns {Promise<void>} - Resolves after sending the HTTP response
 * @throws {Error} - Captures and logs any validation or runtime errors
 */
async function createOrMapTags (req : Request, res : Response) {
  const methodName = "createOrMapTags"
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    const data = req.body; 
    data.userId = userId  
    const result = await caseTaskService.createOrMapTags(data);
    if(result.statusCode == HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.statusMessage,
      });        
    } else {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.statusMessage,
        data: null
      });  
    }
  } catch (error: any) {
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

/**
 * Controller function to fetch all available tags for dropdown or selection purposes.
 *
 * This async function processes HTTP requests to retrieve the complete list of tags by:
 * - Validating that a valid user ID exists in the request headers
 * - Delegating the tag retrieval logic to `caseTaskService.fetchTagsForDropdown`
 * - Returning the list of tags with a success message or an empty response if no data is found
 *
 * Error handling:
 * - Returns a `BAD_REQUEST` response if the user ID is missing in headers
 * - Catches and handles any runtime or service-level errors gracefully with a `FAILED` response
 *
 * @param {Request} req - Express request object containing user ID in headers
 * @param {Response} res - Express response object used to send the list of available tags or an error message
 * @returns {Promise<void>} - Resolves after sending the HTTP response to the client
 * @throws {Error} - Captures and logs any runtime or validation errors
 */
async function fetchAllTags(req : Request, res : Response) {
  const methodName = "fetchAllTags";
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    const data = req.body;
    const result = await caseTaskService.fetchTagsForDropdown(data)
    if(result.statusCode == HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.tagsListedSuccess,
        data: result.data,
      });   
    } else {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.dataNotAvailable,
        data: result.data,
      });
    }    
  } catch (error: any) {
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

/**
 * Controller function to add comments to a specific task.
 *
 * This async function processes HTTP requests for adding comments by:
 * - Validating that a valid user ID is present in the request headers
 * - Extracting comment details and task identifiers from the request body
 * - Delegating comment creation logic to `caseTaskService.addCommentsToTask`
 * - Returning success or failure responses based on the service execution result
 *
 * Error handling:
 * - Returns a `BAD_REQUEST` response if the user ID is missing
 * - Catches and handles runtime or service-level errors gracefully with a `FAILED` response
 *
 * @param {Request} req - Express request object containing task and comment data in the body, and user ID in headers
 * @param {Response} res - Express response object used to send success or failure responses
 * @returns {Promise<void>} - Resolves after sending the HTTP response
 * @throws {Error} - Captures and logs any validation or runtime errors
 */
async function addCommentsToSpecificTask (req : Request, res : Response) {
  const methodName = "addCommentsToSpecificTask";
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    const data = req.body;
    let fileArray : Express.Multer.File[] | [];
    if(Array.isArray(req.files)) {
      fileArray = req.files
    } else {
      fileArray = []
    }
    const result = await caseTaskService.addCommentsToTask(data, userId, fileArray);
    if(result.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.commentsAddedSuccess,
        data: result.data,
      }); 
    } else {
      return res.status(HttpStatus.FAILED).json({
        statusCode: HttpStatus.FAILED,
        statusCodeValue: HttpStatus.FAILED_MESSAGE,
        statusMessage: STATUS_MESSAGE.commentsFailed,
        data: result.data,
      }); 
    }
  } catch (error: any) {
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

/**
 * Controller function to handle exporting case tasks.
 *
 * This async function processes HTTP requests for exporting case tasks by:
 * - Validating that a valid user ID is present in the request headers
 * - Extracting export filters and parameters from the request body
 * - Delegating export logic to the `caseTaskService.exportTask` method
 * - Returning a success response with exported data (file/records) or a message if no data is found
 *
 * Error handling:
 * - Returns a `BAD_REQUEST` response if the user ID is missing
 * - Catches and handles any runtime or service-level errors gracefully with a `FAILED` response
 *
 * @param {Request} req - Express request object containing export parameters and user ID in headers
 * @param {Response} res - Express response object used to send the export result or error message
 * @returns {Promise<void>} - Resolves after sending the HTTP response
 * @throws {Error} - Captures and logs any validation or runtime errors
 */
async function exportCaseTask (req : Request, res : Response) {
  const methodName = "exportCaseTask";
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    const data = req.body;
    const result = await caseTaskService.exportTask(data, userId);
    if(result.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.taskExportedSuccess,
        data: result.data,
      }); 
    } else {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.dataNotAvailable,
        data: result.data,
      }); 
    }
  } catch (error: any) {
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

/**
 * Controller function to handle updating comments for a specific task.
 *
 * This async function processes HTTP requests to update an existing comment associated with a case task by:
 * - Validating that a valid user ID is provided in the request headers
 * - Extracting updated comment data and task identifiers from the request body
 * - Calling the `caseTaskService.updateComments` method to perform the update in the database
 * - Returning a success response with an appropriate status message based on the operation result
 *
 * Error handling:
 * - Returns a `BAD_REQUEST` response if the user ID is missing
 * - Catches and handles runtime or service-level errors gracefully with a `FAILED` response
 *
 * @param {Request} req - Express request object containing updated comment data and user ID in headers
 * @param {Response} res - Express response object used to send the update result or error message
 * @returns {Promise<void>} - Resolves after sending the HTTP response
 * @throws {Error} - Captures and logs any validation or runtime errors
 */
async function updateTaskComments (req : Request, res : Response) {
  const methodName = "updateTaskComments";
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    const data = req.body;
    let fileArray : Express.Multer.File[] | [];
    if(Array.isArray(req.files)) {
      fileArray = req.files
    } else {
      fileArray = []
    }
    data.deleted_file_ids = JSON.parse(data.deleted_file_ids)
    const result = await caseTaskService.updateComments(data, userId, fileArray);
    if(result.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.statusMessage,
      }); 
    } else {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.statusMessage,
      }); 
    }
  } catch (error: any) {
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

/**
 * Controller function to handle deleting comments from a specific task.
 *
 * This async function processes HTTP DELETE requests to remove a comment associated with a case task by:
 * - Validating that a valid user ID is provided in the request headers
 * - Extracting the comment ID and task information from the request body
 * - Invoking the `caseTaskService.deleteComments` method to perform the deletion in the database
 * - Returning an appropriate success or failure response based on the operation outcome
 *
 * Error handling:
 * - Returns a `BAD_REQUEST` response if the user ID is missing
 * - Returns a `FAILED` response if the comment deletion fails
 * - Catches and handles runtime or service-level errors gracefully
 *
 * @param {Request} req - Express request object containing comment details and user ID in headers
 * @param {Response} res - Express response object used to send the deletion result or error message
 * @returns {Promise<void>} - Resolves after sending the HTTP response
 * @throws {Error} - Captures and logs any validation or runtime errors
 */
async function deleteTaskComments (req : Request, res : Response) {
  const methodName = "deleteTaskComments";
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    const data = req.body;
    const result = await caseTaskService.deleteComments(data, userId);
    if(result.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.statusMessage,
      }); 
    } else if(result.statusCode === HttpStatus.FAILED){
      return res.status(HttpStatus.FAILED).json({
        statusCode: HttpStatus.FAILED,
        statusCodeValue: HttpStatus.FAILED_MESSAGE,
        statusMessage: result.statusMessage,
      }); 
    } else {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.statusMessage,
      });
    }
  } catch (error: any) {
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

/**
 * Controller function to handle fetching comments for a specific task.
 *
 * This async function processes HTTP requests to retrieve all comments associated with a given task by:
 * - Validating that a valid user ID is present in the request headers
 * - Extracting task identifiers or filter parameters from the request body
 * - Delegating the comment retrieval logic to the `caseTaskService.fetchTaskComment` method
 * - Returning a success response with the fetched comments or a message if no comments are found
 *
 * Error handling:
 * - Returns a `BAD_REQUEST` response if the user ID is missing
 * - Returns a `FAILED` response in case of runtime or service-level errors
 * - Logs all errors for debugging and traceability
 *
 * @param {Request} req - Express request object containing task identification details and user ID in headers
 * @param {Response} res - Express response object used to send the list of comments or an error message
 * @returns {Promise<void>} - Resolves after sending the HTTP response
 * @throws {Error} - Captures and handles validation or runtime exceptions
 */
async function fetchTaskCommentsList (req : Request, res : Response) {
  const methodName = "fetchTaskCommentsList";
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    const data = req.body;
    const result = await caseTaskService.fetchTaskComment(data);
    if(result.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.commentsFetchedSuccess,
        data : result.data
      }); 
    } else {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.dataNotAvailable,
        data : []
      });
    }
  } catch (error: any) {
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

/**
 * Controller function to handle adding attachments to a specific task.
 *
 * This async function processes HTTP requests that upload and associate one or more files with a case task by:
 * - Validating that a valid user ID is present in the request headers
 * - Extracting file(s) from the `req.files` object (handled via Multer middleware)
 * - Extracting task-related metadata from the request body
 * - Delegating the upload and association logic to the `caseTaskService.addTaskLevelAttachment` method
 * - Returning a success or failure response based on the result of the service operation
 *
 * File handling:
 * - Supports multiple file uploads via `upload.array()` in the route definition
 * - Ensures a fallback to an empty array if no files are uploaded
 *
 * Error handling:
 * - Returns a `BAD_REQUEST` response if the user ID is missing
 * - Returns a `FAILED` response if attachment upload or mapping fails
 * - Catches and handles runtime or service-level errors gracefully
 *
 * @param {Request} req - Express request object containing task details, uploaded files, and user ID in headers
 * @param {Response} res - Express response object used to send the upload result or error message
 * @returns {Promise<void>} - Resolves after sending the HTTP response
 * @throws {Error} - Captures and logs any validation, upload, or runtime errors
 */
async function addTaskAttachments (req : Request, res : Response) {
  const methodName = "addTaskAttachments"
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    const data = req.body;
    let fileArray : Express.Multer.File[] | [];
    if(Array.isArray(req.files)) {
      fileArray = req.files
    } else {
      fileArray = []
    }
    const result = await caseTaskService.addTaskLevelAttachment(data, userId, fileArray);
    if(result.statusCode == HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.statusMessage,
      });
    } else {
      return res.status(HttpStatus.FAILED).json({
        statusCode: HttpStatus.FAILED,
        statusCodeValue: HttpStatus.FAILED_MESSAGE,
        statusMessage: result.statusMessage,
      });
    }
  } catch (error: any) {
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

/**
 * Controller function to handle deleting attachments from a specific task.
 *
 * This async function processes HTTP DELETE requests to remove one or more attachments linked to a case task by:
 * - Validating that a valid user ID is provided in the request headers
 * - Extracting task and attachment identifiers from the request body
 * - Delegating the deletion logic to the `caseTaskService.deleteTaskLevelAttachment` method
 * - Returning an appropriate HTTP response based on whether the deletion succeeded, failed, or if the attachment was not found
 *
 * Error handling:
 * - Returns a `BAD_REQUEST` response if the user ID is missing
 * - Returns a `FAILED` response if the deletion operation encounters errors
 * - Gracefully handles `NOT_FOUND` scenarios where no attachments match the provided identifiers
 * - Catches and handles unexpected runtime or service-level errors
 *
 * @param {Request} req - Express request object containing attachment and task identifiers, and user ID in headers
 * @param {Response} res - Express response object used to send the deletion result or error message
 * @returns {Promise<void>} - Resolves after sending the HTTP response
 * @throws {Error} - Captures and logs any validation or runtime errors
 */
async function deleteTaskAttachments (req : Request, res : Response) {
  const methodName = "deleteTaskAttachments"
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    const data = req.body;
    const result = await caseTaskService.deleteTaskLevelAttachment(data, userId);
    if(result.statusCode == HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.statusMessage,
      });
    } 
    else if(result.statusCode === HttpStatus.NOT_FOUND) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.statusMessage,
      });
    }
    else {
      return res.status(HttpStatus.FAILED).json({
        statusCode: HttpStatus.FAILED,
        statusCodeValue: HttpStatus.FAILED_MESSAGE,
        statusMessage: result.statusMessage,
      });
    }
  } catch (error: any) {
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

/**
 * Controller function to handle fetching the list of attachments for a specific task.
 *
 * This async function processes HTTP requests to retrieve all attachments linked to a particular case task by:
 * - Validating that a valid user ID is provided in the request headers
 * - Extracting the necessary identifiers from the request body
 * - Invoking the `caseTaskService.listTaskLevelAttachment` method to fetch attachments from the database
 * - Returning the list of attachments with appropriate HTTP status and messages
 *
 * Response handling:
 * - Returns `SUCCESS` with the list of attachments when found
 * - Returns `SUCCESS` with an `attachmentNotFound` message when no attachments exist for the given task
 *
 * Error handling:
 * - Returns a `BAD_REQUEST` response if the user ID is missing in the headers
 * - Returns a `FAILED` response in case of service or runtime errors
 *
 * @param {Request} req - Express request object containing task identifiers in the body and user ID in headers
 * @param {Response} res - Express response object used to return the attachment list or error message
 * @returns {Promise<void>} - Resolves after sending the HTTP response
 * @throws {Error} - Captures and logs any runtime or validation errors
 */
async function listTaskAttachments (req : Request, res : Response) {
  const methodName = "listTaskAttachments"
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    const data = req.body;
    const result = await caseTaskService.listTaskLevelAttachment(data);
    if(result.statusCode == HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.attachementTaskListSuccess,
        data : result.data
      });
    } 
    else {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.attachmentNotFound,
        data : result.data
      });
    }
  } catch (error: any) {
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

/**
 * Controller function to fetch all activity logs related to a specific task.
 *
 * This asynchronous function handles incoming requests to retrieve the complete activity history
 * of a case task (e.g., updates, comments, attachments, and other events).  
 * It validates user authentication, delegates the data retrieval to the service layer, and 
 * returns an appropriate structured response.
 *
 * Workflow:
 * 1. Validates that `x-user-id` is present in the request headers.
 * 2. Extracts task-related identifiers or filters from the request body.
 * 3. Invokes `caseTaskService.fetchAllTaskActivities` to fetch task activity details.
 * 4. Responds with:
 *    - `SUCCESS` and `activitiesFetchedSuccess` when data is found.
 *    - `SUCCESS` and `dataNotAvailable` when no activity data exists.
 *
 * Error handling:
 * - Returns `BAD_REQUEST` if the user ID header is missing.
 * - Returns `FAILED` if an exception occurs during processing.
 *
 * @param {Request} req - Express request object containing user ID in headers and task filter details in the body.
 * @param {Response} res - Express response object used to return task activity data or error messages.
 * @returns {Promise<void>} - Resolves when the response has been sent.
 * @throws {Error} - Logs and handles unexpected runtime or service-layer errors.
 */
async function fetchTaskActivity (req : Request, res : Response) {
  const methodName = "fetchTaskActivity"
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    const data = req.body;
    const result = await caseTaskService.fetchAllTaskActivities(data);
    if(result.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.activitiesFetchedSuccess,
        data : result.data
      });
    } else {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.dataNotAvailable,
        data : result.data
      });
    }

  }
  catch (error: any) {
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

/**
 * Controller to fetch detailed information related to a specific task.
 *
 * This function retrieves task card details (such as metadata, assigned users,
 * priority, due dates, and related case/task attributes) via the service layer.
 * It ensures user authentication, processes request payload, and responds with
 * appropriate status messages and data.
 *
 * Workflow:
 * 1. Validates that `x-user-id` exists in the request headers.
 * 2. Extracts required task identifiers and filters from the request body.
 * 3. Calls `caseTaskService.fetchTaskCardDetailsList` to fetch task-level details.
 * 4. Responds with:
 *    - `SUCCESS` and `activitiesFetchedSuccess` if data exists.
 *    - `SUCCESS` and `dataNotAvailable` if no matching task details are found.
 *
 * Error Handling:
 * - Returns `BAD_REQUEST` if missing user ID.
 * - Returns `FAILED` for any unexpected errors.
 *
 * @param {Request} req - Express request object containing headers and task detail input.
 * @param {Response} res - Express response object used to return result data or error messages.
 * @returns {Promise<void>} - Sends the API response and resolves.
 */
async function fetchTaskDetails (req : Request, res : Response) {
  const methodName = "fetchTaskDetails"
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    const data = req.body;
    const result = await caseTaskService.fetchTaskCardDetailsList(data);
    if(result.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.activitiesFetchedSuccess,
        data : result.data
      });
    } else {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.dataNotAvailable,
        data : result.data
      });
    }

  }
  catch (error: any) {
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

/**
 * Controller to fetch the list of task status values for cases.
 *
 * This endpoint retrieves the available task status options used in
 * the case/task workflow (e.g., Open, In Progress, Completed).
 * It ensures that the user is authenticated, calls the service layer
 * to fetch the task status list, and returns a consistent JSON response.
 *
 * Workflow:
 * 1. Confirms that the `x-user-id` header is provided.
 * 2. Invokes `caseTaskService.getCaseTaskStatusList()` to fetch status metadata.
 * 3. Responds with:
 *    - `SUCCESS` and `caseTaskStatusListedSuccess` when data exists.
 *    - `SUCCESS` and `dataNotAvailable` with an empty list when no statuses are found.
 *
 * Error Handling:
 * - Returns `BAD_REQUEST` when the user ID is missing.
 * - Returns `FAILED` with a descriptive message in case of unexpected errors.
 *
 * @param {Request} req - Express request object containing user ID in headers
 * @param {Response} res - Express response object used to send the result
 * @returns {Promise<void>} - Resolves after sending the HTTP response
 */
async function fetchCaseTaskStatus (req : Request, res : Response) {
  const methodName = "fetchCaseTaskStatus"
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    const result = await caseTaskService.getCaseTaskStatusList();
    if(result.length > 0) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.caseTaskStatusListedSuccess,
        data : result
      });
    } else {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.dataNotAvailable,
        data : []
      });
    }

  }
  catch (error: any) {
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

/**
 * Controller to add collaborators to a specific task.
 *
 * This function handles HTTP requests for assigning collaborators to a task.
 * It performs validation, enriches the request data with metadata, and then
 * delegates the core logic to `caseTaskService.addCollaboratorToTask()`.
 *
 * Key Responsibilities:
 * - Validates the presence of a valid `x-user-id` header
 * - Injects `created_by` into the request body for auditing purposes
 * - Calls the service to add collaborators to the task
 * - Returns success, validation error, or failure responses accordingly
 *
 * Response Behavior:
 * - **SUCCESS** → Responds with a success message when collaborators are added
 * - **BAD_REQUEST** → Responds when required data is missing or invalid
 * - **FAILED** → Responds to unexpected service-level or internal errors
 *
 * Error Handling:
 * - Missing user ID → Returns `BAD_REQUEST`
 * - Any internal exception → Returns `FAILED` with the error message
 *
 * @param {Request} req - Express request containing collaborator data and user ID in headers
 * @param {Response} res - Express response used to send the outcome
 * @returns {Promise<void>} - Completes after responding to the client
 */
async function addCollaborators (req : Request, res : Response) {
  const methodName = "addCollaborators"
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    const data = req.body;
    data.created_by = userId
    const result = await caseTaskService.addCollaboratorToTask(data);
    if(result.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.statusMessage,
      });
    } else if (result.statusCode === HttpStatus.BAD_REQUEST) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        statusCodeValue: HttpStatus.BAD_REQUEST_MESSAGE,
        statusMessage: result.statusMessage
      });
    } else {
      return res.status(HttpStatus.FAILED).json({
        statusCode: HttpStatus.FAILED,
        statusCodeValue: HttpStatus.FAILED_MESSAGE,
        statusMessage: result.statusMessage
      });
    }

  }
  catch (error: any) {
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

/**
 * Controller to list collaborators for a specific case or task.
 *
 * This function handles HTTP requests to fetch the list of collaborators
 * associated with the provided input criteria. It validates required headers,
 * forwards the request data to the service layer, and formats the response
 * consistently.
 *
 * Key Responsibilities:
 * - Validates the presence of a valid `x-user-id` header
 * - Delegates the retrieval logic to `caseTaskService.getCollaboratorsList()`
 * - Returns collaborator list data if available, otherwise an empty array
 *
 * Response Behavior:
 * - **SUCCESS** → Returns the collaborators list or an empty array with a success message
 * - **BAD_REQUEST** → Triggered when the required header `x-user-id` is missing
 * - **FAILED** → Triggered for service-level or unexpected internal errors
 *
 * Error Handling:
 * - Missing `x-user-id` → Responds with `BAD_REQUEST`
 * - Exceptions thrown by the service → Responds with `FAILED` and error details
 *
 * @param {Request} req - Express request containing filtering data in body and user ID in headers
 * @param {Response} res - Express response used to return the API result
 * @returns {Promise<void>} - Resolves after sending an HTTP response
 */
async function listCollaborators (req : Request, res : Response) {
  const methodName = "listCollaborators"
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    const data = req.body;
    const result : any = await caseTaskService.getCollaboratorsList(data);
    if(result?.length > 0) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.collaboratorsListedSuccess,
        data : result
      });
    } else {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.dataNotAvailable,
        data : []
      });
    }
  }
  catch (error: any) {
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

async function linkTask (req : Request, res : Response) {
  const methodName = "linkTask";
  try {
   const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    const data = req.body;
    data.created_by = userId
    const result = await caseTaskService.linkTask(data); 
    if(result.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.statusMessage,
      });
    } 
    else if (result.statusCode === HttpStatus.NOT_FOUND) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.statusMessage,
      });
    }
    else if (result.statusCode === HttpStatus.BAD_REQUEST) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        statusCodeValue: HttpStatus.BAD_REQUEST_MESSAGE,
        statusMessage: result.statusMessage,
      });
    }
    else {
      return res.status(HttpStatus.FAILED).json({
        statusCode: HttpStatus.FAILED,
        statusCodeValue: HttpStatus.FAILED_MESSAGE,
        statusMessage: result.statusMessage,
      });
    }
  } catch (error: any) {
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

async function linkDeleteTask (req : Request, res : Response) {
  const methodName = "linkDeleteTask";
  try {
   const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    const data = req.body;
    data.created_by = userId
    const result = await caseTaskService.deleteLinkTask(data); 
    if(result?.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.statusMessage,
      });
    } 
    else if (result?.statusCode === HttpStatus.NOT_FOUND) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.statusMessage,
      });
    }
    else {
      return res.status(HttpStatus.FAILED).json({
        statusCode: HttpStatus.FAILED,
        statusCodeValue: HttpStatus.FAILED_MESSAGE,
        statusMessage: result?.statusMessage,
      });
    }
  } catch (error: any) {
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

async function deleteTagsTaskLevel (req : Request, res : Response) {
  const methodName = "deleteTagsTaskLevel";
  try {
   const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    const data = req.body;
    data.userId = userId
    const result = await caseTaskService.deleteTagsAccountLevel(data); 
    if(result.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.statusMessage
      });
    } else if (result.statusCode === HttpStatus.BAD_REQUEST) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        statusCodeValue: HttpStatus.BAD_REQUEST_MESSAGE,
        statusMessage: result.statusMessage
      });
    }
    else {
      return res.status(HttpStatus.FAILED).json({
        statusCode: HttpStatus.FAILED,
        statusCodeValue: HttpStatus.FAILED_MESSAGE,
        statusMessage: result.statusMessage
      });
    }
  } catch (error: any) {
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

async function deleteCollaboratorsTaskLevel (req : Request, res : Response) {
  const methodName = "deleteCollaboratorsTaskLevel";
  try {
   const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    const data = req.body;
    data.user_rid = userId
    const result = await caseTaskService.deleteCollaborators(data); 
    if(result?.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.statusMessage
      });
    }
    else {
      return res.status(HttpStatus.FAILED).json({
        statusCode: HttpStatus.FAILED,
        statusCodeValue: HttpStatus.FAILED_MESSAGE,
        statusMessage: result?.statusMessage
      });
    }
  } catch (error: any) {
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

async function updateChecklistItemStatus (req : Request, res : Response) {
  const methodName = "updateChecklistItemStatus";
  try {
   const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    const data = req.body;
    const result = await caseTaskService.updateChecklistItemsStatus(data);
    if(result?.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.statusMessage
      });
    }
    else {
      return res.status(HttpStatus.FAILED).json({
        statusCode: HttpStatus.FAILED,
        statusCodeValue: HttpStatus.FAILED_MESSAGE,
        statusMessage: result?.statusMessage
      });
    }  
  } catch (error: any) {
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

async function caseLevelTaskDropdown (req : Request, res : Response) {
  const methodName = "caseLevelTaskDropdown"
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    const data = req.body;
    const result = await caseTaskService.getTaskDropDownForDependencyMapping(data);
    if(result.length > 0) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.taskTemplateSuccess,
        data : result
      });
    } else {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.dataNotAvailable,
        data : result
      });
    }
  } catch (error: any) {
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

/**
 * Controller to fetch the list of available case priority options.
 *
 * This endpoint retrieves predefined priority levels used for case/task
 * management (e.g., High, Medium, Low).  
 * It ensures authentication, fetches priority data through the service layer,
 * and returns an appropriate response based on data availability.
 *
 * Workflow:
 * 1. Validates that `x-user-id` is present in the request headers.
 * 2. Calls `caseTaskService.getCasePriortyList()` to retrieve priority values.
 * 3. Responds with:
 *    - `SUCCESS` and `casePriorityListedSuccess` if priorities exist.
 *    - `SUCCESS` and `dataNotAvailable` with an empty list if no priorities exist.
 *
 * Error Handling:
 * - Returns `BAD_REQUEST` if user ID is missing.
 * - Returns `FAILED` for unexpected server or runtime errors.
 *
 * @param {Request} req - Express request object containing user headers.
 * @param {Response} res - Express response object for sending the result.
 * @returns {Promise<void>} - Sends JSON response and resolves.
 */
async function fetchCasePriority (req : Request, res : Response) {
  const methodName = "fetchCasePriority"
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    const result = await caseTaskService.getCasePriortyList();
    if(result.length > 0) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.casePriorityListedSuccess,
        data : result
      });
    } else {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.dataNotAvailable,
        data : []
      });
    }

  }
  catch (error: any) {
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

export default {
  createTask,
  updateTask,
  fetchCaseTaskList,
  createOrMapTags,
  fetchAllTags,
  addCommentsToSpecificTask,
  exportCaseTask,
  updateTaskComments,
  deleteTaskComments,
  fetchTaskCommentsList,
  addTaskAttachments,
  deleteTaskAttachments,
  listTaskAttachments,
  fetchTaskActivity,
  fetchTaskDetails,
  fetchCaseTaskStatus,
  fetchCasePriority,
  addCollaborators,
  listCollaborators,
  linkTask,
  linkDeleteTask,
  deleteTagsTaskLevel,
  deleteCollaboratorsTaskLevel,
  updateChecklistItemStatus,
  caseLevelTaskDropdown,
};