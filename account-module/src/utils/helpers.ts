import Joi from "joi";
import { Request, Response } from "express";
import { HttpStatus } from "./constant";
import { errorResponse, successResponse } from "./apiResponse";
import configurations from "../config/config";
import ExcelJS from 'exceljs';

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
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer).toString('base64');
}


type ColumnSchema = {
  column_name: string;
  data_type: string;
};

export function getTableSchemaByEntity(entity: string): ColumnSchema[] {
  switch (entity) {
    case 'resource':
      return [
        { column_name: 'resource_id', data_type: 'String' },
        { column_name: 'resource_name', data_type: 'String' },
        { column_name: 'resource_type', data_type: 'ENUM' },
        { column_name: 'resource_organization', data_type: 'String' },
        { column_name: 'resource_designation', data_type: 'String' },
        { column_name: 'resource_role', data_type: 'String' },
        { column_name: 'total_experience', data_type: 'Integer' },
        { column_name: 'resource_startdate', data_type: 'Date' },
        { column_name: 'resource_enddate', data_type: 'Date' },
        { column_name: 'resource_country', data_type: 'String' },
        { column_name: 'resource_state_province', data_type: 'String' },
        { column_name: 'resource_city', data_type: 'String' },
        { column_name: 'years_in_organization', data_type: 'Integer' },
        { column_name: 'comments', data_type: 'text' },
      ];

    case 'resource_cost':
      return [
        { column_name: 'resource_id', data_type: 'String' },
        { column_name: 'resource_name', data_type: 'String' },
        { column_name: 'resource_type', data_type: 'ENUM' },
        { column_name: 'currency', data_type: 'String' },
        { column_name: 'start_date', data_type: 'Date' },
        { column_name: 'end_date', data_type: 'Date' },
        { column_name: 'annual_compensation', data_type: 'Decimal(18,2)' },
        { column_name: 'monthly_compensation', data_type: 'Decimal(18,2)' },
        { column_name: 'weekly_compensation', data_type: 'Decimal(18,2)' },
        { column_name: 'daily_compensation', data_type: 'Decimal(18,2)' },
        { column_name: 'hourly_compensation', data_type: 'Decimal(18,2)' },
        { column_name: 'bi_weekly_compensation', data_type: 'Decimal(18,2)' },
        { column_name: 'comments', data_type: 'text' },
      ];

    case 'resource_skill':
      return [
        { column_name: 'resource_id', data_type: 'String' },
        { column_name: 'resource_name', data_type: 'String' },
        { column_name: 'resource_type', data_type: 'ENUM' },
        { column_name: 'start_date', data_type: 'Date' },
        { column_name: 'skill_type', data_type: 'ENUM' },
        { column_name: 'skill_subtype', data_type: 'String' },
        { column_name: 'skill_details', data_type: 'String' },
        { column_name: 'skill_level', data_type: 'String' },
        { column_name: 'comments', data_type: 'text' },
      ];

    case 'project':
      return [
        { column_name: 'project_id', data_type: 'String' },
        { column_name: 'project_name', data_type: 'String' },
        { column_name: 'project_description', data_type: 'String' },
        { column_name: 'total_hours', data_type: 'Decimal(18,2)' },
        { column_name: 'total_cost', data_type: 'Decimal(18,2)' },
        { column_name: 'point_of_contact', data_type: 'String' },
        { column_name: 'point_of_contact_email', data_type: 'email' },
        { column_name: 'start_date', data_type: 'Date' },
        { column_name: 'end_date', data_type: 'Date' },
        { column_name: 'detailed_description', data_type: 'String' },
        { column_name: 'currency', data_type: 'String' },
        { column_name: 'industry', data_type: 'String' },
        { column_name: 'program_name', data_type: 'String' },
        { column_name: 'client_organization', data_type: 'String' },
        { column_name: 'country', data_type: 'String' },
        { column_name: 'city', data_type: 'String' },
        { column_name: 'region', data_type: 'String' },
        { column_name: 'project_manager', data_type: 'String' },
        { column_name: 'project_lead', data_type: 'String' },
        { column_name: 'project_tech_poc_name', data_type: 'String' },
        { column_name: 'project_tech_poc_email', data_type: 'email' },
        { column_name: 'project_tech_poc_mobile', data_type: 'String' },
        { column_name: 'project_type', data_type: 'String' },
        { column_name: 'project_classification', data_type: 'String' },
        { column_name: 'project_client_group', data_type: 'String' },
        { column_name: 'project_group', data_type: 'String' },
        { column_name: 'total_fte_count', data_type: 'Integer' },
        { column_name: 'total_sub_con_count', data_type: 'Integer' },
        { column_name: 'total_fte_effort_in_hrs', data_type: 'Decimal(18,2)' },
        { column_name: 'total_fte_cost', data_type: 'Decimal(18,2)' },
        { column_name: 'total_sub_con_effort_in_hrs', data_type: 'Decimal(18,2)' },
        { column_name: 'total_sub_con_cost', data_type: 'Decimal(18,2)' },
        { column_name: 'total_non_labor_cost_cost', data_type: 'Decimal(18,2)' },
      ];

    case 'project_resource':
      return [
        { column_name: 'project_id', data_type: 'String' },
        { column_name: 'project_name', data_type: 'String' },
        { column_name: 'project_description', data_type: 'String' },
        { column_name: 'resource_id', data_type: 'UUID' },
        { column_name: 'resource_name', data_type: 'String' },
        { column_name: 'resource_type', data_type: 'ENUM' },
        { column_name: 'resource_designation', data_type: 'String' },
        { column_name: 'resource_role', data_type: 'String' },
        { column_name: 'start_date', data_type: 'Date' },
        { column_name: 'end_date', data_type: 'Date' },
        { column_name: 'total_experience', data_type: 'Integer' },
        { column_name: 'total_hours', data_type: 'Decimal(18,2)' },
        { column_name: 'total_cost', data_type: 'Decimal(18,2)' },
        { column_name: 'project_resource_description', data_type: 'String' },
        { column_name: 'resource_city', data_type: 'String' },
        { column_name: 'resource_state', data_type: 'String' },
        { column_name: 'province', data_type: 'String' },
        { column_name: 'resource_country', data_type: 'String' },
        { column_name: 'currency', data_type: 'String' },
      ];

    default:
      throw new Error(`Unsupported entity type: ${entity}`);
  }
}