import Joi from "joi";
import { Request, Response } from "express";
import { HttpStatus, STATUS_MESSAGE } from "./constants";
import { errorResponse, successResponse } from "./apiResponse";
import configurations from "../config/config";
import ExcelJS from "exceljs";
import { ResourceSkill } from "../models/resourceSkill";
import { BlobServiceClient } from "@azure/storage-blob";
import { getSecret } from "./azureSecrets";
import { Attachment } from "../models/attachments";
import { ProjectTask } from "../models/projectTask";
import crypto from "crypto";
import { Notes } from "../models/notes";

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

export function handleSuccessResponse(
  res: Response,
  data: any,
  message?: string,
  statusCode?: number
) {
  return successResponse(
    res,
    statusCode ? statusCode : HttpStatus.SUCCESS,
    message ? message : HttpStatus.SUCCESS_MESSAGE,
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
  return Buffer.from(buffer).toString("base64");
}

export const validateProjectRequest = (data: any) => {
  if (!data.account_rid) return STATUS_MESSAGE.accountIdMissing;
  if (!data.project_rid) return STATUS_MESSAGE.projectIdMissing;
  if (!data.project_fiscal_rid) return STATUS_MESSAGE.fiscalIdMissing;
};

export const validateProjectQreUpdateRequest = (data: any) => {
  if (!data.account_rid) return STATUS_MESSAGE.accountIdMissing;
  if (!data.rid) return STATUS_MESSAGE.projectIdMissing;
  if (!data.rd_percent_potential_ai)
    return STATUS_MESSAGE.rdpercentPotentialmissing;
};

export const validateResourceRequest = (data: any) => {
  if (!data.account_rid) return STATUS_MESSAGE.accountIdMissing;
  if (!data.resource_rid) return STATUS_MESSAGE.resourceIdMissing;
};

export const validateResourceCost = (data: any) => {
  if (!data.account_rid) return STATUS_MESSAGE.accountIdMissing;
  if (!data.resource_rid) return STATUS_MESSAGE.resourceIdMissing;
  if (!data.resource_cost_rid) return STATUS_MESSAGE.costIdMissing;
};

export const validateResourceSkill = (data: any) => {
  if (!data.account_rid) return STATUS_MESSAGE.accountIdMissing;
  if (!data.resource_rid) return STATUS_MESSAGE.resourceIdMissing;
  if (!data.resource_skill_rid) return STATUS_MESSAGE.skillIdMissing;
};

export const validateAttachment = (data: any) => {
  if (!data.account_rid) return STATUS_MESSAGE.accountIdMissing;
  if (!data.rid) return STATUS_MESSAGE.attachmentIdMissing;
};

export const validateProjectResourceRequest = (data: any) => {
  if (!data.account_rid) return STATUS_MESSAGE.accountIdMissing;
  // if(!data.project_rid) return STATUS_MESSAGE.projectIdMissing
  if (!data.project_resource_rid) return STATUS_MESSAGE.fiscalIdMissing;
};

export const validateProjectTaskRequest = (data: any) => {
  if (!data.account_rid) return STATUS_MESSAGE.accountIdMissing;
  if (!data.rid) return STATUS_MESSAGE.projectIdMissing;
};

export const setProject = (dbData: any, requestData: any) => {
  let newPrjData: any = {};
  let newPrjArray = [];
  if (requestData.project_name != undefined) {
    newPrjData.project_name =
      requestData.project_name !== dbData.project_name
        ? requestData.project_name
        : dbData.project_name;
    let data = `project_name = '${newPrjData.project_name}'`;
    newPrjArray.push(data);
  }
  if (requestData.project_code) {
    newPrjData.project_code =
      requestData.project_code !== dbData.project_code
        ? requestData.project_code
        : dbData.project_code;
    let data = `project_code = '${newPrjData.project_code}'`;
    newPrjArray.push(data);
  }
  if (requestData.project_type_rid != undefined) {
    newPrjData.project_type_rid =
      requestData.project_type_rid != dbData.project_type_rid
        ? requestData.project_type_rid
        : dbData.project_type_rid;
    let data = `project_type_rid = '${newPrjData.project_type_rid}'`;
    newPrjArray.push(data);
  }
  if (requestData.project_classification_rid != undefined) {
    newPrjData.project_classification_rid =
      requestData.project_classification_rid !=
      dbData.project_classification_rid
        ? requestData.project_classification_rid
        : dbData.project_classification_rid;
    let data = `project_classification_rid = '${newPrjData.project_classification_rid}'`;
    newPrjArray.push(data);
  }
  if (requestData.project_classification_other != undefined) {
    newPrjData.project_classification_other =
      requestData.project_classification_other !=
      dbData.project_classification_other
        ? requestData.project_classification_other
        : dbData.project_classification_other;
    let data = `project_classification_other = '${newPrjData.project_classification_other}'`;
    newPrjArray.push(data);
  }
  if (requestData.project_client_group != undefined) {
    newPrjData.project_client_group =
      requestData.project_client_group !== dbData.project_client_group
        ? requestData.project_client_group
        : dbData.project_client_group;
    let data = `project_client_group = '${newPrjData.project_client_group}'`;
    newPrjArray.push(data);
  }
  if (requestData.project_group != undefined) {
    newPrjData.project_group =
      requestData.project_group != dbData.project_group
        ? requestData.project_group
        : dbData.project_group;
    let data = `project_group = '${newPrjData.project_group}'`;
    newPrjArray.push(data);
  }
  if (requestData.assessment_status != undefined) {
    newPrjData.assessment_status =
      requestData.assessment_status != dbData.assessment_status
        ? requestData.assessment_status
        : dbData.assessment_status;
    let data = `assessment_status = '${newPrjData.assessment_status}'`;
    newPrjArray.push(data);
  }
  if (requestData.comments != undefined) {
    newPrjData.comments =
      requestData.comments != dbData.comments
        ? requestData.comments
        : dbData.comments;
    let data = `comments = '${newPrjData.comments}'`;
    newPrjArray.push(data);
  }
  if (requestData.total_cost != undefined) {
    newPrjData.total_cost =
      requestData.total_cost != dbData.total_cost
        ? requestData.total_cost
        : dbData.total_cost;
    let data =
      newPrjData.total_cost == ""
        ? `total_cost = null`
        : `total_cost = ${parseFloat(newPrjData.total_cost)}`;
    newPrjArray.push(data);
  }
  if (requestData.total_effort != undefined) {
    newPrjData.total_effort =
      requestData.total_effort != dbData.total_effort
        ? requestData.total_effort
        : dbData.total_effort;
    let data =
      newPrjData.total_effort == ""
        ? `total_effort = null`
        : `total_effort = ${parseFloat(newPrjData.total_effort)}`;
    newPrjArray.push(data);
  }
  if (requestData.total_cost_fte != undefined) {
    newPrjData.total_cost_fte =
      requestData.total_cost_fte != dbData.total_cost_fte
        ? requestData.total_cost_fte
        : dbData.total_cost_fte;
    let data =
      newPrjData.total_cost_fte == ""
        ? `total_cost_fte = null`
        : `total_cost_fte = ${parseFloat(newPrjData.total_cost_fte)}`;
    newPrjArray.push(data);
  }
  if (requestData.total_cost_subcon != undefined) {
    newPrjData.total_cost_subcon =
      requestData.total_cost_subcon != dbData.total_cost_subcon
        ? requestData.total_cost_subcon
        : dbData.total_cost_subcon;
    let data =
      newPrjData.total_cost_subcon == ""
        ? `total_cost_subcon = null`
        : `total_cost_subcon = ${parseFloat(newPrjData.total_cost_subcon)}`;
    newPrjArray.push(data);
  }
  if (requestData.total_cost_nonlabor != undefined) {
    newPrjData.total_cost_nonlabor =
      requestData.total_cost_nonlabor != dbData.total_cost_nonlabor
        ? requestData.total_cost_nonlabor
        : dbData.total_cost_nonlabor;
    let data =
      newPrjData.total_cost_nonlabor == ""
        ? `total_cost_nonlabor = null`
        : `total_cost_nonlabor = ${parseFloat(newPrjData.total_cost_nonlabor)}`;
    newPrjArray.push(data);
  }
  let data = `modified_by = '${requestData.userId}'`;
  newPrjArray.push(data);
  let datas = `modified_datetime = NOW()`;
  newPrjArray.push(datas);
  return newPrjArray;
};

export const setPrjFiscalData = (dbData: any, requestData: any) => {
  let newPrjFisData: any = {};
  let newPrjFisArray = [];
  if (requestData.project_name != undefined) {
    newPrjFisData.project_name =
      requestData.project_name != dbData.project_name
        ? requestData.project_name
        : dbData.project_name;
    let data = `project_name = '${newPrjFisData.project_name.replace(
      /'/g,
      "''"
    )}'`;
    newPrjFisArray.push(data);
  }
  if (requestData.project_code) {
    newPrjFisData.project_code =
      requestData.project_code != dbData.project_code
        ? requestData.project_code
        : dbData.project_code;
    let data = `project_code = '${newPrjFisData.project_code.replace(
      /'/g,
      "''"
    )}'`;
    newPrjFisArray.push(data);
  }
  if (requestData.project_type_rid != undefined) {
    newPrjFisData.project_type_rid =
      requestData.project_type_rid != dbData.project_type_rid
        ? requestData.project_type_rid
        : dbData.project_type_rid;
    let data = `project_type_rid = '${newPrjFisData.project_type_rid}'`;
    newPrjFisArray.push(data);
  }
  if (requestData.fiscal_year != undefined) {
    newPrjFisData.fiscal_year =
      requestData.fiscal_year != dbData.fiscal_year
        ? requestData.fiscal_year
        : dbData.fiscal_year;
    let data = `fiscal_year = ${newPrjFisData.fiscal_year}`;
    newPrjFisArray.push(data);
  }
  if (requestData.project_classification_rid != undefined) {
    newPrjFisData.project_classification_rid =
      requestData.project_classification_rid !=
      dbData.project_classification_rid
        ? requestData.project_classification_rid
        : dbData.project_classification_rid;
    let data = `project_classification_rid = '${newPrjFisData.project_classification_rid}'`;
    newPrjFisArray.push(data);
  }
  if (requestData.project_classification_other != undefined) {
    newPrjFisData.project_classification_other =
      requestData.project_classification_other !=
      dbData.project_classification_other
        ? requestData.project_classification_other
        : dbData.project_classification_other;
    let data = `project_classification_other = '${newPrjFisData.project_classification_other.replace(
      /'/g,
      "''"
    )}'`;
    newPrjFisArray.push(data);
  }
  if (requestData.project_client_group != undefined) {
    newPrjFisData.project_client_group =
      requestData.project_client_group != dbData.project_client_group
        ? requestData.project_client_group
        : dbData.project_client_group;
    let data = `project_client_group = '${newPrjFisData.project_client_group.replace(
      /'/g,
      "''"
    )}'`;
    newPrjFisArray.push(data);
  }
  if (requestData.project_group != undefined) {
    newPrjFisData.project_group =
      requestData.project_group != dbData.project_group
        ? requestData.project_group
        : dbData.project_group;
    let data = `project_group = '${newPrjFisData.project_group.replace(
      /'/g,
      "''"
    )}'`;
    newPrjFisArray.push(data);
  }
  if (requestData.assessment_status != undefined) {
    newPrjFisData.assessment_status =
      requestData.assessment_status != dbData.assessment_status
        ? requestData.assessment_status
        : dbData.assessment_status;
    let data = `assessment_status = '${newPrjFisData.assessment_status.replace(
      /'/g,
      "''"
    )}'`;
    newPrjFisArray.push(data);
  }
  if (requestData.comments != undefined) {
    newPrjFisData.comments =
      requestData.comments != dbData.comments
        ? requestData.comments
        : dbData.comments;
    let data = `comments = '${newPrjFisData.comments.replace(/'/g, "''")}'`;
    newPrjFisArray.push(data);
  }
  if (requestData.total_effort != undefined) {
    newPrjFisData.total_effort_prj =
      requestData.total_effort != dbData.total_effort_prj
        ? requestData.total_effort
        : dbData.total_effort_prj;
    let data =
      newPrjFisData.total_effort_prj == ""
        ? `total_effort_prj = null`
        : `total_effort_prj = ${parseFloat(newPrjFisData.total_effort_prj)}`;
    newPrjFisArray.push(data);
  }
  if (requestData.total_cost != undefined) {
    newPrjFisData.total_cost_prj =
      requestData.total_cost != dbData.total_cost_prj
        ? requestData.total_cost
        : dbData.total_cost_prj;
    let data =
      newPrjFisData.total_cost_prj == ""
        ? `total_cost_prj = null`
        : `total_cost_prj = ${parseFloat(newPrjFisData.total_cost_prj)}`;
    newPrjFisArray.push(data);
  }
  if (requestData.total_cost_fte != undefined) {
    newPrjFisData.total_cost_fte_prj =
      requestData.total_cost_fte != dbData.total_cost_fte_prj
        ? requestData.total_cost_fte
        : dbData.total_cost_fte_prj;
    let data =
      newPrjFisData.total_cost_fte_prj == ""
        ? `total_cost_fte_prj = null`
        : `total_cost_fte_prj = ${parseFloat(
            newPrjFisData.total_cost_fte_prj
          )}`;
    newPrjFisArray.push(data);
  }
  if (requestData.total_cost_subcon != undefined) {
    newPrjFisData.total_cost_subcon_prj =
      requestData.total_cost_subcon != dbData.total_cost_subcon_prj
        ? requestData.total_cost_subcon
        : dbData.total_cost_subcon_prj;
    let data =
      newPrjFisData.total_cost_subcon_prj == ""
        ? `total_cost_subcon_prj = null`
        : `total_cost_subcon_prj = ${parseFloat(
            newPrjFisData.total_cost_subcon_prj
          )}`;
    newPrjFisArray.push(data);
  }
  if (requestData.total_cost_nonlabor != undefined) {
    newPrjFisData.total_cost_nonlabor_prj =
      requestData.total_cost_nonlabor != dbData.total_cost_nonlabor_prj
        ? requestData.total_cost_nonlabor
        : dbData.total_cost_nonlabor_prj;
    let data =
      newPrjFisData.total_cost_nonlabor_prj == ""
        ? `total_cost_nonlabor_prj = null`
        : `total_cost_nonlabor_prj = ${parseFloat(
            newPrjFisData.total_cost_nonlabor_prj
          )}`;
    newPrjFisArray.push(data);
  }
  let data = `modified_by = '${requestData.userId}'`;
  newPrjFisArray.push(data);
  let datas = `modified_datetime = NOW()`;
  newPrjFisArray.push(datas);
  return newPrjFisArray;
};

export const setProjectSummary = (dbData: any, requestData: any) => {
  let newDbPrjSummary: any = {};
  let newDbPrjSummaryArray = [];
  if (requestData.project_name != undefined) {
    newDbPrjSummary.project_name =
      requestData.project_name != dbData.project_name
        ? requestData.project_name
        : dbData.project_name;
    let data = `project_name = '${newDbPrjSummary.project_name.replace(
      /'/g,
      "''"
    )}'`;
    newDbPrjSummaryArray.push(data);
  }
  if (requestData.project_code) {
    newDbPrjSummary.project_code =
      requestData.project_code != dbData.project_code
        ? requestData.project_code
        : dbData.project_code;
    let data = `project_code = '${newDbPrjSummary.project_code.replace(
      /'/g,
      "''"
    )}'`;
    newDbPrjSummaryArray.push(data);
  }
  if (requestData.project_type_rid != undefined) {
    newDbPrjSummary.project_type_rid =
      requestData.project_type_rid != dbData.project_type_rid
        ? requestData.project_type_rid
        : dbData.project_type_rid;
    let data = `project_type_rid = '${newDbPrjSummary.project_type_rid}'`;
    newDbPrjSummaryArray.push(data);
  }
  if (requestData.project_classification_rid != undefined) {
    newDbPrjSummary.project_classification_rid =
      requestData.project_classification_rid !=
      dbData.project_classification_rid
        ? requestData.project_classification_rid
        : dbData.project_classification_rid;
    let data = `project_classification_rid = '${newDbPrjSummary.project_classification_rid}'`;
    newDbPrjSummaryArray.push(data);
  }
  if (requestData.project_classification_other != undefined) {
    newDbPrjSummary.project_classification_other =
      requestData.project_classification_other !=
      dbData.project_classification_other
        ? requestData.project_classification_other
        : dbData.project_classification_other;
    let data = `project_classification_other = '${newDbPrjSummary.project_classification_other.replace(
      /'/g,
      "''"
    )}'`;
    newDbPrjSummaryArray.push(data);
  }
  if (requestData.project_client_group != undefined) {
    newDbPrjSummary.project_client_group =
      requestData.project_client_group != dbData.project_client_group
        ? requestData.project_client_group
        : dbData.project_client_group;
    let data = `project_client_group = '${newDbPrjSummary.project_client_group.replace(
      /'/g,
      "''"
    )}'`;
    newDbPrjSummaryArray.push(data);
  }
  if (requestData.project_group != undefined) {
    newDbPrjSummary.project_group =
      requestData.project_group != dbData.project_group
        ? requestData.project_group
        : dbData.project_group;
    let data = `project_group = '${newDbPrjSummary.project_group.replace(
      /'/g,
      "''"
    )}'`;
    newDbPrjSummaryArray.push(data);
  }
  if (requestData.assessment_status != undefined) {
    newDbPrjSummary.assessment_status =
      requestData.assessment_status != dbData.assessment_status
        ? requestData.assessment_status
        : dbData.assessment_status;
    let data = `assessment_status = '${newDbPrjSummary.assessment_status.replace(
      /'/g,
      "''"
    )}'`;
    newDbPrjSummaryArray.push(data);
  }
  if (requestData.comments != undefined) {
    newDbPrjSummary.comments =
      requestData.comments != dbData.comments
        ? requestData.comments
        : dbData.comments;
    let data = `comments = '${newDbPrjSummary.comments.replace(/'/g, "''")}'`;
    newDbPrjSummaryArray.push(data);
  }
  if (requestData.total_effort != undefined) {
    newDbPrjSummary.total_effort =
      requestData.total_effort != dbData.total_effort
        ? requestData.total_effort
        : dbData.total_effort;
    let data =
      newDbPrjSummary.total_effort == ""
        ? `total_effort = null`
        : `total_effort = ${parseFloat(newDbPrjSummary.total_effort)}`;
    newDbPrjSummaryArray.push(data);
  }
  if (requestData.total_cost != undefined) {
    newDbPrjSummary.total_cost =
      requestData.total_cost != dbData.total_cost
        ? requestData.total_cost
        : dbData.total_cost;
    let data =
      newDbPrjSummary.total_cost == ""
        ? `total_cost = null`
        : `total_cost = ${parseFloat(newDbPrjSummary.total_cost)}`;
    newDbPrjSummaryArray.push(data);
  }
  if (requestData.total_cost_fte != undefined) {
    newDbPrjSummary.total_cost_fte =
      requestData.total_cost_fte != dbData.total_cost_fte
        ? requestData.total_cost_fte
        : dbData.total_cost_fte;
    let data =
      newDbPrjSummary.total_cost_fte == ""
        ? `total_cost_fte = null`
        : `total_cost_fte = ${parseFloat(newDbPrjSummary.total_cost_fte)}`;
    newDbPrjSummaryArray.push(data);
  }
  if (requestData.total_cost_subcon != undefined) {
    newDbPrjSummary.total_cost_subcon =
      requestData.total_cost_subcon != dbData.total_cost_subcon
        ? requestData.total_cost_subcon
        : dbData.total_cost_subcon;
    let data =
      newDbPrjSummary.total_cost_subcon == ""
        ? `total_cost_subcon = null`
        : `total_cost_subcon = ${parseFloat(
            newDbPrjSummary.total_cost_subcon
          )}`;
    newDbPrjSummaryArray.push(data);
  }
  if (requestData.total_cost_nonlabor != undefined) {
    newDbPrjSummary.total_cost_nonlabor =
      requestData.total_cost_nonlabor != dbData.total_cost_nonlabor
        ? requestData.total_cost_nonlabor
        : dbData.total_cost_nonlabor;
    let data =
      newDbPrjSummary.total_cost_nonlabor == ""
        ? `total_cost_nonlabor = null`
        : `total_cost_nonlabor = ${parseFloat(
            newDbPrjSummary.total_cost_nonlabor
          )}`;
    newDbPrjSummaryArray.push(data);
  }
  let data = `modified_by = '${requestData.userId}'`;
  newDbPrjSummaryArray.push(data);
  let datas = `modified_datetime = NOW()`;
  newDbPrjSummaryArray.push(datas);
  return newDbPrjSummaryArray;
};

export const setProjectFiscalSummary = (dbData: any, requestData: any) => {
  let newFisSummary: any = {};
  let newFisSummaryArray = [];
  if (requestData.project_name != undefined) {
    newFisSummary.project_name =
      requestData.project_name !== dbData.project_name
        ? requestData.project_name
        : dbData.project_name;
    let data = `project_name = '${newFisSummary.project_name.replace(
      /'/g,
      "''"
    )}'`;
    newFisSummaryArray.push(data);
  }
  if (requestData.project_code) {
    newFisSummary.project_code =
      requestData.project_code !== dbData.project_code
        ? requestData.project_code
        : dbData.project_code;
    let data = `project_code = '${newFisSummary.project_code.replace(
      /'/g,
      "''"
    )}'`;
    newFisSummaryArray.push(data);
  }
  if (requestData.project_type_rid != undefined) {
    newFisSummary.project_type_rid =
      requestData.project_type_rid !== dbData.project_type_rid
        ? requestData.project_type_rid
        : dbData.project_type_rid;
    let data = `project_type_rid = '${newFisSummary.project_type_rid}'`;
    newFisSummaryArray.push(data);
  }
  if (requestData.project_classification_rid != undefined) {
    newFisSummary.project_classification_rid =
      requestData.project_classification_rid !=
      dbData.project_classification_rid
        ? requestData.project_classification_rid
        : dbData.project_classification_rid;
    let data = `project_classification_rid = '${newFisSummary.project_classification_rid}'`;
    newFisSummaryArray.push(data);
  }
  if (requestData.project_classification_other != undefined) {
    newFisSummary.project_classification_other =
      requestData.project_classification_other !=
      dbData.project_classification_other
        ? requestData.project_classification_other
        : dbData.project_classification_other;
    let data = `project_classification_other = '${newFisSummary.project_classification_other.replace(
      /'/g,
      "''"
    )}'`;
    newFisSummaryArray.push(data);
  }
  if (requestData.project_client_group != undefined) {
    newFisSummary.project_client_group =
      requestData.project_client_group != dbData.project_client_group
        ? requestData.project_client_group
        : dbData.project_client_group;
    let data = `project_client_group = '${newFisSummary.project_client_group.replace(
      /'/g,
      "''"
    )}'`;
    newFisSummaryArray.push(data);
  }
  if (requestData.project_group != undefined) {
    newFisSummary.project_group =
      requestData.project_group != dbData.project_group
        ? requestData.project_group
        : dbData.project_group;
    let data = `project_group = '${newFisSummary.project_group.replace(
      /'/g,
      "''"
    )}'`;
    newFisSummaryArray.push(data);
  }
  if (requestData.assessment_status != undefined) {
    newFisSummary.assessment_status =
      requestData.assessment_status != dbData.assessment_status
        ? requestData.assessment_status
        : dbData.assessment_status;
    let data = `assessment_status = '${newFisSummary.assessment_status.project_code.replace(
      /'/g,
      "''"
    )}'`;
    newFisSummaryArray.push(data);
  }
  if (requestData.comments != undefined) {
    newFisSummary.comments =
      requestData.comments != dbData.comments
        ? requestData.comments
        : dbData.comments;
    let data = `comments = '${newFisSummary.comments.replace(/'/g, "''")}'`;
    newFisSummaryArray.push(data);
  }
  if (requestData.total_effort != undefined) {
    newFisSummary.total_effort_prj =
      requestData.total_effort != dbData.total_effort_prj
        ? requestData.total_effort
        : dbData.total_effort_prj;
    let data =
      newFisSummary.total_effort_prj == ""
        ? `total_effort_prj = null`
        : `total_effort_prj = ${parseFloat(newFisSummary.total_effort_prj)}`;
    newFisSummaryArray.push(data);
  }
  if (requestData.total_cost != undefined) {
    newFisSummary.total_cost_prj =
      requestData.total_cost != dbData.total_cost_prj
        ? requestData.total_cost
        : dbData.total_cost_prj;
    let data =
      newFisSummary.total_cost_prj == ""
        ? `total_cost_prj = null`
        : `total_cost_prj = ${parseFloat(newFisSummary.total_cost_prj)}`;
    newFisSummaryArray.push(data);
  }
  if (requestData.total_cost_fte != undefined) {
    newFisSummary.total_cost_fte_prj =
      requestData.total_cost_fte != dbData.total_cost_fte_prj
        ? requestData.total_cost_fte
        : dbData.total_cost_fte_prj;
    let data =
      newFisSummary.total_cost_fte_prj == ""
        ? `total_cost_fte_prj = null`
        : `total_cost_fte_prj = ${parseFloat(
            newFisSummary.total_cost_fte_prj
          )}`;
    newFisSummaryArray.push(data);
  }
  if (requestData.total_cost_subcon != undefined) {
    newFisSummary.total_cost_subcon_prj =
      requestData.total_cost_subcon != dbData.total_cost_subcon_prj
        ? requestData.total_cost_subcon
        : dbData.total_cost_subcon_prj;
    let data =
      newFisSummary.total_cost_subcon_prj == ""
        ? `total_cost_subcon_prj = null`
        : `total_cost_subcon_prj = ${parseFloat(
            newFisSummary.total_cost_subcon_prj
          )}`;
    newFisSummaryArray.push(data);
  }
  if (requestData.total_cost_nonlabor != undefined) {
    newFisSummary.total_cost_nonlabor_prj =
      requestData.total_cost_nonlabor != dbData.total_cost_nonlabor_prj
        ? requestData.total_cost_nonlabor
        : dbData.total_cost_nonlabor_prj;
    let data =
      newFisSummary.total_cost_nonlabor_prj == ""
        ? `total_cost_nonlabor_prj = null`
        : `total_cost_nonlabor_prj = ${parseFloat(
            newFisSummary.total_cost_nonlabor_prj
          )}`;
    newFisSummaryArray.push(data);
  }
  if (requestData.fiscal_year != undefined) {
    newFisSummary.fiscal_year =
      requestData.fiscal_year != dbData.fiscal_year
        ? requestData.fiscal_year
        : dbData.fiscal_year;
    let data = `fiscal_year = ${newFisSummary.fiscal_year}`;
    newFisSummaryArray.push(data);
  }
  let data = `modified_by = '${requestData.userId}'`;
  newFisSummaryArray.push(data);
  let datas = `modified_datetime = NOW()`;
  newFisSummaryArray.push(datas);
  return newFisSummaryArray;
};

export const setResourceFiscal = (dbData: any, requestData: any) => {
  let newDataArray = [];
  let dataStorage;
  let newData: any = {};

  if (requestData.country_rid != undefined) {
    newData.country_rid =
      requestData.country_rid !== dbData.country_rid
        ? requestData.country_rid
        : dbData.country_rid;
    dataStorage = `country_rid = '${newData.country_rid}'`;
    newDataArray.push(dataStorage);
  }
  if (requestData.region_rid != undefined) {
    newData.region_rid =
      requestData.region_rid !== dbData.country_region_rid
        ? requestData.region_rid
        : dbData.country_region_rid;
    dataStorage = `country_region_rid = '${newData.region_rid}'`;
    newDataArray.push(dataStorage);
  }
  if (requestData.resource_type_rid != undefined) {
    newData.resource_type_rid =
      requestData.resource_type_rid !== dbData.resource_type_rid
        ? requestData.resource_type_rid
        : dbData.resource_type_rid;
    dataStorage = `resource_type_rid = '${newData.resource_type_rid}'`;
    newDataArray.push(dataStorage);
  }
  dataStorage = `modified_datetime = NOW()`;
  newDataArray.push(dataStorage);
  dataStorage = `modified_by = '${requestData.userId}'`;
  newDataArray.push(dataStorage);
  return newDataArray;
};

export const setResourcesData = (dbData: any, requestData: any) => {
  let newDataArray = [];
  let dataStorage;
  let newData: any = {};
  if (requestData.resource_name != undefined) {
    newData.resource_name =
      requestData.resource_name !== dbData.resource_name
        ? requestData.resource_name
        : dbData.resource_name;
    newData.first_name = newData.resource_name.split(" ")[0];
    newData.last_name = newData.resource_name.split(" ")[1];
    dataStorage = `resource_name = '${newData.resource_name.replace(
      /'/g,
      "''"
    )}'`;
    newDataArray.push(dataStorage);
    dataStorage =
      newData.first_name == undefined || newData.first_name == null
        ? `resource_firstname = '${newData.first_name}'`
        : `resource_firstname = '${newData.first_name.replace(/'/g, "''")}'`;
    newDataArray.push(dataStorage);
    dataStorage =
      newData.last_name == undefined || newData.last_name == null
        ? `resource_lastname = null`
        : `resource_lastname = '${newData.last_name.replace(/'/g, "''")}'`;
    newDataArray.push(dataStorage);
  }
  if (requestData.resource_type_rid != undefined) {
    newData.resource_type_rid =
      requestData.resource_type_rid !== dbData.resource_type_rid
        ? requestData.resource_type_rid
        : dbData.resource_type_rid;
    dataStorage = `resource_type_rid = '${newData.resource_type_rid}'`;
    newDataArray.push(dataStorage);
  }
  if (requestData.resource_code != undefined) {
    newData.resource_code =
      requestData.resource_code !== dbData.resource_code
        ? requestData.resource_code
        : dbData.resource_code;
    dataStorage = `resource_code = '${newData.resource_code.replace(
      /'/g,
      "''"
    )}'`;
    newDataArray.push(dataStorage);
  }
  if (requestData.resource_orgname != undefined) {
    newData.resource_orgname =
      requestData.resource_orgname !== dbData.resource_orgname
        ? requestData.resource_orgname
        : dbData.resource_orgname;
    dataStorage = `resource_orgname = '${newData.resource_orgname.replace(
      /'/g,
      "''"
    )}'`;
    newDataArray.push(dataStorage);
  }
  if (requestData.resource_designation != undefined) {
    newData.resource_designation =
      requestData.resource_designation != dbData.resource_designation
        ? requestData.resource_designation
        : dbData.resource_designation;
    dataStorage = `resource_designation = '${newData.resource_designation.replace(
      /'/g,
      "''"
    )}'`;
    newDataArray.push(dataStorage);
  }
  if (requestData.resource_role != undefined) {
    newData.resource_role =
      requestData.resource_role !== dbData.resource_role
        ? requestData.resource_role
        : dbData.resource_role;
    dataStorage = `resource_role = '${newData.resource_role.replace(
      /'/g,
      "''"
    )}'`;
    newDataArray.push(dataStorage);
  }
  if (requestData.region_rid != undefined) {
    newData.region_rid =
      requestData.region_rid !== dbData.region_rid
        ? requestData.region_rid
        : dbData.region_rid;
    dataStorage = `region_rid = '${newData.region_rid}'`;
    newDataArray.push(dataStorage);
  }
  if (requestData.city_rid != undefined) {
    newData.city_rid =
      requestData.city_rid !== dbData.city_rid
        ? requestData.city_rid
        : dbData.city_rid;
    dataStorage = `city_rid = '${newData.city_rid}'`;
    newDataArray.push(dataStorage);
  }
  if (requestData.country_rid != undefined) {
    newData.country_rid =
      requestData.country_rid !== dbData.country_rid
        ? requestData.country_rid
        : dbData.country_rid;
    dataStorage = `country_rid = '${newData.country_rid}'`;
    newDataArray.push(dataStorage);
  }
  if (requestData.status_rid != undefined) {
    newData.status_rid =
      requestData.status_rid !== dbData.status_rid
        ? requestData.status_rid
        : dbData.status_rid;
    dataStorage = `status_rid = '${newData.status_rid}'`;
    newDataArray.push(dataStorage);
  }
  if (requestData.comments != undefined) {
    newData.comments =
      requestData.comments !== dbData.comments
        ? requestData.comments
        : dbData.comments;
    dataStorage = `comments = '${newData.comments.replace(/'/g, "''")}'`;
    newDataArray.push(dataStorage);
  }
  dataStorage = `modified_datetime = NOW()`;
  newDataArray.push(dataStorage);
  dataStorage = `modified_by = '${requestData.userId}'`;
  newDataArray.push(dataStorage);
  return newDataArray;
};

export const setResFiscalForResCost = (dbData: any, requestData: any) => {
  let newData;
  if (requestData.fiscal_year != undefined) {
    newData =
      dbData.fiscal_year != requestData.fiscal_year
        ? requestData.fiscal_year
        : dbData.fiscal_year;
  }
  return newData;
};

export const setResourceCostDatas = (dbData: any, requestData: any) => {
  let newCostData: any = {};
  let dataStorage;
  let newCostDataArray = [];
  if (requestData.fiscal_year != undefined) {
    newCostData.fiscal_year =
      dbData.fiscal_year != requestData.fiscal_year
        ? requestData.fiscal_year
        : dbData.fiscal_year;
    dataStorage = `fiscal_year = ${newCostData.fiscal_year}`;
    newCostDataArray.push(dataStorage);
  }
  if (requestData.currency_rid != undefined) {
    newCostData.currency_rid =
      requestData.currency_rid != dbData.currency_rid
        ? requestData.currency_rid
        : dbData.currency_rid;
    dataStorage = `currency_rid = '${newCostData.currency_rid}'`;
    newCostDataArray.push(dataStorage);
  }
  if (requestData.effective_from != undefined) {
    newCostData.effective_from =
      requestData.effective_from != dbData.effective_from
        ? requestData.effective_from
        : dbData.effective_from;
    dataStorage =
      newCostData.effective_from == ""
        ? `effective_from = null`
        : `effective_from = '${newCostData.effective_from}'`;
    newCostDataArray.push(dataStorage);
  }
  if (requestData.end_date != undefined) {
    newCostData.end_date =
      requestData.end_date != dbData.end_date
        ? requestData.end_date
        : dbData.end_date;
    dataStorage =
      newCostData.end_date == ""
        ? `end_date = null`
        : `end_date = '${newCostData.end_date}'`;
    newCostDataArray.push(dataStorage);
  }
  if (requestData.effort_in_hrs != undefined) {
    newCostData.effort_in_hrs =
      requestData.effort_in_hrs != dbData.effort_in_hrs
        ? requestData.effort_in_hrs
        : dbData.effort_in_hrs;
    dataStorage =
      newCostData.effort_in_hrs == ""
        ? `effort_in_hrs = null`
        : `effort_in_hrs = ${parseFloat(newCostData.effort_in_hrs)}`;
    newCostDataArray.push(dataStorage);
  }
  if (requestData.salary != undefined) {
    newCostData.salary =
      requestData.salary != dbData.salary ? requestData.salary : dbData.salary;
    dataStorage = newCostData.salary =
      requestData.salary == ""
        ? `salary = null`
        : `salary = ${parseFloat(newCostData.salary)}`;
    newCostDataArray.push(dataStorage);
  }
  if (requestData.bonus != undefined) {
    newCostData.bonus =
      requestData.bonus != dbData.bonus ? requestData.bonus : dbData.bonus;
    dataStorage =
      newCostData.bonus == ""
        ? `bonus = null`
        : `bonus = ${parseFloat(newCostData.bonus)}`;
    newCostDataArray.push(dataStorage);
  }
  if (requestData.insurance != undefined) {
    newCostData.insurance =
      requestData.insurance != dbData.insurance
        ? requestData.insurance
        : dbData.insurance;
    dataStorage =
      newCostData.insurance == ""
        ? `insurance = null`
        : `insurance = ${parseFloat(newCostData.insurance)}`;
    newCostDataArray.push(dataStorage);
  }
  if (requestData.deductions != undefined) {
    newCostData.deductions =
      requestData.deductions != dbData.deductions
        ? requestData.deductions
        : dbData.deductions;
    dataStorage =
      newCostData.deductions == ""
        ? `deductions = null`
        : `deductions = ${parseFloat(newCostData.deductions)}`;
    newCostDataArray.push(dataStorage);
  }
  if (requestData.resource_cost != undefined) {
    newCostData.resource_cost =
      requestData.resource_cost != dbData.resource_cost
        ? requestData.resource_cost
        : dbData.resource_cost;
    dataStorage =
      newCostData.resource_cost == ""
        ? `resource_cost = null`
        : `resource_cost = ${parseFloat(newCostData.resource_cost)}`;
    newCostDataArray.push(dataStorage);
  }
  if (requestData.comments != undefined) {
    newCostData.comments =
      requestData.comments != dbData.comments
        ? requestData.comments
        : dbData.comments;
    dataStorage = `comments = '${newCostData.comments}'`;
    newCostDataArray.push(dataStorage);
  }
  if (requestData.status_rid) {
    dataStorage = `status_rid = '${requestData.status_rid}'`;
    newCostDataArray.push(dataStorage);
  }
  if (requestData.net_resource_cost) {
    dataStorage = `net_resource_cost = ${requestData.net_resource_cost}`;
    newCostDataArray.push(dataStorage);
  }
  dataStorage = `modified_by = '${requestData.userId}'`;
  newCostDataArray.push(dataStorage);
  dataStorage = `modified_datetime = NOW()`;
  newCostDataArray.push(dataStorage);
  return newCostDataArray;
};

export const setResourceSkillData = (
  dbData: ResourceSkill,
  requestData: any
) => {
  let newData: any = {};
  let newDataArray = [];
  let dataStorage;
  if (requestData.start_date != undefined) {
    newData.start_date =
      requestData.start_date != dbData.start_date
        ? requestData.start_date
        : dbData.start_date;
    dataStorage =
      newData.start_date == ""
        ? `start_date = null`
        : `start_date = '${newData.start_date}'`;
    newDataArray.push(dataStorage);
  }
  if (requestData.skill_type_rid != undefined) {
    newData.skill_type_rid =
      requestData.skill_type_rid != dbData.skill_type_rid
        ? requestData.skill_type_rid
        : dbData.skill_type_rid;
    dataStorage = `skill_type_rid = '${newData.skill_type_rid}'`;
    newDataArray.push(dataStorage);
  }
  if (requestData.skill_type_others != undefined) {
    newData.skill_type_others =
      requestData.skill_type_others != dbData.skill_type_others
        ? requestData.skill_type_others
        : dbData.skill_type_others;
    dataStorage = `skill_type_others = '${newData.skill_type_others.replace(
      /'/g,
      "''"
    )}'`;
    newDataArray.push(dataStorage);
  }
  if (requestData.skill_subtype_rid != undefined) {
    newData.skill_subtype_rid =
      requestData.skill_subtype_rid != dbData.skill_subtype_rid
        ? requestData.skill_subtype_rid
        : dbData.skill_subtype_rid;
    dataStorage = `skill_subtype_rid = '${newData.skill_subtype_rid}'`;
    newDataArray.push(dataStorage);
  }
  if (requestData.skill_subtype_others != undefined) {
    newData.skill_subtype_others =
      requestData.skill_subtype_others != dbData.skill_subtype_others
        ? requestData.skill_subtype_others
        : dbData.skill_subtype_others;
    dataStorage = `skill_subtype_others = '${newData.skill_subtype_others.replace(
      /'/g,
      "''"
    )}'`;
    newDataArray.push(dataStorage);
  }
  if (requestData.skill_level_rid != undefined) {
    newData.skill_level_rid =
      requestData.skill_level_rid != dbData.skill_level_rid
        ? requestData.skill_level_rid
        : dbData.skill_level_rid;
    dataStorage = `skill_level_rid = '${newData.skill_level_rid}'`;
    newDataArray.push(dataStorage);
  }
  if (requestData.skill_details != undefined) {
    newData.skill_details =
      requestData.skill_details != dbData.skill_details
        ? requestData.skill_details
        : dbData.skill_details;
    dataStorage = `skill_details = '${newData.skill_details.replace(
      /'/g,
      "''"
    )}'`;
    newDataArray.push(dataStorage);
  }
  dataStorage = `modified_by = '${requestData.userId}'`;
  newDataArray.push(dataStorage);
  dataStorage = `modified_datetime = NOW()`;
  newDataArray.push(dataStorage);
  return newDataArray;
};

export async function uploadToAzureBlob(
  file: Express.Multer.File,
  account_id: string,
  flag? : string
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
    const connectionString = await getSecret(
      process.env.AZURE_STORAGE_CONNECTION_STRING as string
    );
    // const connectionString = "storage-account-connection-string";
    // const connectionString = await getSecret("storage-account-connection-string");
    const containerName = "account";

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
    if(flag === "notes"){
      blobName = `${account_id}/notes/${timestamp}-${sanitizedBaseName}${originalExtension}`;
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
      `File upload failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export const setInlineForAttachments = (
  dbData: Attachment,
  requestData: any
) => {
  let newData: any = {};
  let dataStorage;
  let newDataArray = [];
  if (requestData.fiscal_year != undefined) {
    newData.fiscal_year =
      dbData.fiscal_year != requestData.fiscal_year
        ? requestData.fiscal_year
        : dbData.fiscal_year;
    dataStorage = `fiscal_year = ${newData.fiscal_year}`;
    newDataArray.push(dataStorage);
  }
  if (requestData.document_category_rid != undefined) {
    newData.document_category_rid =
      requestData.document_category_rid != dbData.document_category_rid
        ? requestData.document_category_rid
        : dbData.document_category_rid;
    dataStorage = `document_category_rid = '${newData.document_category_rid}'`;
    newDataArray.push(dataStorage);
  }
  if (requestData.document_type_rid != undefined) {
    newData.document_type_rid =
      requestData.document_type_rid != dbData.document_type_rid
        ? requestData.document_type_rid
        : dbData.document_type_rid;
    dataStorage = `document_type_rid = '${newData.document_type_rid}'`;
    newDataArray.push(dataStorage);
  }
  if (requestData.document_category_others != undefined) {
    newData.document_category_others =
      requestData.document_category_others != dbData.document_category_others
        ? requestData.document_category_others
        : dbData.document_category_others;
    dataStorage = `document_category_others = '${newData.document_category_others.replace(
      /'/g,
      "''"
    )}'`;
    newDataArray.push(dataStorage);
  }
  if (requestData.document_type_others != undefined) {
    newData.document_type_others =
      requestData.document_type_others != dbData.document_type_others
        ? requestData.document_type_others
        : dbData.document_type_others;
    dataStorage = `document_type_others = '${newData.document_type_others.replace(
      /'/g,
      "''"
    )}'`;
    newDataArray.push(dataStorage);
  }
  if (requestData.comments != undefined) {
    newData.comments =
      requestData.comments != dbData.comments
        ? requestData.comments
        : dbData.comments;
    dataStorage = `comments = '${newData.comments.replace(/'/g, "''")}'`;
    newDataArray.push(dataStorage);
  }
  if (newDataArray.length < 1) {
    return {
      statusMessage: STATUS_MESSAGE.noDataToUpdate,
      data: newDataArray,
    };
  } else {
    dataStorage = `modified_by = '${requestData.userId}'`;
    newDataArray.push(dataStorage);
    dataStorage = `modified_datetime = NOW()`;
    newDataArray.push(dataStorage);
    return {
      statusMessage: null,
      data: newDataArray,
    };
  }
};

export const validateImportListRequest = (data: any) => {
  if (!data.account_rid) return STATUS_MESSAGE.accountIdMissing;
};
export const validateStagingErrorListRequest = (
  account_rid: string,
  import_rid: string,
  entity_type: string
) => {
  if (!account_rid) return STATUS_MESSAGE.accountIdMissing;
  if (!import_rid) return STATUS_MESSAGE.importIdMissing;
  if (!entity_type) return STATUS_MESSAGE.entityTypeMissing;
};

export const validateLoadErrorListRequest = (
  account_rid: string,
  import_rid: string,
  entity_type: string
) => {
  if (!account_rid) return STATUS_MESSAGE.accountIdMissing;
  if (!import_rid) return STATUS_MESSAGE.importIdMissing;
  if (!entity_type) return STATUS_MESSAGE.entityTypeMissing;
};

export const validateImportListByRidRequest = (
  account_rid: any,
  rid: string
) => {
  if (!rid) return STATUS_MESSAGE.accountIdMissing;
  if (!account_rid) return STATUS_MESSAGE.accountIdMissing;
};

export const setInlineForImports = (dbData: any, requestData: any) => {
  let newData: any = {};
  if (requestData.fiscal_year) {
    newData.fiscal_year =
      requestData.fiscal_year != dbData.fiscal_year
        ? requestData.fiscal_year
        : dbData.fiscal_year;
    return newData;
  } else {
    return null;
  }
};

export const setInlineForProjectTask = (
  dbData: ProjectTask,
  requestData: any
) => {
  let newData: any = {};
  let dataStorage;
  let newDataArray = [];
  if (requestData.fiscal_year != undefined) {
    newData.fiscal_year =
      dbData.fiscal_year != requestData.fiscal_year
        ? requestData.fiscal_year
        : dbData.fiscal_year;
    dataStorage = `fiscal_year = ${newData.fiscal_year}`;
    newDataArray.push(dataStorage);
  }
  if (requestData.total_hours_pro_task != undefined) {
    newData.total_hours_pro_task =
      requestData.total_hours_pro_task != dbData.total_hours_pro_task
        ? requestData.total_hours_pro_task
        : dbData.total_hours_pro_task;
    dataStorage = `total_hours_pro_task = ${newData.total_hours_pro_task}`;
    newDataArray.push(dataStorage);
  }
  if (requestData.total_cost_pro_task != undefined) {
    newData.total_cost_pro_task =
      requestData.total_cost_pro_task != dbData.total_cost_pro_task
        ? requestData.total_cost_pro_task
        : dbData.total_cost_pro_task;
    dataStorage = `total_cost_pro_task = ${newData.total_cost_pro_task}`;
    newDataArray.push(dataStorage);
  }
  if (requestData.country_rid != undefined) {
    newData.country_rid =
      requestData.country_rid != dbData.country_rid
        ? requestData.country_rid
        : dbData.country_rid;
    dataStorage = `country_rid = '${newData.country_rid}'`;
    newDataArray.push(dataStorage);
  }
  if (requestData.region_rid != undefined) {
    newData.region_rid =
      requestData.region_rid != dbData.region_rid
        ? requestData.region_rid
        : dbData.region_rid;
    dataStorage = `region_rid = '${newData.region_rid}'`;
    newDataArray.push(dataStorage);
  }
  if (requestData.resource_rid != undefined) {
    newData.resource_rid =
      requestData.resource_rid != dbData.resource_rid
        ? requestData.resource_rid
        : dbData.resource_rid;
    dataStorage = `resource_rid = '${newData.resource_rid}'`;
    newDataArray.push(dataStorage);
  }
  if (requestData.comments != undefined) {
    newData.comments =
      requestData.comments != dbData.comments
        ? requestData.comments
        : dbData.comments;
    dataStorage = `comments = '${newData.comments.replace(/'/g, "''")}'`;
    newDataArray.push(dataStorage);
  }
  if (requestData.start_date != undefined) {
    newData.start_date =
      requestData.start_date != dbData.start_date
        ? requestData.start_date
        : dbData.start_date;
    dataStorage =
      newData.start_date == ""
        ? `start_date = null`
        : `start_date = '${newData.start_date}'`;
    newDataArray.push(dataStorage);
  }
  if (requestData.end_date != undefined) {
    newData.end_date =
      requestData.end_date != dbData.end_date
        ? requestData.end_date
        : dbData.end_date;
    dataStorage =
      newData.end_date == ""
        ? `end_date = null`
        : `end_date = '${newData.end_date}'`;
    newDataArray.push(dataStorage);
  }
  if (requestData.status_rid) {
    newData.status_rid =
      requestData.status_rid != dbData.status_rid
        ? requestData.status_rid
        : dbData.status_rid;
    dataStorage = `status_rid = '${newData.status_rid}'`;
    newDataArray.push(dataStorage);
  }
  if (requestData.task_name != undefined) {
    newData.task_name = requestData.task_name;
    dataStorage = `task_name = '${newData.task_name}'`;
    newDataArray.push(dataStorage);
  }
  if (requestData.task_description != undefined) {
    newData.task_description = requestData.task_description;
    dataStorage = `task_description = '${newData.task_description}'`;
    newDataArray.push(dataStorage);
  }
  if (requestData.task_classification_rid != undefined) {
    newData.task_classification_rid = requestData.task_classification_rid;
    dataStorage = `task_classification_rid = '${newData.task_classification_rid}'`;
    newDataArray.push(dataStorage);
  }
  if (requestData.task_type_rid != undefined) {
    newData.task_type_rid = requestData.task_type_rid;
    dataStorage = `task_type_rid = '${newData.task_type_rid}'`;
    newDataArray.push(dataStorage);
  }

  if (newDataArray.length < 1) {
    return {
      statusMessage: STATUS_MESSAGE.noDataToUpdate,
      data: newDataArray,
    };
  } else {
    dataStorage = `modified_by = '${requestData.userId}'`;
    newDataArray.push(dataStorage);
    dataStorage = `modified_datetime = NOW()`;
    newDataArray.push(dataStorage);
    return {
      statusMessage: null,
      data: newDataArray,
    };
  }
};

export const validateAccountSettingRequest = (data: any) => {
  if (!data.account_rid) return STATUS_MESSAGE.accountIdMissing;
  if (typeof data.autosend_interaction !== "boolean")
    return STATUS_MESSAGE.autoSendMissing;
  if (typeof data.max_ai_interactions !== "number")
    return STATUS_MESSAGE.maxAiMissing;
  if (typeof data.auto_access_rd !== "boolean")
    return STATUS_MESSAGE.autoAccessmentMissing;

  if (data.support_email) {
    if (typeof data.support_email !== "string" || !data.support_email.trim()) {
      return STATUS_MESSAGE.emailMissing;
    }

    if (
      !data.tenant_id ||
      typeof data.tenant_id !== "string" ||
      data.tenant_id.length !== 36
    ) {
      return STATUS_MESSAGE.tenantIdInvalidLength;
    }

    if (
      !data.client_id ||
      typeof data.client_id !== "string" ||
      data.client_id.length !== 36
    ) {
      return STATUS_MESSAGE.clientIdInvalidLength;
    }

    if (
      !data.client_secret ||
      typeof data.client_secret !== "string" ||
      data.client_secret.length < 20
    ) {
      return STATUS_MESSAGE.clientSecretTooShort;
    }
  }
};

export const validateProjectSettingRequest = (data: any) => {
  if (!data.account_rid) return STATUS_MESSAGE.accountIdMissing;
  if (!data.project_rid) return STATUS_MESSAGE.projectIdMissing;
  if (!data.project_fiscal_rid) return STATUS_MESSAGE.fiscalIdMissing;
  if (typeof data.autosend_interaction !== "boolean")
    return STATUS_MESSAGE.autoSendMissing;
  if (typeof data.max_ai_interactions !== "number")
    return STATUS_MESSAGE.maxAiMissing;
};

export async function encryptClientSecret(text: string): Promise<string> {
  const encryptClientSecret = await getSecret(
    process.env.CLIENT_SECRET_ENCRYPTION_KEY!
  );

  if (!encryptClientSecret) {
    throw new Error("Invalid Client Encryption Key");
  }

  const ENCRYPTION_KEY = encryptClientSecret!;
  const IV_LENGTH = parseInt(
    process.env.CLIENT_SECRET_ENCRYPTION_LENGTH || "16",
    10
  );

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY),
    iv
  );
  let encrypted = cipher.update(text);

  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return iv.toString("hex") + ":" + encrypted.toString("hex");
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

export async function uploadEntityTemplatesToAzureBlob(
  file: Express.Multer.File,
  templateId: string
): Promise<{
  url: string;
  name: string;
  extension: string;
  size: number;
}> {
  try {
    if (!file) {
      throw new Error("File is required");
    }

    // Get connection string from secrets manager
    const connectionString = await getSecret(
      process.env.AZURE_STORAGE_CONNECTION_STRING as string
    );
    // const connectionString = "storage-account-connection-string";
    // const connectionString = await getSecret("storage-account-connection-string");
    const containerName = "templates";

    if (!connectionString) {
      throw new Error("Azure storage connection string is required");
    }

    // Create clients
    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Ensure container exists with public blob access
    await containerClient.createIfNotExists({
      access: "blob", // This makes blobs publicly readable
    });

    // Sanitize filename and remove extension
    // Process filename
    const originalExtension = file.originalname.includes(".")
      ? file.originalname.substring(file.originalname.lastIndexOf("."))
      : "";
    const baseName = file.originalname.replace(/\.[^/.]+$/, ""); // Remove extension
    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9\-_]/g, ""); // More strict sanitization

    // Create unique blob name with timestamp
    const timestamp = Date.now();
    const blobName = `${templateId}/templates/${timestamp}-${sanitizedBaseName}${originalExtension}`;

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Upload file with content type
    const uploadOptions = {
      blobHTTPHeaders: {
        blobContentType: file.mimetype || "application/octet-stream",
      },
    };

    await blockBlobClient.uploadData(file.buffer, uploadOptions);

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
      `File upload failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export const setInlineForNotes = (
  dbData: Notes,
  requestData: any
) => {
  let newData: any = {};
  let dataStorage;
  let newDataArray = [];
  if (requestData.fiscal_year != undefined) {
    newData.fiscal_year =
      dbData.fiscal_year != requestData.fiscal_year
        ? requestData.fiscal_year
        : dbData.fiscal_year;
    dataStorage = `fiscal_year = ${newData.fiscal_year}`;
    newDataArray.push(dataStorage);
  }
  if (requestData.title != undefined) {
    newData.title =
      requestData.title != dbData.title
        ? requestData.title
        : dbData.title;
    dataStorage = `title = '${newData.title.replace(
      /'/g,
      "''"
    )}'`;
    newDataArray.push(dataStorage);
  }
  if (requestData.notes_owner != undefined) {
    newData.notes_owner =
      requestData.notes_owner != dbData.notes_owner
        ? requestData.notes_owner
        : dbData.notes_owner;
    dataStorage = `notes_owner = '${newData.notes_owner.replace(
      /'/g,
      "''"
    )}'`;
    newDataArray.push(dataStorage);
  }
  if (requestData.descriptions != undefined) {
    newData.descriptions =
      requestData.descriptions != dbData.descriptions
        ? requestData.descriptions
        : dbData.descriptions;
    dataStorage = `descriptions = '${newData.descriptions.replace(
      /'/g,
      "''"
    )}'`;
    newDataArray.push(dataStorage);
  }
  if (newDataArray.length < 1) {
    return {
      statusMessage: STATUS_MESSAGE.noDataToUpdate,
      data: newDataArray,
    };
  } else {
    dataStorage = `modified_by = '${requestData.userId}'`;
    newDataArray.push(dataStorage);
    dataStorage = `modified_datetime = NOW()`;
    newDataArray.push(dataStorage);
    return {
      statusMessage: null,
      data: newDataArray,
    };
  }
};

export const validateNotesInput = (data: any) => {
  if (!data.account_rid) return STATUS_MESSAGE.accountIdMissing;
  if (!data.rid) return STATUS_MESSAGE.notesIdMissing;
};

export async function deleteFromAzureBlob(blobUrl: string): Promise<void> {
  if (!blobUrl) return;

 const connectionString = await getSecret(
      process.env.AZURE_STORAGE_CONNECTION_STRING as string
    );
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