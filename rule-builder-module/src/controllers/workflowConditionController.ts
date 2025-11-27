import { Request, Response } from "express";
import { HttpStatus } from "../utils/constants";
import {
  errorLog,
  successLog,
  handleErrorResponse,
  handleSuccessResponse,
  handleCustomResponse,
  validateRequest
} from "../utils/helpers";
import {
  listConditionSchema,
  createConditionSchema,
  updateConditionSchema
} from "../lib/joi/schemas/schema";
import configurations from "../config/config";

const services = configurations.getInstance().getServices();
const ConditionService = services.conditionService;

async function createCondition(req: Request, res: Response): Promise<void> {
  const methodName = "create condition";
  try {
    const userId = req.headers["x-user-id"] as string;
    const value = await validateRequest(req, createConditionSchema, res, "POST");
    if (!value) {
      errorLog(methodName, "Request body is empty");
      return;
    }
    const newCondition = await ConditionService.createCondition(value, userId);
    if (newCondition.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, newCondition);
      return;
    } {
      errorLog(methodName, newCondition.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        newCondition.errorMessage
      );
      return;
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
};

async function listAllConditions(req: Request, res: Response): Promise<void> {
  const methodName = "condition details";
  try {
    const userId = req.headers["x-user-id"] as string;
    const value = await validateRequest(req, listConditionSchema, res, "GET");
    if (!value) {
      return;
    }
    let parsedFilters: Record<string, any> = {};
    try {
      if (value.filters) {
        parsedFilters = JSON.parse(value.filters);
      }
    } catch (error) {
      errorLog(
        methodName,
        "Invalid filters format. Must be a valid JSON object."
      );
    }
    // if (!userId) {
    //   return;
    // }
    const result = await ConditionService.listConditions(
      value,
      parsedFilters,
      userId,
      "list");
    if (result.statusCode == HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, result);
      return;
    } else {
      errorLog(methodName, "No data found");
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
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
};

async function updateCondition(req: Request, res: Response): Promise<void> {
  const methodName = "update condition";
  try {
    const value = await validateRequest(req, updateConditionSchema, res);
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      // errorLog(methodName, "User ID is required in headers");
      // handleErrorResponse(
      //   res,
      //   HttpStatus.BAD_REQUEST,
      //   HttpStatus.BAD_REQUEST_MESSAGE,
      //   "User ID is required in headers"
      // );
      // return;
    }
    if (!value) {
      errorLog(methodName, "Request body is empty");
      return;
    }
    const response = await ConditionService.updateCondition(value, req.body);
    if (response.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleCustomResponse(res, response.data, response.message);
      return;
    } else {
      errorLog(methodName, response.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        response.errorMessage
      );
      return;
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
};

async function deleteCondition(req: Request, res: Response): Promise<any> {
  const methodName = "delete condition";
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      // errorLog(methodName, "User ID is required in headers");
      // handleErrorResponse(
      //   res,
      //   HttpStatus.BAD_REQUEST,
      //   HttpStatus.BAD_REQUEST_MESSAGE,
      //   "User ID is required in headers"
      // );
      // return;
    }
    const data = req.body;
    const result = await ConditionService.deleteCondition(data, userId);
    if (result.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).send({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.statusMessage,
      });
    } else if (result.statusCode === HttpStatus.NOT_FOUND) {
      return res.status(HttpStatus.SUCCESS).send({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.statusMessage,
      });
    } else {
      return res.status(HttpStatus.FAILED).send({
        statusCode: HttpStatus.FAILED,
        statusCodeValue: HttpStatus.FAILED_MESSAGE,
        statusMessage: result.statusMessage,
      });
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
};

export default {
  createCondition,
  listAllConditions,
  updateCondition,
  deleteCondition
};