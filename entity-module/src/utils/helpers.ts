import Joi from "joi";
import { Request, Response } from "express";
import { HttpStatus } from "./constants";
import { errorResponse,successResponse } from "./apiResponse";
import configurations from "../config/config";

const logger = configurations.getInstance().getLogger();

export async function validateRequest(
  req: Request,
  schema: Joi.Schema,
  res: Response,
  type?: "GET" | "POST" | "PUT" | "DELETE",
  organization?: string,
): Promise<any> {
  const requestValidationType = type === "GET" ? req.query : req.body;
  const { error, value } = schema.validate(requestValidationType, {
    abortEarly: false,
  });
  if (error) {
    const errorMessages = requestErrorMessages(error);
    logger.error("Validation failed:", {
      timestamp: new Date().toISOString(),
      method: "API method",
      message: "Request validation failed",
    });
    errorResponse(
      res,
      HttpStatus.BAD_REQUEST,
      HttpStatus.BAD_REQUEST_MESSAGE,
      errorMessages
    );
    return;
  }

  return value;
}

export function requestErrorMessages(error: any): Record<string, string> {
  return error.details.reduce((acc: Record<string, string>, err: any) => {
    const field = err.path.join(".");
    acc[field] = err.message.replace(/"/g, "");
    return acc;
  }, {});
}


export function successLog(methodName: string): void {
  logger.info(`Successfully retrieved ${methodName} data `, {
    timestamp: new Date().toISOString(),
    method: methodName,
  });
}

export function errorLog(methodName: string, errorMessage?: string): void {
  logger.error("Failed log: ", {
    timestamp: new Date().toISOString(),
    method: methodName,
    message: errorMessage,
  });
}

export function handleSuccessResponse(
  res: Response,
  data: any
) {
  return successResponse(res, HttpStatus.SUCCESS, HttpStatus.SUCCESS_MESSAGE, data);
}

export function handleErrorResponse(
  res: Response,
  statusCode: number,
  statusCodeValue: string,
  message?: string
): void {
  errorResponse(res, statusCode, statusCodeValue, message);
}