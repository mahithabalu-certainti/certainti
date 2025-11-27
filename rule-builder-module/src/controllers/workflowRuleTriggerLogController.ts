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
  createTriggerLogSchema
} from "../lib/joi/schemas/schema";
import configurations from "../config/config";

const services = configurations.getInstance().getServices();
const TriggerLogService = services.triggerService;

async function createTriggerLog(req: Request, res: Response): Promise<void> {
  const methodName = "create trigger";
  try {
    const userId = req.headers["x-user-id"] as string;
    const value = await validateRequest(req, createTriggerLogSchema, res, "POST");
    if (!value) {
      errorLog(methodName, "Request body is empty");
      return;
    }
    const newLog = await TriggerLogService.createTriggerLog(value, userId);
    if (newLog.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, newLog);
      return;
    } {
      errorLog(methodName, newLog.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        newLog.errorMessage
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

export default {
  createTriggerLog
}