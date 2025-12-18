import { Request, Response } from "express";
import { errorResponse, successResponse } from "./apiResponse";
import configurations from "../config/config";
import { HttpStatus } from "./constants";
import Joi from "joi";

import { Sequelize } from "sequelize";
import crypto from "crypto";
import { getSecret } from "./azureSecrets";

function getLogger() {
  return configurations.getInstance().getLogger();
}

export async function validateRequest(
  req: Request,
  schema: Joi.Schema,
  res: Response,
  type?: "GET" | "POST" | "PUT" | "DELETE",
  organization?: string,
): Promise<any> {
  const isMultipart = req.headers["content-type"]?.includes("multipart/form-data");
  let requestValidationData: any;
  if (type === "GET") {
    requestValidationData = req.query;
  } else {
    requestValidationData = isMultipart ? { ...req.body } : req.body;
    // 🟡 If `data` is a JSON string in multipart/form-data, parse it
    if (isMultipart) {
      const rawData = requestValidationData.data;
      if (rawData === undefined) {
        return errorResponse(
          res,
          HttpStatus.BAD_REQUEST,
          HttpStatus.BAD_REQUEST_MESSAGE,
          ["Missing 'data' field"]
        );
      }
      if (typeof rawData === "string") {
        if (rawData.trim() === "") {
          return errorResponse(
            res,
            HttpStatus.BAD_REQUEST,
            HttpStatus.BAD_REQUEST_MESSAGE,
            ["'data' field is empty"]
          );
        }
      }
      try {
        requestValidationData.data = JSON.parse(rawData);
      }
      catch (e) {
        return errorResponse(
          res,
          HttpStatus.BAD_REQUEST,
          HttpStatus.BAD_REQUEST_MESSAGE,
          ["Invalid JSON in 'data' field"]
        );
      }
    }
  }
  const dataToValidate = isMultipart ? requestValidationData?.data : requestValidationData;
  const { error, value } = schema.validate(dataToValidate, {
    abortEarly: false,
  });
  if (error) {
    const errorMessages = requestErrorMessages(error);
    getLogger().error("Validation failed:", {
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

export function handleCustomResponse(
  res: Response,
  data: any,
  message: string
) {
  return successResponse(
    res,
    HttpStatus.SUCCESS,
    HttpStatus.SUCCESS_MESSAGE,
    data,
    message
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

export async function decryptClientSecret(
  encryptedText: string
): Promise<string> {
  const ENCRYPTION_KEY = process.env.CLIENT_SECRET_ENCRYPTION_KEY;

  if (!ENCRYPTION_KEY) {
    throw new Error("CLIENT_SECRET_ENCRYPTION_KEY is not set in environment");
  }

  const encryptClientSecret = await getSecret(ENCRYPTION_KEY);

  if (!encryptClientSecret) {
    throw new Error("Invalid Client Encryption Key");
  }

  const [ivHex, encryptedHex] = encryptedText.split(":");

  if (!ivHex || !encryptedHex) {
    throw new Error(
      'Invalid encrypted text format. Expected format "iv:encrypted"'
    );
  }

  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");

  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(encryptClientSecret),
    iv
  );
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
}