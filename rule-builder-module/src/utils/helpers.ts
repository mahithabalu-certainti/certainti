import { Request, Response } from "express";
import { errorResponse, successResponse } from "./apiResponse";
import configurations from "../config/config";
import { HttpStatus } from "./constants";

import { Sequelize } from "sequelize";
import crypto from "crypto";

function getLogger() {
  return configurations.getInstance().getLogger();
}

export function successLog(methodName: string): void {
   getLogger().info(`Successfully retrieved ${methodName} data `, {
    timestamp: new Date().toISOString(),
    method: methodName,
  });
}

export function logMessage(message: string): void {
  getLogger().info(`${message}`);
}

export function errorLog(methodName: string, errorMessage?: string): void {
  getLogger().error("Failed log: ", {
    timestamp: new Date().toISOString(),
    method: methodName,
    message: errorMessage,
  });
}

export function handleSuccessResponse(res: Response, data: any) {
  return successResponse(
    res,
    HttpStatus.SUCCESS,
    HttpStatus.SUCCESS_MESSAGE,
    data,
    HttpStatus.SUCCESS_NOTIFICATION
  );
}

export function handleErrorResponse(
  res: Response,
  statusCode: number,
  statusCodeValue: string,
  message?: string
): void {
  errorResponse(res, statusCode, statusCodeValue, message);
}