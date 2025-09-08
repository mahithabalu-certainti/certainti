import Joi from "joi";
import { Request, Response } from "express";
import { errorResponse, successResponse } from "./apiResponse";
import { HttpStatus } from "./constants";
import configurations from "../config/config";
import ExcelJS from 'exceljs'
import { getSecret } from "./azureSecrets";
import { BlobServiceClient } from "@azure/storage-blob";
import moment from "moment";

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

export function handleSuccessResponse(res: Response, data: any) {
  return successResponse(
    res,
    HttpStatus.SUCCESS,
    HttpStatus.SUCCESS_MESSAGE,
    data,
    HttpStatus.SUCCESS_NOTIFICATION
  );
}

export function handleCustomResponse(res: Response, data: any,message:string) {
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

export async function generateExcelBase64(
  data: any,
  sheetName: string
) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);
  
  // Get headers from the first object in data
  const headers = Object.keys(data[0] || {});
  worksheet.addRow(headers);

  // Add data rows with hyperlink and style support
  data.forEach((row: any) => {
    const rowValues = headers.map((header) => row[header]);
    const excelRow = worksheet.addRow(rowValues);
    rowValues.forEach((cellValue, colIdx) => {
      const cell = excelRow.getCell(colIdx + 1);
      if (cellValue && typeof cellValue === 'object' && cellValue.hyperlink && cellValue.text) {
        cell.value = { text: cellValue.text, hyperlink: cellValue.hyperlink };
        cell.font = {
          color: { argb: cellValue.style?.fontColor || '0000FF' }
        };
      }
    });
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer).toString('base64');
}

export async function uploadToAzureBlob
(file: Express.Multer.File,account_id:string,project_id:string,interaction_id:string):Promise<{
  url: string;
  name: string;
  extension: string;
  size: number;
}> {
  const connectionString =  await getSecret(process.env.AZURE_STORAGE_CONNECTION_STRING as string);
  const containerName = 'account';
  
  const connString =  connectionString;
  if (!connString) throw new Error('Azure storage connection string is required');
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);
  await containerClient.createIfNotExists();
  const blobName = `${account_id}/${project_id}/${interaction_id}/attachements/${file.originalname}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.uploadData(file.buffer, {
    blobHTTPHeaders: { blobContentType: file.mimetype }
  });
  const sizeInMB = parseFloat((file.size / (1024 * 1024)).toFixed(2));
  const originalExtension = file.originalname.includes('.') 
      ? file.originalname.substring(file.originalname.lastIndexOf('.'))
      : '';
  const baseName = file.originalname.replace(/\.[^/.]+$/, ""); // Remove extension
  const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9\-_]/g, ''); // More strict sanitization
    

   return {
      url: blockBlobClient.url,
      name: sanitizedBaseName,
      extension: originalExtension,
      size: sizeInMB
    };
}

export async function deleteFromAzureBlob(blobUrl: string): Promise<void> {
  if (!blobUrl) return;

  const connectionString = await getSecret(process.env.AZURE_STORAGE_CONNECTION_STRING as string);
  const containerName = 'account';

  const url = new URL(blobUrl);
  const blobName = decodeURIComponent(url.pathname.split('/').slice(2).join('/')); 
  // slice(2) skips the container and empty slash
  if (!connectionString) {
    throw new Error('Azure storage connection string is required');
  }
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  const exists = await blockBlobClient.exists();
  if (exists) {
    await blockBlobClient.delete();
    console.log(`Blob deleted: ${blobName}`);
  } else {
    console.log(`Blob not found: ${blobName}`);
  }
}

export  function isValidTimezone(tz: string) {
  return moment.tz.names().includes(tz);
}

export function formatToLocalTime(isoString: string): string {
  const date = new Date(isoString);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  const time = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return `${year}-${month}-${day}, ${time}`;
}


