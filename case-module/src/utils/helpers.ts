import Joi from "joi";
import { Request, Response } from "express";
import { errorResponse, successResponse } from "./apiResponse";
import { HttpStatus } from "./constants";
import configurations from "../config/config";
import ExcelJS from 'exceljs'
import { getSecret } from "./azureSecrets";
import crypto from "crypto";
import moment from "moment-timezone";

function getLogger() {
  return configurations.getInstance().getLogger();
}

export async function validateRequest(
  req: Request,
  schema: Joi.Schema,
  res: Response,
  type?: "GET" | "POST" | "PUT" | "DELETE",
  organization?: string
): Promise<any> {
  const requestValidationType = type === "GET" ? req.query : req.body;
  const { error, value } = schema.validate(requestValidationType, {
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

export function requestErrorMessages(
  error: any
): Record<string, string> | string {
  const errors = error.details.map((err: any) => {
    const field = err.path.length ? err.path.join(".") : null;
    const message = err.message.replace(/"/g, "");
    return field ? { [field]: message } : message;
  });

  // If only one message and it's a string (object-level), return it directly
  if (errors.length === 1 && typeof errors[0] === "string") {
    return errors[0];
  }

  // Merge all object field errors
  return errors.reduce(
    (acc: Record<string, string>, curr: Record<string, string> | string) => {
      if (typeof curr === "string") {
        acc["message"] = curr;
      } else {
        Object.assign(acc, curr);
      }
      return acc;
    },
    {} as Record<string, string>
  );
}

export function successLog(methodName: string): void {
  getLogger().info(`Successfully retrieved ${methodName} data `, {
    timestamp: new Date().toISOString(),
    method: methodName,
  });
}

export function errorLog(methodName: string, errorMessage?: string): void {
  getLogger().error("Failed log: ", {
    timestamp: new Date().toISOString(),
    method: methodName,
    message: errorMessage,
  });
}

export function logMessage(message: string): void {
  getLogger().info(`${message}`);
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

export function handlePromptResponse(
  res: Response,
  statusCode: number,
  statusMessage: string,
  data: any
): void {
  res.status(statusCode).json({
    statusCode: statusCode,
    statusCodeValue: HttpStatus.PROMPT_MESSAGE,
    statusMessage: statusMessage,
    data: data,
  });
}

export async function generateExcelBase64(data: any, sheetName: string) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // Get headers from the first object in data
  const headers = Object.keys(data[0] || {});
  worksheet.addRow(headers);

  // Add data rows
  data.forEach((row: any) => {
    worksheet.addRow(Object.values(row));
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
 // await workbook.xlsx.writeFile('cases.xlsx');
  return Buffer.from(buffer).toString("base64");
}

export function isValidTimezone(tz: string) {
  return moment.tz.names().includes(tz);
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
