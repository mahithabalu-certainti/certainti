import Joi from "joi";
import e, { Request, Response } from "express";
import { errorResponse, successResponse } from "./apiResponse";
import { ALPHANUMERIC_CONDITIONS, HttpStatus } from "./constants";
import configurations from "../config/config";
import ExcelJS from 'exceljs'
import { getSecret } from "./azureSecrets";
import crypto from "crypto";
import moment from "moment-timezone";
import { CreateTaskTemplateType, UpdateCaseTaskType, UpdateTaskTemplateType } from "./types";
import { TaskTemplate } from "../models/caseTaskTemplateModel";
import { CaseTask } from "../models/caseTaskModel";

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
    [ALPHANUMERIC_CONDITIONS.isEmpty]: (col) => `${col} IS NULL`,
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
      case_full_name: " CONCAT(a.account_name, '-', c.country_code, '-', cs.fiscal_year, '-', cs.case_name)"
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
    [ALPHANUMERIC_CONDITIONS.isEmpty]: (col) => `${col} IS NULL`,
    [ALPHANUMERIC_CONDITIONS.contains]: (col, val) => `${col} ILIKE '%${val}%'`,
    [ALPHANUMERIC_CONDITIONS.IN]: (col, val) =>
      `${col} IN (${
        Array.isArray(val)
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
      `${col} BETWEEN ${
        Array.isArray(val)
          ? val.map((d: any) => `'${d}'`).join(" AND ")
          : `'${val}'`
      }`,
    [ALPHANUMERIC_CONDITIONS.isEmpty]: (col) => `${col} IS NULL`,
  };

  return conditionMap[condition]?.(columnRef, values) || "";
};

export const setTaskTemplateData = (dbData : TaskTemplate, reqData : any, userId : string) => {
  let validUpdateQuery : string[] = []
  let validUpdateConditions : string = ``
  if(reqData.task_name) {
    if(reqData.task_name !== dbData.task_name) {
      validUpdateConditions = `task_name = '${reqData.task_name.replace(/'/g, "''")}'`
      validUpdateQuery.push(validUpdateConditions)
    } 
  }
  if(reqData.effort_in_days) {
    if(reqData.effort_in_days !== dbData.effort_in_days) {
      validUpdateConditions = `effort_in_days = ${reqData.effort_in_days}`
      validUpdateQuery.push(validUpdateConditions)
    }
  }
  if(reqData.reminder_interval) {
    if(reqData.reminder_interval !== dbData.reminder_interval) {
      validUpdateConditions = `reminder_interval = ${reqData.reminder_interval}`
      validUpdateQuery.push(validUpdateConditions)
    }
  }
  if(reqData.case_team_member_role_rid) {
    if(reqData.case_team_member_role_rid !== dbData.case_team_member_role_rid) {
      validUpdateConditions = `case_team_member_role_rid = '${reqData.case_team_member_role_rid}'`
      validUpdateQuery.push(validUpdateConditions)
    }
  }
  if(reqData.checklist_template_rid) {
    if(reqData.checklist_template_rid !== dbData.checklist_template_rid) {
      validUpdateConditions = `checklist_template_rid = '${reqData.checklist_template_rid}'`
      validUpdateQuery.push(validUpdateConditions)
    }
  }
  if(reqData.priority_rid) {
    if(reqData.priority_rid !== dbData.priority_rid) {
      validUpdateConditions = `priority_rid = '${reqData.priority_rid}'`
      validUpdateQuery.push(validUpdateConditions)
    }
  }
  if(reqData.milestone_template_rid) {
    if(reqData.milestone_template_rid !== dbData.milestone_template_rid) {
      validUpdateConditions = `milestone_template_rid = '${reqData.milestone_template_rid}'`
      validUpdateQuery.push(validUpdateConditions)
    }
  }
  if(reqData.task_description) {
    if(reqData.task_description !== dbData.task_description) {
      validUpdateConditions = `task_description = '${reqData.task_description.replace(/'/g, "''")}'`
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
  if(data.case_team_member_role_rid !== dbData.case_team_member_role_rid) 
    columns.push(`case_team_member_role_rid`)
  if(data.checklist_template_rid !== dbData.checklist_template_rid)
    columns.push(`checklist_template_rid`)
  if(data.effective_end_datetime !== dbData.effective_end_datetime) 
    columns.push(`effective_end_datetime`)
  if(data.effective_start_datetime !== dbData.effective_start_datetime)
    columns.push(`effective_start_datetime`)
  if(data.effort_in_days !== dbData.effort_in_days) 
    columns.push(`effort_in_days`)
  if(data.milestone_template_rid !== dbData.milestone_template_rid) 
    columns.push(`milestone_template_rid`)
  if(data.priority_rid !== dbData.priority_rid)
    columns.push(`priority_rid`)
  if(data.reminder_interval !== dbData.reminder_interval) 
    columns.push(`reminder_interval`)
  if(data.task_description !== dbData.task_description)
    columns.push(`task_description`)
  if(data.task_name !== dbData.task_name)
    columns.push(`task_name`)
  if(data.task_status_rid !== dbData.task_status_rid)
    columns.push(`task_status_rid`)
  if(data.task_type_rid !== dbData.task_type_rid)
    columns.push(`task_type_rid`)

  return columns;
}
