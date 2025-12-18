import { Request, Response } from "express";
import {
  errorLog,
  generateExcelBase64,
  handleErrorResponse,
  handleSuccessResponse,
  logMessage,
  successLog,
  validateRequest,
} from "../utils/helpers";
import { HttpStatus, STATUS_MESSAGE } from "../utils/constants";
import configurations from "../config/config";
import {
  exportListProjectTasksSchema,
  listProjectTasksSchema,
  projectTaskByIdSchema,
} from "../lib/joi/schemas/schema";

const services = configurations.getInstance().getServices();
const projectTaskService = services.projectTaskInjestionServices;

/**
 * Retrieves a list of case project tasks based on provided filters, pagination, and sorting.
 * 
 * Validates the request and user ID from headers, parses filters if necessary,
 * then fetches and returns the list of case project tasks or error responses accordingly.
 * 
 * @param {Request} req - Express request object containing query parameters and headers.
 * @param {Response} res - Express response object for sending responses.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 */
async function getProjectTasks(req: Request, res: Response): Promise<void> {
  const methodName = "getProjectTasks";
  try {
    const value = await validateRequest(
      req,
      listProjectTasksSchema,
      res,
      "GET"
    );
    if (!value) {
      return;
    }
    const userId = req.headers["x-user-id"] as string;
    logMessage("Request received for getProjectTasks: " + JSON.stringify(value) + " and userId: " + userId);

    if (!userId) {
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User id is required"
      );
      return;
    }

    // Before calling buildRawWhereClause
    if (typeof value.filters === "string") {
      try {
        value.filters = JSON.parse(value.filters);
      } catch (err) {
        errorLog(methodName, "Invalid filters JSON: " + (err as Error).message);
        value.filters = {};
      }
    }
    const tasks = await projectTaskService.listProjectTasks(
      value.accountRid,
      value.caseRid,
      value.filters,
      value.search,
      value.page,
      value.limit,
      value.sortBy,
      value.sortOrder
    );

    if (tasks.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, tasks.data);
      return;
    } else {
      errorLog(methodName, tasks.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        tasks.errorMessage
      );
      return;
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
 * Retrieves a case project task by its ID.
 * 
 * Validates request and user ID, fetches task details from the service,
 * and responds with the task data or error messages.
 * 
 * @param {Request} req - Express request object containing task ID and headers.
 * @param {Response} res - Express response object for sending responses.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 */
async function getProjectTaskById(req: Request, res: Response): Promise<void> {
  const methodName = "getProjectTaskById";
  try {
    const value = await validateRequest(req, projectTaskByIdSchema, res, "GET");
    if (!value) {
      return;
    }
    logMessage("Request received for getProjectTaskById: " + JSON.stringify(value));  
    const userId = req.headers["x-user-id"] as string;

    if (!userId) {
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User id is required"
      );
      return;
    }

    const task = await projectTaskService.getProjectTaskById(
      value.accountRid,
      value.taskRid
    );

    if (task.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, task.data);
      return;
    } else {
      errorLog(methodName, task.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        task.errorMessage
      );
      return;
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
 * Exports all case project tasks matching the given filters and search parameters.
 * 
 * Validates request and user ID, parses filters if needed, calls export service,
 * and returns an Excel file in base64 format or error response.
 * 
 * @param {Request} req - Express request object containing export parameters and headers.
 * @param {Response} res - Express response object for sending responses.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 */
async function exportAllProjectTasks(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "exportAllProjectTasks";
  try {
    const value = await validateRequest(
      req,
      exportListProjectTasksSchema,
      res,
      "GET"
    );
    if (!value) {
      return;
    }
    const userId = req.headers["x-user-id"] as string;
    logMessage("Request received for exportAllProjectTasks: " + JSON.stringify(value) + " and userId: " + userId);

    if (!userId) {
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User id is required"
      );
      return;
    }

    // Before calling buildRawWhereClause
    if (typeof value.filters === "string") {
      try {
        value.filters = JSON.parse(value.filters);
      } catch (err) {
        errorLog(methodName, "Invalid filters JSON: " + (err as Error).message);
        value.filters = {};
      }
    }
    const tasks = await projectTaskService.listProjectTasksExport(
      userId,
      value.accountRid,
      value.caseRid,
      value.filters,
      value.search,
      value.sortBy,
      value.sortOrder
    );

    if (tasks.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(
        res,
        await generateExcelBase64(tasks?.data?.tasks, "All Case Project Tasks")
      );
      return;
    } else {
      errorLog(methodName, tasks.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        tasks.errorMessage
      );
      return;
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


export default {
  getProjectTasks,
  getProjectTaskById,
  exportAllProjectTasks,
};