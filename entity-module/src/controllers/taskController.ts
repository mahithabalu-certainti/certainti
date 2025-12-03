import { Request, Response } from "express";
import { HttpStatus, STATUS_MESSAGE } from "../utils/constants";
import {
  errorLog,
  generateExcelBase64,
  handleErrorResponse,
  handleSuccessResponse,
  logMessage,
  successLog,
  validateRequest,
} from "../utils/helpers";
import configurations from "../config/config";
import {
  exportListTaskSummarySchema,
  listTaskSummarySchema,
  listTaskByIdSchema,
  updateTaskSchema,
} from "../lib/joi/schemas/schema";


const services = configurations.getInstance().getServices();
const taskService = services.taskService;


async function getAllTaskSummary(req: Request, res: Response): Promise<void> {
  const methodName = "getAllTaskSummary";
  try {

    const value = await validateRequest(req, listTaskSummarySchema, res, "GET");
    if (!value) {
      return;
    }
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

    // Before calling buildRawWhereClause
    if (typeof value.filters === 'string') {
      try {
        value.filters = JSON.parse(value.filters);
      } catch (err) {
        console.error('Invalid filters JSON:', value.filters);
        value.filters = {};
      }
    }
    const attachments = await taskService.getTaskSummary(userId, value.page, value.limit, value.search, value.filters, value.globalFilters, value.sortBy, value.sortOrder, value.fiscalYear);

    if (attachments.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, attachments.data);
      return;
    } else {
      errorLog(methodName, attachments.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        attachments.errorMessage
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

async function exportAllTaskSummary(req: Request, res: Response): Promise<void> {
  const methodName = "exportAllNotesSummary";
  try {

    const value = await validateRequest(req, exportListTaskSummarySchema, res, "GET");
    if (!value) {
      return;
    }
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

    // Before calling buildRawWhereClause
    if (typeof value.filters === 'string') {
      try {
        value.filters = JSON.parse(value.filters);
      } catch (err) {
        console.error('Invalid filters JSON:', value.filters);
        value.filters = {};
      }
    }
    const attachments = await taskService.exportTaskSummary(userId, value.search, value.filters, value.globalFilters, value.sortBy, value.sortOrder, value.fiscalYear, value.timezone);

    if (attachments.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, await generateExcelBase64(attachments?.data?.tasks, "All Attachments Summary"));
      return;
    } else {
      errorLog(methodName, attachments.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        attachments.errorMessage
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

async function fetchTaskDetailsById(req: Request, res: Response): Promise<any> {
  const methodName = "fetchNotesDetailsById"
  try {
    const value = await validateRequest(req, listTaskByIdSchema, res, "GET");
    if (!value) {
      return;
    }
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
    value.user_rid = userId

    const result = await taskService.getTaskDetailsById(value)
    if (result.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.statusMessage,
        data: result.data
      })
    } else {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.statusMessage,
        data: result.data
      })
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
  getAllTaskSummary,
  exportAllTaskSummary,
  fetchTaskDetailsById
};
