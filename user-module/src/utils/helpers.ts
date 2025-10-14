import Joi from "joi";
import { Request, Response } from "express";
import { constants } from "./constant";
import { errorResponse, successResponse } from "./apiResponse";
import configurations from "../config/config";
import ExcelJS from 'exceljs';
import moment from "moment";
import crypto from 'crypto';
import { getSecret } from "./azureSecrets";

function getLogger() {
  return configurations.getInstance().getLogger();
}
/**
 * Validates the incoming request data against a Joi schema.
 * 
 * This function validates the data from the request (either query parameters or request body) 
 * against the provided Joi schema. If validation fails, it logs the error and sends a 
 * response with the validation error messages. If the validation passes, it returns the validated data.
 * 
 * @param {Request} req - The Express request object containing the request data (query parameters or body).
 * @param {Joi.Schema} schema - The Joi schema used to validate the request data.
 * @param {string} organization - The organization identifier, used for potential context but not utilized directly in this function.
 * @param {Response} res - The Express response object used to send back the validation errors.
 * @param {("GET" | "POST" | "PUT" | "DELETE") [type] - The HTTP method type, used to determine whether to validate the query or body. Default is undefined, so both query and body can be validated based on the method.
* 
* @returns {Promise<any>} - Returns a promise that resolves with the validated data if validation is successful.
* 
* @throws {void} - If validation fails, the function will send a response with validation errors and not proceed further.
*/
export async function validateRequest(
  req: Request,
  schema: Joi.Schema,
  organization: string,
  res: Response,
  type?: "GET" | "POST" | "PUT" | "DELETE"
): Promise<any> {
  const requestValidationType = type === "GET" ? req.query : req.body; 
  const { error, value } = schema.validate(requestValidationType, { abortEarly: false });
  if (error) {
    const errorMessages = requestErrorMessages(error);
    getLogger().error("Validation failed:", {
      timestamp: new Date().toISOString(),
      method: "API method",
      message: "Request validation failed",
    });
    errorResponse(
      res,
      constants.BAD_REQUEST,
      constants.BAD_REQUEST_MESSAGE,
      errorMessages
    );
    return;
  }

  return value;
}

/**
 * Extracts and formats the validation error messages from a Joi validation error object.
 * 
 * This function processes the error details from a Joi validation error and creates a 
 * user-friendly error message object where the keys are the field names and the values 
 * are the corresponding error messages.
 * 
 * @param {any} error - The Joi validation error object, which contains details of the validation failures.
 * 
 * @returns {Record<string, string>} - A record where the keys are field names (e.g., "fieldName") 
 * and the values are the respective validation error messages (e.g., "fieldName is required").
 */
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

export function errorLog(methodName: string, errorMessage?: string): void {
  getLogger().error("Failed log: ", {
    timestamp: new Date().toISOString(),
    method: methodName,
    message: errorMessage,
  });
}

export function handleSuccessResponse(
  res: Response,
  data: any
) {
  return successResponse(res, constants.SUCCESS, constants.SUCCESS_MESSAGE, data);
}

export function handleCustomResponse(
  res: Response,
  data: any,
  requiresConfirmation?:boolean
) {
  return successResponse(res, constants.CONFLICT,'CONFIRMATION_POPUP', {requiresConfirmation},data);
}

export function handleCustomMessage(
  res: Response,
  statusCode: number,
  message: string,
  data?: any
) {
  return successResponse(res, statusCode, message, data, message);
}

export function handleErrorResponse(
  res: Response,
  statusCode: number,
  statusCodeValue: string,
  message?: any
): void {
  errorResponse(res, statusCode, statusCodeValue, message);
}

export async function generateExcelBase64(
  data: any,
  sheetName: string
) {
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
  //await workbook.xlsx.writeFile('Profile_Permissions.xlsx');
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer).toString('base64');
}

export  function isValidTimezone(tz: string) {
  return moment.tz.names().includes(tz);
}

export async function encryptClientSecret(text: string): Promise<string> {
  const encryptClientSecret = await getSecret(process.env.CLIENT_SECRET_ENCRYPTION_KEY!);

  if(!encryptClientSecret){
    throw new Error("Invalid Client Encryption Key")
  }

  const ENCRYPTION_KEY = encryptClientSecret;
  const IV_LENGTH = parseInt(process.env.CLIENT_SECRET_ENCRYPTION_LENGTH || '16', 10);

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);

  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export async function decryptClientSecret(encryptedText: string): Promise<string> {
  const ENCRYPTION_KEY = process.env.CLIENT_SECRET_ENCRYPTION_KEY;
  
  if (!ENCRYPTION_KEY) {
    throw new Error('CLIENT_SECRET_ENCRYPTION_KEY is not set in environment');
  };

  const encryptClientSecret = await getSecret(ENCRYPTION_KEY);

  if(!encryptClientSecret){
    throw new Error("Invalid Client Encryption Key")
  }

  const [ivHex, encryptedHex] = encryptedText.split(":");

  if (!ivHex || !encryptedHex) {
    throw new Error('Invalid encrypted text format. Expected format "iv:encrypted"');
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
