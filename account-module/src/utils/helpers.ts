import Joi from "joi";
import { Request, Response } from "express";
import { HttpStatus } from "./constant";
import { errorResponse } from "./apiResponse";
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
