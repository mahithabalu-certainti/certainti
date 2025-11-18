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
  casesFieldMappings,
  casesSummaryFieldMappings,
  checklistsFieldMappings,
  HttpStatus,
  reviewProjectsFieldMappings,
  STATUS_MESSAGE,
} from "../utils/constants";
import {
  checklistByIdSchema,
  checklistSchema,
  createActivitTaskSchema,
  createCaseSchema,
  createCaseTeamSchema,
  createTaskSchema,
  exportCasesAccountSchema,
  exportCaseSummarySchema,
  exportCheckListSchema,
  exportReviewProjectSchema,
  listActivityTaskSchema,
  listCasesAccountSchema,
  listCaseSummarySchema,
  listCaseTeamSchema,
  listCheckListSchema,
  listReviewProjectSchema,
  updateCaseSchema,
  updateChecklistSchema,
  updateTaskSchema,
} from "../lib/joi/schemas/schema";
import configurations from "../config/config";
import moment from "moment";

const services = configurations.getInstance().getServices();
const caseService = services.caseService;
const caseManagementService = services.caseManagementService;
const activityService = services.activityService;

async function createActivityTask (req : Request, res : Response) {
  const methodName = "Create Task";
  try {
  const value = await validateRequest(req, createActivitTaskSchema, res, "POST");
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
    const result = await activityService.createActivityTask(data,userId);
     if (result.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleCustomResponse(res, result.data, result.message);
      return;
    } else {
      errorLog(methodName, result.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        result.errorMessage
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

async function updateActivityTask (req : Request, res : Response) {
  const methodName = "Update Task";
  try {
  const value = await validateRequest(req, createActivitTaskSchema, res, "POST");
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
    const result = await activityService.createActivityTask(data,userId);
     if (result.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleCustomResponse(res, result.data, result.message);
      return;
    } else {
      errorLog(methodName, result.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        result.errorMessage
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


async function getAllActivityTask (req : Request, res : Response) {
  const methodName = "Create Task";
  try {
  const value = await validateRequest(req, listActivityTaskSchema, res, "GET");
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
    const result = await activityService.getAllActivities(userId,value.attachmentLevel,value.entityId,value.accountRid,value.page,value.limit,value.search,value.filters,value.sortBy,value.sortOrder,value.fiscalYear,"list", {});
     if (result.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleCustomResponse(res, result.data, result.message);
      return;
    } else {
      errorLog(methodName, result.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        result.errorMessage
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
  createActivityTask,
  updateActivityTask,
  getAllActivityTask
};