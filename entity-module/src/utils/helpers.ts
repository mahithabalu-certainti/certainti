import Joi from "joi";
import { Request, Response } from "express";
import { HttpStatus, STATUS_MESSAGE } from "./constants";
import { errorResponse,successResponse } from "./apiResponse";
import configurations from "../config/config";
import ExcelJS from 'exceljs';
import { ResourceSkill } from "../models/resourceSkill";
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

export function requestErrorMessages(error: any): Record<string, string> | string {
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
  return errors.reduce((acc: Record<string, string>, curr: Record<string, string> | string) => {
    if (typeof curr === "string") {
      acc["message"] = curr;
    } else {
      Object.assign(acc, curr);
    }
    return acc;
  }, {} as Record<string, string>);
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
  return successResponse(res, HttpStatus.SUCCESS, HttpStatus.SUCCESS_MESSAGE, data, HttpStatus.SUCCESS_NOTIFICATION);
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
  
  // Add data rows
  data.forEach((row: any) => {
    worksheet.addRow(Object.values(row));
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer).toString('base64');
}

export const validateProjectRequest = (data : any) => {
  if(!data.account_rid) return STATUS_MESSAGE.accountIdMissing
  if(!data.project_rid) return STATUS_MESSAGE.projectIdMissing
  if(!data.project_fiscal_rid) return STATUS_MESSAGE.fiscalIdMissing
}

export const validateResourceRequest = (data : any) => {
  if(!data.account_rid) return STATUS_MESSAGE.accountIdMissing
  if(!data.resource_rid) return STATUS_MESSAGE.resourceIdMissing
}

export const validateResourceCost = (data : any) => {
  if(!data.account_rid) return STATUS_MESSAGE.accountIdMissing
  if(!data.resource_rid) return STATUS_MESSAGE.resourceIdMissing
  if(!data.resource_cost_rid) return STATUS_MESSAGE.costIdMissing
}

export const validateResourceSkill = (data : any) => {
  if(!data.account_rid) return STATUS_MESSAGE.accountIdMissing
  if(!data.resource_rid) return STATUS_MESSAGE.resourceIdMissing
  if(!data.resource_skill_rid) return STATUS_MESSAGE.skillIdMissing
}

export const setProject = (dbData : any, requestData : any) => {
  let newPrjData : any = {}
  let newPrjArray = []
  if(requestData.project_name) {
  newPrjData.project_name = requestData.project_name !== dbData.project_name ? requestData.project_name : dbData.project_name
  let data = `project_name = '${newPrjData.project_name}'`
  newPrjArray.push(data)
  }
  if(requestData.project_code) {
  newPrjData.project_code = requestData.project_code !== dbData.project_code ? requestData.project_code : dbData.project_code
  let data = `project_code = '${newPrjData.project_code}'`
  newPrjArray.push(data)
  }
  if(requestData.project_type_rid) {
  newPrjData.project_type_rid = requestData.project_type_rid != dbData.project_type_rid ? requestData.project_type_rid : dbData.project_type_rid
  let data = `project_type_rid = '${newPrjData.project_type_rid}'`
  newPrjArray.push(data)
  }
  if(requestData.project_classification_rid) {
  newPrjData.project_classification_rid = requestData.project_classification_rid != dbData.project_classification_rid ? requestData.project_classification_rid : dbData.project_classification_rid
  let data = `project_classification_rid = '${newPrjData.project_classification_rid}'`
  newPrjArray.push(data)
  }
  if(requestData.project_client_group) {
  newPrjData.project_client_group = requestData.project_client_group !== dbData.project_client_group ? requestData.project_client_group : dbData.project_client_group
  let data = `project_client_group = '${newPrjData.project_client_group}'`
  newPrjArray.push(data)
  }
  if(requestData.project_group) {
  newPrjData.project_group = requestData.project_group != dbData.project_group ? requestData.project_group : dbData.project_group
  let data = `project_group = '${newPrjData.project_group}'`
  newPrjArray.push(data)
  }
  if(requestData.assessment_status) {
  newPrjData.assessment_status = requestData.assessment_status != dbData.assessment_status ? requestData.assessment_status : dbData.assessment_status
  let data = `assessment_status = '${newPrjData.assessment_status}'`
  newPrjArray.push(data)
  }
  if(requestData.comments) {
  newPrjData.comments = requestData.comments != dbData.comments ? requestData.comments : dbData.comments
  let data = `comments = '${newPrjData.comments}'`
  newPrjArray.push(data)
  }
  let data = `modified_by = '${requestData.userId}'`
  newPrjArray.push(data)
  return newPrjArray
    }

export const setPrjFiscalData = (dbData : any, requestData : any) => {
  let newPrjFisData : any = {}
  let newPrjFisArray = []
  if(requestData.project_name) {
  newPrjFisData.project_name = requestData.project_name != dbData.project_name ? requestData.project_name : dbData.project_name
  let data = `project_name = '${newPrjFisData.project_name}'`
  newPrjFisArray.push(data)
  }
  if(requestData.project_code) {
  newPrjFisData.project_code = requestData.project_code != dbData.project_code ? requestData.project_code : dbData.project_code
  let data = `project_code = '${newPrjFisData.project_code}'`
  newPrjFisArray.push(data)
  }
  if(requestData.project_type_rid) {
  newPrjFisData.project_type_rid = requestData.project_type_rid != dbData.project_type_rid ? requestData.project_type_rid : dbData.project_type_rid
  let data = `project_type_rid = '${newPrjFisData.project_type_rid}'`
  newPrjFisArray.push(data)
  }
  if(requestData.fiscal_year) {
  newPrjFisData.fiscal_year = requestData.fiscal_year != dbData.fiscal_year ? requestData.fiscal_year : dbData.fiscal_year
  let data = `fiscal_year = ${newPrjFisData.fiscal_year}`
  newPrjFisArray.push(data)
  }
  if(requestData.project_classification_rid) {
  newPrjFisData.project_classification_rid = requestData.project_classification_rid != dbData.project_classification_rid ? requestData.project_classification_rid : dbData.project_classification_rid
  let data = `project_classification_rid = '${newPrjFisData.project_classification_rid}'`
  newPrjFisArray.push(data)
  }
  if(requestData.project_client_group) {
  newPrjFisData.project_client_group = requestData.project_client_group != dbData.project_client_group ? requestData.project_client_group : dbData.project_client_group
  let data = `project_client_group = '${newPrjFisData.project_client_group}'`
  newPrjFisArray.push(data)
  }
  if(requestData.project_group) {
  newPrjFisData.project_group = requestData.project_group != dbData.project_group ? requestData.project_group : dbData.project_group
  let data = `project_group = ${newPrjFisData.project_group}`
  newPrjFisArray.push(data)
  }
  if(requestData.assessment_status) {
  newPrjFisData.assessment_status = requestData.assessment_status != dbData.assessment_status ? requestData.assessment_status : dbData.assessment_status
  let data = `assessment_status = '${newPrjFisData.assessment_status}'`
  newPrjFisArray.push(data)
  }
  if(requestData.comments) {
  newPrjFisData.comments = requestData.comments != dbData.comments ? requestData.comments : dbData.comments
  let data = `comments = '${newPrjFisData.comments}'`
  newPrjFisArray.push(data)
  }
  let data = `modified_by = '${requestData.userId}'`
  newPrjFisArray.push(data)
  return newPrjFisArray;
}

export const setProjectSummary = (dbData : any, requestData : any) => {
  let newDbPrjSummary : any = {};
  let newDbPrjSummaryArray = []
  if(requestData.project_name) {
  newDbPrjSummary.project_name = requestData.project_name != dbData.project_name ? requestData.project_name : dbData.project_name
  let data = `project_name = '${newDbPrjSummary.project_name}'`
  newDbPrjSummaryArray.push(data)
  }
  if(requestData.project_code) {
  newDbPrjSummary.project_code = requestData.project_code != dbData.project_code ? requestData.project_code : dbData.project_code
  let data = `project_code = '${newDbPrjSummary.project_code}'`
  newDbPrjSummaryArray.push(data)
  }
  if(requestData.project_type_rid) {
  newDbPrjSummary.project_type_rid = requestData.project_type_rid != dbData.project_type_rid ? requestData.project_type_rid : dbData.project_type_rid
  let data = `project_type_rid = '${newDbPrjSummary.project_type_rid}'`
  newDbPrjSummaryArray.push(data)
  }
  if(requestData.project_classification_rid) {
  newDbPrjSummary.project_classification_rid = requestData.project_classification_rid != dbData.project_classification_rid ? requestData.project_classification_rid : dbData.project_classification_rid
  let data = `project_classification_rid = '${newDbPrjSummary.project_classification_rid}'`
  newDbPrjSummaryArray.push(data)
  }
  if(requestData.project_client_group) {
  newDbPrjSummary.project_client_group = requestData.project_client_group != dbData.project_client_group ? requestData.project_client_group : dbData.project_client_group
  let data = `project_client_group = '${newDbPrjSummary.project_client_group}'`
  newDbPrjSummaryArray.push(data)
  }
  if(requestData.project_group) {
  newDbPrjSummary.project_group = requestData.project_group != dbData.project_group ? requestData.project_group : dbData.project_group
  let data = `project_group = '${newDbPrjSummary.project_group}'`
  newDbPrjSummaryArray.push(data)
  }
  if(requestData.assessment_status) {
  newDbPrjSummary.assessment_status = requestData.assessment_status != dbData.assessment_status ? requestData.assessment_status : dbData.assessment_status
  let data = `assessment_status = '${newDbPrjSummary.assessment_status}'`
  newDbPrjSummaryArray.push(data)
  }
  if(requestData.comments) {
  newDbPrjSummary.comments = requestData.comments != dbData.comments ? requestData.comments : dbData.comments
  let data = `comments = '${newDbPrjSummary.comments}'`
  newDbPrjSummaryArray.push(data)
  }
  let data = `modified_by = '${requestData.userId}'`
  newDbPrjSummaryArray.push(data)
  return newDbPrjSummaryArray;
}

export const setProjectFiscalSummary = (dbData : any, requestData : any) => {
  let newFisSummary : any = {}
  let newFisSummaryArray = []
  if(requestData.project_name) {
  newFisSummary.project_name = requestData.project_name !== dbData.project_name ? requestData.project_name : dbData.project_name
  let data = `project_name = '${newFisSummary.project_name}'`
  newFisSummaryArray.push(data)
  }
  if(requestData.project_code) {
  newFisSummary.project_code = requestData.project_code !== dbData.project_code ? requestData.project_code : dbData.project_code
  let data = `project_code = '${newFisSummary.project_code}'`
  newFisSummaryArray.push(data)
  }
  if(requestData.project_type_rid) {
  newFisSummary.project_type_rid = requestData.project_type_rid !== dbData.project_type_rid ? requestData.project_type_rid : dbData.project_type_rid
  let data = `project_type_rid = '${newFisSummary.project_type_rid}'`
  newFisSummaryArray.push(data)
  }
  if(requestData.project_classification_rid) {
  newFisSummary.project_classification_rid = requestData.project_classification_rid != dbData.project_classification_rid ? requestData.project_classification_rid : dbData.project_classification_rid
  let data = `project_classification_rid = '${newFisSummary.project_classification_rid}'`
  newFisSummaryArray.push(data)
  }
  if(requestData.project_client_group) {
  newFisSummary.project_client_group = requestData.project_client_group != dbData.project_client_group ? requestData.project_client_group : dbData.project_client_group
  let data = `project_client_group = '${newFisSummary.project_client_group}'`
  newFisSummaryArray.push(data)
  }
  if(requestData.project_group) {
  newFisSummary.project_group = requestData.project_group != dbData.project_group ? requestData.project_group : dbData.project_group
  let data = `project_group = '${newFisSummary.project_group}'`
  newFisSummaryArray.push(data)
  }
  if(requestData.assessment_status) {
  newFisSummary.assessment_status = requestData.assessment_status != dbData.assessment_status ? requestData.assessment_status : dbData.assessment_status
  let data = `assessment_status = '${newFisSummary.assessment_status}'`
  newFisSummaryArray.push(data)
  }
  if(requestData.comments) {
  newFisSummary.comments = requestData.comments != dbData.comments ? requestData.comments : dbData.comments
  let data = `comments = '${newFisSummary.comments}'`
  newFisSummaryArray.push(data)
  }
  if(requestData.fiscal_year) {
  newFisSummary.fiscal_year = requestData.fiscal_year != dbData.fiscal_year ? requestData.fiscal_year : dbData.fiscal_year
  let data = `fiscal_year = ${newFisSummary.fiscal_year}`
  newFisSummaryArray.push(data)
  }
  let data = `modified_by = '${requestData.userId}'`
  newFisSummaryArray.push(data)
  return newFisSummaryArray;
}

export const setResourceFiscal = (dbData : any, requestData : any) => {
  let newDataArray = []
  let dataStorage;
  let newData : any = {}

  if(requestData.country_rid) {
      newData.country_rid = requestData.country_rid !== dbData.country_rid ? requestData.country_rid : dbData.country_rid
      dataStorage = `country_rid = '${newData.country_rid}'`
      newDataArray.push(dataStorage)
  }
  if(requestData.region_rid) {
      newData.region_rid = requestData.region_rid !== dbData.country_region_rid ? requestData.region_rid : dbData.country_region_rid
      dataStorage = `country_region_rid = '${newData.region_rid}'`
      newDataArray.push(dataStorage)
  }
  if(requestData.resource_type_rid) {
      newData.resource_type_rid = requestData.resource_type_rid !== dbData.resource_type_rid ? requestData.resource_type_rid : dbData.resource_type_rid
      dataStorage = `resource_type_rid = '${newData.resource_type_rid}'`
      newDataArray.push(dataStorage)
  }
  dataStorage = `modified_datetime = NOW()`
  newDataArray.push(dataStorage)
  dataStorage = `modified_by = '${requestData.userId}'`
  newDataArray.push(dataStorage)
  return newDataArray;
  }

export const setResourcesData = (dbData : any, requestData : any) => {

  let newDataArray = []
  let dataStorage;
  let newData : any = {}
  if(requestData.resource_name) {
    newData.resource_name = requestData.resource_name !== dbData.resource_name ? requestData.resource_name : dbData.resource_name
    newData.first_name = newData.resource_name.split(' ')[0]
    newData.last_name = newData.resource_name.split(' ')[1]
    dataStorage = `resource_name = '${newData.resource_name}'`
    newDataArray.push(dataStorage)
    dataStorage = `resource_firstname = '${newData.first_name}'`
    newDataArray.push(dataStorage)
    dataStorage = `resource_lastname = '${newData.last_name}'`
    newDataArray.push(dataStorage)
  }
  if(requestData.resource_type_rid) {
    newData.resource_type_rid = requestData.resource_type_rid !== dbData.resource_type_rid ? requestData.resource_type_rid : dbData.resource_type_rid
    dataStorage = `resource_type_rid = '${newData.resource_type_rid}'`
    newDataArray.push(dataStorage)
  }
  if(requestData.resource_code) {
    newData.resource_code = requestData.resource_code !== dbData.resource_code ? requestData.resource_code : dbData.resource_code
    dataStorage = `resource_code = '${newData.resource_code}'`
    newDataArray.push(dataStorage)
  }
  if(requestData.resource_orgname) {
    newData.resource_orgname = requestData.resource_orgname !== dbData.resource_orgname ? requestData.resource_orgname : dbData.resource_orgname
    dataStorage = `resource_orgname = '${newData.resource_orgname}'`
    newDataArray.push(dataStorage)
  }
  if(requestData.resource_designation) {
    newData.resource_designation = requestData.resource_designation != dbData.resource_designation ? requestData.resource_designation : dbData.resource_designation
    dataStorage = `resource_designation = '${newData.resource_designation}'`
    newDataArray.push(dataStorage)
  }
  if(requestData.resource_role) {
    newData.resource_role = requestData.resource_role !== dbData.resource_role ? requestData.resource_role : dbData.resource_role
    dataStorage = `resource_role = '${newData.resource_role}'`
    newDataArray.push(dataStorage)
  }
  if(requestData.region_rid) {
    newData.region_rid = requestData.region_rid !== dbData.region_rid ? requestData.region_rid : dbData.region_rid
    dataStorage = `region_rid = '${newData.region_rid}'`
    newDataArray.push(dataStorage)
  }
  if(requestData.country_rid) {
    newData.country_rid = requestData.country_rid !== dbData.country_rid ? requestData.country_rid : dbData.country_rid
    dataStorage = `country_rid = '${newData.country_rid}'`
    newDataArray.push(dataStorage)
  }
  if(requestData.status_rid) {
    newData.status_rid = requestData.status_rid !== dbData.status_rid ? requestData.status_rid : dbData.status_rid
    dataStorage = `status_rid = '${newData.status_rid}'`
    newDataArray.push(dataStorage)
  }
  if(requestData.comments) {
    newData.comments = requestData.comments !== dbData.comments ? requestData.comments : dbData.comments
    dataStorage = `comments = '${newData.comments}'`
    newDataArray.push(dataStorage)
  }
  dataStorage = `modified_datetime = NOW()`
  newDataArray.push(dataStorage)
  dataStorage = `modified_by = '${requestData.userId}'`
  newDataArray.push(dataStorage)
  return newDataArray;
}

export const setResFiscalForResCost = (dbData : any, requestData : any) => {
  let newData;
  if(requestData.fiscal_year) {
    newData = dbData.fiscal_year != requestData.fiscal_year ? requestData.fiscal_year : dbData.fiscal_year
  }
  return newData;
}

export const setResourceCostDatas = (dbData : any, requestData : any) => {
  let newCostData : any = {}
  let dataStorage;
  let newCostDataArray = []
  if(requestData.fiscal_year) {
      newCostData.fiscal_year = dbData.fiscal_year != requestData.fiscal_year ? requestData.fiscal_year : dbData.fiscal_year
      dataStorage = `fiscal_year = ${newCostData.fiscal_year}`
      newCostDataArray.push(dataStorage)
  }
  if(requestData.currency_rid) {
    newCostData.currency_rid = requestData.currency_rid != dbData.currency_rid ? requestData.currency_rid : dbData.currency_rid
    dataStorage = `currency_rid = '${newCostData.currency_rid}'`
    newCostDataArray.push(dataStorage)
  }
  if(requestData.effective_from) {
    newCostData.effective_from = requestData.effective_from != dbData.effective_from ? requestData.effective_from : dbData.effective_from
    dataStorage = `effective_from = '${newCostData.effective_from}'`
    newCostDataArray.push(dataStorage);
  }
  if(requestData.end_date) {
    newCostData.end_date = requestData.end_date != dbData.end_date ? requestData.end_date : dbData.end_date
    dataStorage = `end_date = '${newCostData.end_date}'`
    newCostDataArray.push(dataStorage);
  }
  if(requestData.effort_in_hrs) {
    newCostData.effort_in_hrs = requestData.effort_in_hrs != dbData.effort_in_hrs ? requestData.effort_in_hrs : dbData.effort_in_hrs
    dataStorage = `effort_in_hrs = ${newCostData.effort_in_hrs}`
    newCostDataArray.push(dataStorage)
  }
  if(requestData.salary) {
    newCostData.salary = requestData.salary != dbData.salary ? requestData.salary : dbData.salary
    dataStorage = `salary = ${newCostData.salary}`
    newCostDataArray.push(dataStorage)
  }
  if(requestData.bonus) {
    newCostData.bonus = requestData.bonus != dbData.bonus ? requestData.bonus : dbData.bonus
    dataStorage = `bonus = ${newCostData.bonus}`
    newCostDataArray.push(dataStorage)
  }
  if(requestData.insurance) {
    newCostData.insurance = requestData.insurance != dbData.insurance ? requestData.insurance : dbData.insurance
    dataStorage = `insurance = ${newCostData.insurance}`
    newCostDataArray.push(dataStorage)
  }
  if(requestData.deductions) {
    newCostData.deductions = requestData.deductions != dbData.deductions ? requestData.deductions : dbData.deductions
    dataStorage = `deductions = ${newCostData.deductions}`
    newCostDataArray.push(dataStorage)
  }
  if(requestData.resource_cost) {
    newCostData.resource_cost = requestData.resource_cost != dbData.resource_cost ? requestData.resource_cost : dbData.resource_cost
    dataStorage = `resource_cost = ${newCostData.resource_cost}`
    newCostDataArray.push(dataStorage)
  }
  if(requestData.comments) {
    newCostData.comments = requestData.comments != dbData.comments ? requestData.comments : dbData.comments
    dataStorage = `comments = ${newCostData.comments}`
    newCostDataArray.push(dataStorage)
  }
  dataStorage = `modified_by = '${requestData.userId}'`
  newCostDataArray.push(dataStorage)
  dataStorage = `modified_datetime = NOW()`
  newCostDataArray.push(dataStorage)
  return newCostDataArray;
}

export const setResourceSkillData = (dbData : ResourceSkill, requestData : any) => {
  let newData : any = {};
  let newDataArray = [];
  let dataStorage;
  if(requestData.start_date) {
    newData.start_date = requestData.start_date != dbData.start_date ? requestData.start_date : dbData.start_date
    dataStorage = `start_date = '${newData.start_date}'`
    newDataArray.push(dataStorage)
  }
  if(requestData.skill_type_rid) {
    newData.skill_type_rid = requestData.skill_type_rid != dbData.skill_type_rid ? requestData.skill_type_rid : dbData.skill_type_rid
    dataStorage = `skill_type_rid = '${newData.skill_type_rid}'`
    newDataArray.push(dataStorage)
  }
  if(requestData.skill_subtype_rid) {
    newData.skill_subtype_rid = requestData.skill_subtype_rid != dbData.skill_subtype_rid ? requestData.skill_subtype_rid : dbData.skill_subtype_rid
    dataStorage = `skill_subtype_rid = '${newData.skill_subtype_rid}'`
    newDataArray.push(dataStorage)
  }
  if(requestData.skill_level_rid) {
    newData.skill_level_rid = requestData.skill_level_rid != dbData.skill_level_rid ? requestData.skill_level_rid : dbData.skill_level_rid
    dataStorage = `skill_level_rid = '${newData.skill_level_rid}'`
    newDataArray.push(dataStorage)
  }
  if(requestData.skill_details) {
    newData.skill_details = requestData.skill_details != dbData.skill_details ? requestData.skill_details : dbData.skill_details
    dataStorage = `skill_details = '${newData.skill_details}'`
    newDataArray.push(dataStorage)
  }
  dataStorage = `modified_by = '${requestData.userId}'`
  newDataArray.push(dataStorage)
  dataStorage = `modified_datetime = NOW()`
  newDataArray.push(dataStorage)
  return newDataArray;
}