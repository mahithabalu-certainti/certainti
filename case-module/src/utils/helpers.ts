import Joi from "joi";
import { Request, Response } from "express";
import { errorResponse, successResponse } from "./apiResponse";
import { ALPHANUMERIC_CONDITIONS, HttpStatus, STATUS_MESSAGE } from "./constants";
import configurations from "../config/config";
import ExcelJS from 'exceljs'
import { getSecret } from "./azureSecrets";
import crypto from "crypto";
import moment from "moment-timezone";
import { CreateTaskTemplateType, UpdateCaseTaskType, UpdateCommentsType, UpdateTaskTemplateType } from "./types";
import { TaskTemplate } from "../models/caseTaskTemplateModel";
import { CaseTask } from "../models/caseTaskModel";
import { TaskComments } from "../models/taskCommentsModel";
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  SASProtocol
} from "@azure/storage-blob";
import { parse } from "url";
import { CaseProjectTask } from "../models/caseProjectTaskModel";

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
  // const requestValidationType = type === "GET" ? req.query : req.body;
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

/**
 * Generates a base64-encoded Excel file from structured data, highlighting empty cells.
 * @param {Array<Record<string, any>>} data - Array of objects representing rows.
 * @param {string} sheetName - Name of the worksheet.
 * @returns {Promise<string>} - Base64 string of the Excel file.
 */
export async function generateExcelBase64WithEmptyCheck(data: Array<Record<string, any>>, sheetName: string): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  if (!data || data.length === 0 || !data[0]) {
    worksheet.addRow(['No data available']);
  } else {
    // Add header row
    const header = Object.keys(data[0] ?? {});
    const headerRow = worksheet.addRow(header);
    headerRow.eachCell((cell) => {
      cell.alignment = { wrapText: true };
    });

    // Auto-adjust column widths based on header and data
    worksheet.columns = header.map((h, i) => {
      // Find max length in column (header or any data row)
      const maxDataLength = Math.max(
        h.length,
        ...data.map(rowObj => {
          const v = rowObj[h];
          return (v === null || v === undefined) ? 0 : String(v).length;
        })
      );
      // Minimum width 12, max 50
      return {
        key: h,
        width: Math.min(Math.max(maxDataLength + 2, 12), 50)
      };
    });

    // Add data rows
    data.forEach(rowObj => {
      const rowValues = header.map(h => {
        // Treat null, undefined, or empty string as empty
        const v = rowObj[h];
        return v === null || v === undefined || v === '' ? '' : v;
      });
      const row = worksheet.addRow(rowValues);
      row.eachCell((cell, colNumber) => {
        // Enable text wrapping for all cells
        cell.alignment = { wrapText: true };
        // Highlight if value is null, empty string, or 0
        if (cell.value === '' || cell.value === null || cell.value === 0) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFC7CE' } // Light red fill for empty/null/zero cells
          };
        }
      });
    });
  }

  // Generate buffer and encode to base64
  const buffer = await workbook.xlsx.writeBuffer();
  //  await workbook.xlsx.writeFile('cases1.xlsx');
  return Buffer.from(buffer).toString('base64');
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

// Optimized utility function for handling numeric filter conditions
export const buildNumericFilterCondition = (
  condition: string,
  values: any,
  filteredColumns: string,
  tableAlias: string = "cs"
): string => {
  const columnRef = `${tableAlias}.${filteredColumns}`;

  // Use object mapping for better performance instead of switch
  const conditionMap: Record<string, (col: string, val: any) => string> = {
    [ALPHANUMERIC_CONDITIONS.equals]: (col, val) => `${col} = ${val}`,
    [ALPHANUMERIC_CONDITIONS.notEquals]: (col, val) => `${col} != ${val}`,
    [ALPHANUMERIC_CONDITIONS.greater_than]: (col, val) => `${col} > ${val}`,
    [ALPHANUMERIC_CONDITIONS.less_than]: (col, val) => `${col} < ${val}`,
    [ALPHANUMERIC_CONDITIONS.between]: (col, val) =>
      `${col} BETWEEN ${Array.isArray(val) ? val.join(" AND ") : val}`,
    [ALPHANUMERIC_CONDITIONS.isEmpty]: (col) => `(${col} IS NULL OR ${col} = 0)`,
    [ALPHANUMERIC_CONDITIONS.IN]: (col, val) =>
      `${col} IN (${Array.isArray(val) ? val.join(",") : val})`,
  };

  return conditionMap[condition]?.(columnRef, values) || "";
};

// Optimized utility function for handling string filter conditions
export const buildStringFilterCondition = (
  condition: string,
  values: any,
  filteredColumns: string,
  dynamicReference: string
): string => {
  // Optimize column reference determination
  const getColumnRef = (column: string, ref: string): string => {
    const columnMap: Record<string, string> = {
      created_user_name: "(uc.first_name || ' ' || uc.last_name)",
      modified_user_name: "(um.first_name || ' ' || um.last_name)",
      case_name: " CONCAT(a.account_name, '-', c.country_code, '-', cs.fiscal_year, '-', cs.case_name)",
      config_name: "CONCAT('C','-',c.country_code, '-', (CASE WHEN g.is_federal = false AND st.state_name IS NOT NULL AND st.state_name != '' THEN st.state_name || '-' ELSE '' END), jc.config_name)"
    };

    return columnMap[column] || (ref ? `${ref}.${column}` : column);

  };

  const columnRef = getColumnRef(filteredColumns, dynamicReference);

  // Use object mapping for conditions
  const conditionMap: Record<string, (col: string, val: any) => string> = {
    [ALPHANUMERIC_CONDITIONS.equals]: (col, val) =>
      `LOWER(${col}) = LOWER('${val}')`,
    [ALPHANUMERIC_CONDITIONS.notEquals]: (col, val) =>
      `(LOWER(${col}) != LOWER('${val}') OR ${col} IS NULL)`,
    [ALPHANUMERIC_CONDITIONS.isEmpty]: (col) => `(${col} IS NULL OR ${col} = '')`,
    [ALPHANUMERIC_CONDITIONS.contains]: (col, val) => `${col} ILIKE '%${val}%'`,
    [ALPHANUMERIC_CONDITIONS.IN]: (col, val) =>
      `${col} IN (${Array.isArray(val)
        ? val.map((d: any) => `'${d}'`).join(",")
        : `'${val}'`
      })`,
  };

  return conditionMap[condition]?.(columnRef, values) || "";
};

// Optimized utility function for handling datetime filter conditions
export const buildDatetimeFilterCondition = (
  condition: string,
  values: any,
  filteredColumns: string,
  tableAlias: string = "i"
): string => {
  const columnRef = `DATE(${tableAlias}.${filteredColumns})`;

  // Use object mapping for better performance
  const conditionMap: Record<string, (col: string, val: any) => string> = {
    [ALPHANUMERIC_CONDITIONS.equals]: (col, val) => `${col} = '${val}'`,
    [ALPHANUMERIC_CONDITIONS.before]: (col, val) => `${col} < '${val}'`,
    [ALPHANUMERIC_CONDITIONS.after]: (col, val) => `${col} > '${val}'`,
    [ALPHANUMERIC_CONDITIONS.between]: (col, val) =>
      `${col} BETWEEN ${Array.isArray(val)
        ? val.map((d: any) => `'${d}'`).join(" AND ")
        : `'${val}'`
      }`,
    [ALPHANUMERIC_CONDITIONS.isEmpty]: (col) => `${col} IS NULL`,
  };

  return conditionMap[condition]?.(columnRef, values) || "";
};

export const buildDatetimeFilterConditionTemplates = (
  condition: string,
  values: any,
  filteredColumns: string,
  tableAlias: string = 'i'
): string => {
  const columnRef = `DATE(${tableAlias}.${filteredColumns})`;

  switch (condition) {
    case ALPHANUMERIC_CONDITIONS.equals:
      return `${columnRef} = '${values}'`;
    case ALPHANUMERIC_CONDITIONS.before:
      return `${columnRef} < '${values}'`;
    case ALPHANUMERIC_CONDITIONS.after:
      return `${columnRef} > '${values}'`;
    case ALPHANUMERIC_CONDITIONS.between:
      // values should be an object: { from: string, to: string }
      if (values && typeof values === 'object' && values.from && values.to) {
        return `${columnRef} BETWEEN '${values.from}' AND '${values.to}'`;
      }
      return '';
    case ALPHANUMERIC_CONDITIONS.isEmpty:
      return `${columnRef} IS NULL`;
    default:
      return '';
  }
};

// Optimized utility function for handling boolean filter conditions
export const buildBooleanFilterCondition = (
  condition: string,
  values: any,
  filteredColumns: string,
  tableAlias: string = "cs"
): string => {
  const columnRef = `${tableAlias}.${filteredColumns}`;

  // Use object mapping for boolean conditions
  const conditionMap: Record<string, (col: string, val: any) => string> = {
    [ALPHANUMERIC_CONDITIONS.equals]: (col, val) => `${col} = ${val === true || val === 'true' ? 'true' : 'false'}`,
    [ALPHANUMERIC_CONDITIONS.notEquals]: (col, val) => `${col} != ${val === true || val === 'true' ? 'true' : 'false'}`,
    [ALPHANUMERIC_CONDITIONS.isEmpty]: (col) => `(${col} IS NULL)`,
    [ALPHANUMERIC_CONDITIONS.IN]: (col, val) => {
      if (Array.isArray(val)) {
        const boolVals = val.map(v => (v === true || v === 'true') ? 'true' : 'false').join(",");
        return `${col} IN (${boolVals})`;
      }
      return `${col} = ${(val === true || val === 'true') ? 'true' : 'false'}`;
    }
  };

  return conditionMap[condition]?.(columnRef, values) || "";
};
export const setTaskTemplateData = (dbData: TaskTemplate, reqData: any, userId: string) => {
  let validUpdateQuery: string[] = []
  let validUpdateConditions: string = ``
  if (reqData.task_name) {
    if (reqData.task_name !== dbData.task_name) {
      validUpdateConditions = `task_name = '${reqData.task_name.replace(/'/g, "''")}'`
      validUpdateQuery.push(validUpdateConditions)
    }
  }
  if (reqData.effort_in_days) {
    if (reqData.effort_in_days !== dbData.effort_in_days) {
      validUpdateConditions = `effort_in_days = ${reqData.effort_in_days}`
      validUpdateQuery.push(validUpdateConditions)
    }
  }
  if(reqData.case_team_member_role_rid) {
    if(reqData.case_team_member_role_rid !== dbData.case_team_member_role_rid) {
      validUpdateConditions = `case_team_member_role_rid = '${reqData.case_team_member_role_rid}'`
      validUpdateQuery.push(validUpdateConditions)
    }
  }
  if (reqData.checklist_template_rid) {
    if (reqData.checklist_template_rid !== dbData.checklist_template_rid) {
      validUpdateConditions = `checklist_template_rid = '${reqData.checklist_template_rid}'`
      validUpdateQuery.push(validUpdateConditions)
    }
  }
  if (reqData.priority_rid) {
    if (reqData.priority_rid !== dbData.priority_rid) {
      validUpdateConditions = `priority_rid = '${reqData.priority_rid}'`
      validUpdateQuery.push(validUpdateConditions)
    }
  }
  if (reqData.milestone_template_rid) {
    if (reqData.milestone_template_rid !== dbData.milestone_template_rid) {
      validUpdateConditions = `milestone_template_rid = '${reqData.milestone_template_rid}'`
      validUpdateQuery.push(validUpdateConditions)
    }
  }
  if(reqData.task_description != undefined) {
    if(reqData.task_description !== dbData.task_description) {
      validUpdateConditions = `task_description = '${reqData.task_description.replace(/'/g, "''")}'`
      validUpdateQuery.push(validUpdateConditions)
    }
  }
  if(reqData.task_category_rid) {
    if(reqData.task_category_rid !== dbData.task_category_rid) {
      validUpdateConditions = `task_category_rid = '${reqData.task_category_rid}'`
      validUpdateQuery.push(validUpdateConditions)
    }
  }
  if(reqData.weightage_rid) {
    if(reqData.weightage_rid !== dbData.weightage_rid) {
      validUpdateConditions = `weightage_rid = '${reqData.weightage_rid}'`
      validUpdateQuery.push(validUpdateConditions)
    }
  }
  if(reqData.status_rid) {
    if(reqData.status_rid !== dbData.status_rid) {
      validUpdateConditions = `status_rid = '${reqData.status_rid}'`
      validUpdateQuery.push(validUpdateConditions)
    }
  }
  if(validUpdateQuery.length > 0) {
    validUpdateConditions = `modified_by = '${userId}'`
    validUpdateQuery.push(validUpdateConditions)
    validUpdateConditions = `modified_datetime = NOW()`
    validUpdateQuery.push(validUpdateConditions)
  }
  return validUpdateQuery
}
export const getColumnsNamesForTaskUpdate = (data : UpdateCaseTaskType, dbData : CaseTask) => {
  let columns : string[] = [];
  if(data.checklist_template_rid !== '') {
    if(data.checklist_template_rid !== dbData.checklist_template_rid) {
      columns.push(`checklist_template_rid`)
    }
  }
  if (data.effective_end_datetime !== dbData.effective_end_datetime) {
    columns.push(`effective_end_datetime`);
  }
  if (data.effective_start_datetime !== dbData.effective_start_datetime) {
    columns.push(`effective_start_datetime`);
  }
  if (data.priority_rid !== '') {
    if (data.priority_rid !== dbData.priority_rid) {
      columns.push(`priority_rid`);
    }
  }
  if (data.task_description !== '') {
    if (data.task_description !== dbData.task_description) {
      columns.push(`task_description`);
    }
  }
  if (data.task_name !== '') {
    if (data.task_name !== dbData.task_name) {
      columns.push(`task_name`);
    }
  }
  if (data.task_status_rid !== '') {
    if (data.task_status_rid !== dbData.task_status_rid) {
      columns.push(`task_status_rid`);
    }
  }
  if (data.weightage_rid !== undefined) {
    if (data.weightage_rid !== dbData.weightage_rid) {
      columns.push(`weightage_rid`);
    }
  }
  if (data.task_category_rid !== undefined) {
    if (data.task_category_rid !== dbData.task_category_rid) {
      columns.push(`task_category_rid`);
    }
  }
  if (data.assigned_to !== '') {
    if (data.assigned_to !== dbData.assigned_to) {
      columns.push(`assigned_to`);
    }
  }
  return columns;
}

export async function uploadToAzureBlob(
  file: Express.Multer.File,
  account_id: string,
  task_number: string,
  account_number: string,
  flag?: string
): Promise<{
  url: string;
  name: string;
  extension: string;
  size: number;
}> {
  try {
    // Validate input
    if (!file) {
      throw new Error("File is required");
    }
    if (!account_id) {
      throw new Error("Account ID is required");
    }

    // Get connection string from secrets manager
    const connectionString = await getSecret(process.env.AZURE_STORAGE_CONNECTION_STRING as string);
    const containerName = account_number.toLowerCase();

    if (!connectionString) {
      throw new Error("Azure storage connection string is required");
    }

    // Create clients
    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Ensure container exists with public blob access
    await containerClient.createIfNotExists();

    // Sanitize filename and remove extension
    // Process filename
    const originalExtension = file.originalname.includes(".")
      ? file.originalname.substring(file.originalname.lastIndexOf("."))
      : "";
    const baseName = file.originalname.replace(/\.[^/.]+$/, ""); // Remove extension
    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9\-_]/g, ""); // More strict sanitization

    // Create unique blob name with timestamp
    let timestamp = Date.now();
    let blobName;
    if (flag === "cases") {
      blobName = `${account_id}/cases/${task_number}/${timestamp}-${sanitizedBaseName}${originalExtension}`;
    } else {
      blobName = `${account_id}/attachments/${timestamp}-${sanitizedBaseName}${originalExtension}`;
    }

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Upload file with content type
    const uploadOptions = {
      blobHTTPHeaders: {
        blobContentType: file.mimetype || "application/octet-stream",
      },
    };

    await blockBlobClient.uploadData(file.buffer, uploadOptions);

    // Get properties for additional metadata
    const properties = await blockBlobClient.getProperties();

    // Convert size from bytes to megabytes and round to 2 decimal places
    const sizeInMB = parseFloat((file.size / (1024 * 1024)).toFixed(2));

    return {
      url: blockBlobClient.url,
      name: sanitizedBaseName,
      extension: originalExtension,
      size: sizeInMB,
    };
  } catch (error) {
    console.error("Azure Blob upload failed:", error);
    throw new Error(
      `File upload failed: ${error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
export async function deleteFromAzureBlob(blobUrl: string | null): Promise<void> {
  if (!blobUrl) return;

  const connectionString = await getSecret(process.env.AZURE_STORAGE_CONNECTION_STRING as string);
  // const connectionString = "storage-account-connection-string";
  // const connectionString = await getSecret("storage-account-connection-string");
  const containerName = "account";

  const url = new URL(blobUrl);
  const blobName = decodeURIComponent(
    url.pathname.split("/").slice(2).join("/")
  );
  // slice(2) skips the container and empty slash
  if (!connectionString) {
    throw new Error("Azure storage connection string is required");
  }
  const blobServiceClient =
    BlobServiceClient.fromConnectionString(connectionString);
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

export const getColumnsNamesForTaskCommentsUpdate = (data: UpdateCommentsType, dbData: TaskComments) => {
  let columns: string[] = [];
  if (data.comments !== dbData.comments)
    columns.push(`comments`)
  return columns;
}

export async function generateSasUrl(blobUrl: string, expiryMinutes = 15): Promise<string> {
  try {
    const connectionString = await getSecret(process.env.AZURE_STORAGE_CONNECTION_STRING as string);
    // const connectionString = "storage-account-connection-string";
    // const connectionString = await getSecret("storage-account-connection-string");
    // const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING as string

    if (!connectionString) {
      throw new Error("Azure storage connection string is required");
    }

    const parsedUrl = parse(blobUrl);
    const hostnameParts = parsedUrl.hostname?.split(".") || [];
    const accountName = hostnameParts[0];
    const pathParts = parsedUrl.pathname?.replace(/^\/+/, "").split("/") || [];

    if (pathParts.length < 2) {
      throw new Error("Invalid blob URL format");
    }

    const containerName: any = pathParts[0];
    const blobName = pathParts.slice(1).join("/");

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const credential = (blobServiceClient as any).credential as StorageSharedKeyCredential;

    if (!credential) {
      throw new Error("StorageSharedKeyCredential missing from BlobServiceClient");
    }

    const expiresOn = new Date();
    expiresOn.setMinutes(expiresOn.getMinutes() + expiryMinutes);

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName,
        blobName,
        permissions: BlobSASPermissions.parse("r"),
        expiresOn,
        protocol: SASProtocol.Https
      },
      credential
    ).toString();

    const sasUrl = `${blobUrl}?${sasToken}`;
    return sasUrl;
  } catch (error) {
    logMessage(`Error generating SAS URL: ${error}`);
    throw new Error(`SAS URL generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export const validateProjectResourceRequest = (data: any) => {
  if (!data.account_rid) return STATUS_MESSAGE.accountIdMissing;
  // if(!data.project_rid) return STATUS_MESSAGE.projectIdMissing
  if (!data.project_resource_rid) return STATUS_MESSAGE.fiscalIdMissing;
};

export const validateProjectTaskRequest = (data: any) => {
  if (!data.account_rid) return STATUS_MESSAGE.accountIdMissing;
  if (!data.rid) return STATUS_MESSAGE.projectIdMissing;
};

// Utility to parse mm/dd and year to YYYY-MM-DD
export function parseFiscalDate(mmdd: string, year: number): string {
  const [mm, dd] = mmdd.split('/');
  if (!mm || !dd) return '';
  // Pad month and day to 2 digits
  const paddedMonth = mm.padStart(2, '0');
  const paddedDay = dd.padStart(2, '0');
  return `${year}-${paddedMonth}-${paddedDay}`;
}

// Utility to calculate the fiscal end year based on start and end mm/dd and fiscal year
export function getFiscalEndYear(fiscalStart: string, fiscalEnd: string, fiscalYear: number): number {
  const [startMonthStr] = fiscalStart.split('/');
  const [endMonthStr] = fiscalEnd.split('/');
  const startMonth = parseInt(startMonthStr || '0', 10);
  const endMonth = parseInt(endMonthStr || '0', 10);
  if (isNaN(startMonth) || isNaN(endMonth)) return fiscalYear;
  return endMonth < startMonth ? fiscalYear + 1 : fiscalYear;
}
