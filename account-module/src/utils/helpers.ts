import Joi from "joi";
import { Request, Response } from "express";
import { HttpStatus, rawQueries, STATUS_MESSAGE } from "./constant";
import { errorResponse, successResponse } from "./apiResponse";
import configurations from "../config/config";
import ExcelJS from 'exceljs';
import { getSecret } from "../utils/azureSecrets";
import { Sequelize } from "sequelize";
import crypto from "crypto";
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  SASProtocol
} from "@azure/storage-blob";
import { parse } from "url";

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
    if (isMultipart ) {
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

export async function uploadToAzureBlob(file: Express.Multer.File,account_id:string, account_number: string): Promise<string> {
  const connectionString =  await getSecret(process.env.AZURE_STORAGE_CONNECTION_STRING as string);
  const containerName = account_number.toLowerCase();
  
  const connString =  connectionString;
  if (!connString) throw new Error('Azure storage connection string is required');
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);
  await containerClient.createIfNotExists()

  const blobName = `${account_id}/logo/${file.originalname}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  
  await blockBlobClient.uploadData(file.buffer, {
    blobHTTPHeaders: { blobContentType: file.mimetype }
  });

  return blockBlobClient.url;
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
  logMessage
  } else {
    logMessage(`Blob not found: ${blobUrl}`);
  }
}

export async function generateSasUrl(blobUrl: string, expiryMinutes = 60): Promise<string> {
  try {
    const connectionString = await getSecret(process.env.AZURE_STORAGE_CONNECTION_STRING as string);
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

type ColumnSchema = {
  column_name: string;
  data_type: string;
  required:boolean;
};

export function getTableSchemaByEntity(entity: string): ColumnSchema[] {
  switch (entity) {
    case 'resource':
      return [
        { column_name: 'resource_id', data_type: 'String' ,required:true},
        { column_name: 'resource_name', data_type: 'String' ,required:false},
        { column_name: 'resource_type', data_type: 'ENUM' ,required:true},
        { column_name: 'resource_organization', data_type: 'String',required:false },
        { column_name: 'resource_designation', data_type: 'String',required:false },
        { column_name: 'resource_role', data_type: 'String',required:false },
        { column_name: 'total_experience', data_type: 'Integer',required:false },
        { column_name: 'resource_start_date', data_type: 'Date' ,required:false},
        { column_name: 'resource_end_date', data_type: 'Date',required:false },
        { column_name: 'resource_country', data_type: 'String' ,required:false},
        { column_name: 'resource_state_province', data_type: 'String',required:false },
        { column_name: 'resource_city', data_type: 'String',required:false},
        { column_name: 'years_in_organization', data_type: 'Integer',required:false },
        { column_name: 'comments', data_type: 'text',required:false },
      ];

    case 'resource_cost':
      return [
        { column_name: 'resource_id', data_type: 'String', required:true},
        { column_name: 'resource_name', data_type: 'String' ,required:false},
        { column_name: 'resource_type', data_type: 'ENUM',required:true },
        { column_name: 'resource_organization', data_type: 'String' ,required:false},
        { column_name: 'currency', data_type: 'String',required:false },
        { column_name: 'start_date', data_type: 'Date' ,required:false},
        { column_name: 'end_date', data_type: 'Date',required:false },
        { column_name: 'effort_in_hours', data_type: 'Decimal(18,2)',required:false },
        { column_name: 'salary', data_type: 'Decimal(18,2)' ,required:false},
        { column_name: 'bonus', data_type: 'Decimal(18,2)',required:false },
        { column_name: 'insurance', data_type: 'Decimal(18,2)' ,required:false},
        { column_name: 'deductions', data_type: 'Decimal(18,2)' ,required:false},
        { column_name: 'resource_cost', data_type: 'Decimal(18,2)',required:false },
        { column_name: 'comments', data_type: 'text',required:false }
      ];
    case 'project_task':
      return [
        { column_name: 'project_id', data_type: 'String', required:true},
        { column_name: 'project_name', data_type: 'String' ,required:false},
        { column_name: 'project_description', data_type: 'String',required:false },
        { column_name: 'resource_id', data_type: 'String' ,required:true},
        { column_name: 'resource_name', data_type: 'String',required:false },
        { column_name: 'resource_type', data_type: 'ENUM' ,required:false},
        { column_name: 'resource_designation', data_type: 'String',required:false },
        { column_name: 'resource_role', data_type: 'String',required:false },
        { column_name: 'total_experience', data_type: 'Integer' ,required:false},
        { column_name: 'task_start_date', data_type: 'Date',required:true },
        { column_name: 'task_end_date', data_type: 'Date',required:false },
        { column_name: 'total_hours', data_type: 'Decimal(18,2)' ,required:true},
        { column_name: 'total_cost', data_type: 'Decimal(18,2)' ,required:false},
        { column_name: 'resource_task_description', data_type: 'String',required:false },
        { column_name: 'resource_city', data_type: 'String',required:false },
        { column_name: 'resource_state_province', data_type: 'String',required:false },
        { column_name: 'resource_country', data_type: 'String',required:false },
        { column_name: 'project_type', data_type: 'ENUM' ,required:false}
      ];

    case 'resource_skill':
      return [
        { column_name: 'resource_id', data_type: 'String' ,required:true},
        { column_name: 'resource_name', data_type: 'String' ,required:false},
        { column_name: 'resource_type', data_type: 'ENUM',required:true },
        { column_name: 'start_date', data_type: 'Date',required:false },
        { column_name: 'skill_type', data_type: 'ENUM',required:true },
        { column_name: 'skill_subtype', data_type: 'String',required:false },
        { column_name: 'skill_details', data_type: 'String',required:false },
        { column_name: 'skill_level', data_type: 'String',required:false },
        { column_name: 'comments', data_type: 'text',required:false },
      ];

    case 'project':
      return [
        { column_name: 'project_id', data_type: 'String',required:true },
        { column_name: 'project_name', data_type: 'String' ,required:false},
        { column_name: 'project_description', data_type: 'String',required:false },
        { column_name: 'total_hours', data_type: 'Decimal(18,2)' ,required:false},
        { column_name: 'total_cost', data_type: 'Decimal(18,2)',required:false },
        { column_name: 'point_of_contact', data_type: 'String' ,required:false},
        { column_name: 'point_of_contact_email', data_type: 'email' ,required:false},
        { column_name: 'start_date', data_type: 'Date',required:false },
        { column_name: 'end_date', data_type: 'Date' ,required:false},
        { column_name: 'detailed_description', data_type: 'String',required:false },
        { column_name: 'currency', data_type: 'String',required:false },
        { column_name: 'industry', data_type: 'String',required:false },
        { column_name: 'program_name', data_type: 'String',required:false },
        { column_name: 'client_organization', data_type: 'String',required:false },
        { column_name: 'country', data_type: 'String',required:false },
        { column_name: 'city', data_type: 'String' ,required:false},
        { column_name: 'region', data_type: 'String' ,required:false},
        { column_name: 'project_manager', data_type: 'String' ,required:false},
        { column_name: 'project_lead', data_type: 'String',required:false },
        { column_name: 'project_tech_poc_name', data_type: 'String',required:false },
        { column_name: 'project_tech_poc_email', data_type: 'email',required:false },
        { column_name: 'project_type', data_type: 'String' ,required:true},
        { column_name: 'project_classification', data_type: 'String',required:false },
        { column_name: 'project_client_group', data_type: 'String',required:false },
        { column_name: 'project_group', data_type: 'String',required:false },
        { column_name: 'total_fte_count', data_type: 'Integer',required:false },
        { column_name: 'total_sub_con_count', data_type: 'Integer',required:false },
        { column_name: 'total_fte_effort_in_hrs', data_type: 'Decimal(18,2)',required:false },
        { column_name: 'total_fte_cost', data_type: 'Decimal(18,2)',required:false },
        { column_name: 'total_sub_con_effort_in_hrs', data_type: 'Decimal(18,2)',required:false },
        { column_name: 'total_sub_con_cost', data_type: 'Decimal(18,2)',required:false },
        { column_name: 'total_non_labor_cost', data_type: 'Decimal(18,2)',required:false },
        { column_name: 'total_non_labor_count', data_type: 'Decimal(18,2)',required:false },
      ];

    case 'project_resource':
      return [
        { column_name: 'project_id', data_type: 'String',required:true },
        { column_name: 'project_name', data_type: 'String',required:false },
        { column_name: 'project_description', data_type: 'String',required:false },
        { column_name: 'resource_id', data_type: 'UUID' ,required:true},
        { column_name: 'resource_name', data_type: 'String' ,required:false},
        { column_name: 'resource_type', data_type: 'ENUM' ,required:true},
        { column_name: 'resource_designation', data_type: 'String',required:false },
        { column_name: 'resource_role', data_type: 'String' ,required:false},
        { column_name: 'start_date', data_type: 'Date' ,required:false},
        { column_name: 'end_date', data_type: 'Date',required:false },
        { column_name: 'total_experience', data_type: 'Integer',required:false },
        { column_name: 'total_hours', data_type: 'Decimal(18,2)' ,required:true},
        { column_name: 'total_cost', data_type: 'Decimal(18,2)',required:false },
        { column_name: 'project_resource_description', data_type: 'String',required:false },
        { column_name: 'resource_city', data_type: 'String' ,required:false},
        { column_name: 'resource_state_province', data_type: 'String' ,required:false},
        { column_name: 'resource_country', data_type: 'String',required:false },
        { column_name: 'currency', data_type: 'String',required:false },
      ];

    default:
      throw new Error(`Unsupported entity type: ${entity}`);
  }
}

export const validateInlineEditPayload = (data : any) => {
  if(!data.account_rid) return STATUS_MESSAGE.accountIdMissing
}

  export const setInlineValues = (dbData : any, requestData : any, dbDataDetails : any) => {
    let newDbData : any = {};
    let newDbAccDetailsData : any = {}
    if(requestData.organisation_name != undefined) {
      newDbData.organisation_name = requestData.organisation_name !== dbData.organisation_name ? requestData.organisation_name : dbData.organisation_name
      newDbData.organisation_name = newDbData.organisation_name == null ? '' : newDbData.organisation_name.replace(/'/g, "''")
    }
    if(requestData.finance_lead) {
      newDbData.finance_lead = requestData.finance_lead !== dbData.finance_lead ? requestData.finance_lead : dbData.finance_lead
      newDbData.finance_lead = newDbData.finance_lead == null ? '' : newDbData.finance_lead.replace(/'/g, "''")
    }
      
    if(requestData.finance_executive != undefined) {
      newDbData.finance_executive = requestData.finance_executive !== dbData.finance_executive ? requestData.finance_executive : dbData.finance_executive
      newDbData.finance_executive = newDbData.finance_executive == null ? '' : newDbData.finance_executive.replace(/'/g, "''")
    }
      
    if(requestData.professional_services_consultant != undefined) {
      newDbData.professional_services_consultant = requestData.professional_services_consultant !== dbData.professional_services_consultant ? requestData.professional_services_consultant : dbData.professional_services_consultant
      newDbData.professional_services_consultant = newDbData.professional_services_consultant == null ? '' : newDbData.professional_services_consultant.replace(/'/g, "''")
    }
      
    if(requestData.account_name != undefined) {
      newDbData.account_name = requestData.account_name !== dbData.account_name ? requestData.account_name : dbData.account_name
      newDbData.account_name = newDbData.account_name == null ? '' : newDbData.account_name.replace(/'/g, "''")
    }
    if(requestData.comments != undefined) {
      newDbData.comments = requestData.comments !== dbData.comments ? requestData.comments : dbData.comments
      newDbData.comments = newDbData.comments == null ? '' : newDbData.comments.replace(/'/g, "''")
    } 
      
    if(requestData.status_rid != undefined)
      newDbData.status_rid = requestData.status_rid !== dbData.status_rid ? requestData.status_rid : dbData.status_rid
    if(typeof requestData.is_parent == 'boolean')
      newDbData.is_parent = requestData.is_parent !== dbData.is_parent ? requestData.is_parent : dbData.is_parent
    if(requestData.parent_account_rid != undefined)
      newDbData.parent_account_rid = requestData.parent_account_rid !== dbData.parent_account_rid ? requestData.parent_account_rid : dbData.parent_account_rid
    if(requestData.account_name != undefined) {
      newDbAccDetailsData.account_name = requestData.account_name !== dbDataDetails.account_name ? requestData.account_name : dbDataDetails.account_name
      newDbAccDetailsData.account_name = newDbAccDetailsData.account_name == null ? '' : newDbAccDetailsData.account_name.replace(/'/g, "''")
    }
      
    if(requestData.max_ai_interactions != undefined)
      newDbAccDetailsData.max_ai_interactions = requestData.max_ai_interactions !== dbDataDetails.max_ai_interactions ? requestData.max_ai_interactions : dbDataDetails.max_ai_interactions
    if(typeof requestData.autosend_interaction == 'boolean')
      newDbAccDetailsData.autosend_interaction = requestData.autosend_interaction !== dbDataDetails.autosend_interaction ? requestData.autosend_interaction : dbDataDetails.autosend_interaction
    if(requestData.fiscal_start_date != undefined)
      newDbAccDetailsData.fiscal_start_date = requestData.fiscal_start_date !== dbDataDetails.fiscal_start_date ? requestData.fiscal_start_date : dbDataDetails.fiscal_start_date
    if(requestData.fiscal_end_date != undefined)
      newDbAccDetailsData.fiscal_end_date = requestData.fiscal_end_date !== dbDataDetails.fiscal_end_date ? requestData.fiscal_end_date : dbDataDetails.fiscal_end_date
    if(requestData.blended_rate_fte != undefined)
      newDbAccDetailsData.blended_rate_fte = requestData.blended_rate_fte !== dbDataDetails.blended_rate_fte ? requestData.blended_rate_fte : dbDataDetails.blended_rate_fte
    if(requestData.blended_rate_subcon != undefined)
      newDbAccDetailsData.blended_rate_subcon = requestData.blended_rate_subcon !== dbDataDetails.blended_rate_subcon ? requestData.blended_rate_subcon : dbDataDetails.blended_rate_subcon
    if(requestData.industry_rid != undefined)
      newDbData.industry_rid = requestData.industry_rid !== dbData.industry_rid ? requestData.industry_rid : dbData.industry_rid
    if(requestData.industry_name_other != undefined) {
      newDbData.industry_name_other = requestData.industry_name_other !== dbData.industry_name_other ? requestData.industry_name_other : dbData.industry_name_other
      newDbData.industry_name_other = newDbData.industry_name_other == null ? '' : newDbData.industry_name_other.replace(/'/g, "''")
    }
    if(requestData.website != undefined) {
      newDbAccDetailsData.website = requestData.website !== dbDataDetails.website ? requestData.website : dbDataDetails.website
      newDbAccDetailsData.website = newDbAccDetailsData.website == null ? '' : newDbAccDetailsData.website.replace(/'/g, "''")
    }
    if(requestData.annual_revenue != undefined) {
      newDbData.annual_revenue = requestData.annual_revenue !== dbData.annual_revenue ? requestData.annual_revenue : dbData.annual_revenue
      newDbData.annual_revenue = newDbData.annual_revenue == null ? '' : newDbData.annual_revenue.replace(/'/g, "''")
    }
    if(requestData.business_details != undefined) {
      newDbAccDetailsData.business_details = requestData.business_details !== dbDataDetails.business_details ? requestData.business_details : dbDataDetails.business_details
      newDbAccDetailsData.business_details = newDbAccDetailsData.business_details == null ? '' : newDbAccDetailsData.business_details.replace(/'/g, "''")
    }
    if(requestData.country_rid != undefined) {
       newDbData.country_rid = requestData.country_rid !== dbData.country_rid ? requestData.country_rid : dbData.country_rid
       newDbData.region_rid = requestData.country_rid != dbData.country_rid ? null : dbData.region_rid
    }
    if(requestData.currency_rid != undefined)
      newDbData.currency_rid = requestData.currency_rid !== dbData.currency_rid ? requestData.currency_rid : dbData.currency_rid
    
    if(Object.keys(newDbData).length == 0 && Object.keys(newDbAccDetailsData).length == 0) {
      return {
        newDbData, newDbAccDetailsData
      }
    } else {
      newDbData.modified_by = requestData.userId
      newDbAccDetailsData.modified_by = requestData.userId
      newDbData.modified_datetime = new Date().toISOString()
      newDbAccDetailsData.modified_datetime = `NOW()`
      return {
        newDbData, newDbAccDetailsData
      }
    }
  }

  export const setKeyContact = (dbData : any, d : any) => {
    let setKeyData : any = {}
      if(d.key_contact_name)
        setKeyData.key_contact_name = d.key_contact_name != dbData.key_contact_name ? d.key_contact_name : dbData.key_contact_name
      if(d.key_contact_email)
        setKeyData.key_contact_email = d.key_contact_email !== dbData.key_contact_email ? d.key_contact_email : dbData.key_contact_email
      if(d.key_contact_role)
        setKeyData.key_contact_role = d.key_contact_role !== dbData.key_contact_role ? d.key_contact_role : dbData.key_contact_role
      if(typeof d.is_primary_contact == 'boolean')
        setKeyData.is_primary_contact = d.is_primary_contact !== dbData.is_primary_contact ? d.is_primary_contact : dbData.is_primary_contact
      if(typeof d.interaction_cc_recipient == 'boolean')
        setKeyData.interaction_cc_recipient = d.interaction_cc_recipient !== dbData.interaction_cc_recipient ? d.interaction_cc_recipient : dbData.interaction_cc_recipient
      if(d.status_rid)
        setKeyData.status_rid = d.status_rid !== dbData.status_rid ? d.status_rid : dbData.status_rid
      
      setKeyData.modified_by = d.userId
      return setKeyData
  }

  export const setAccountDetails = async (accDetailsData : any, schemaName : string, accountRid : string, sequelize : Sequelize) => {
    let account_name;
    let max_ai_interactions;
    let autosend_interaction;
    let fiscal_start_date;
    let fiscal_end_date;
    let blended_rate_fte;
    let blended_rate_subcon;
    let website;
    let modifiedBy;
    let modifiedDatetime;
    let updatedColumns: any = []
    if (accDetailsData.account_name != undefined) {
        account_name = accDetailsData.account_name
        let name = `account_name = '${account_name.replace(/'/g, "''")}'`
        updatedColumns.push(name)
    }
    if (accDetailsData.max_ai_interactions !== undefined) {
        max_ai_interactions = accDetailsData.max_ai_interactions
        let max_ai = `max_ai_interactions = ${max_ai_interactions}`
        updatedColumns.push(max_ai)
    }
    if (accDetailsData.autosend_interaction !== undefined) {
        autosend_interaction = accDetailsData.autosend_interaction
        let autosend = `autosend_interaction = ${autosend_interaction}`
        updatedColumns.push(autosend)
    }
    if (accDetailsData.fiscal_start_date !== undefined) {
        fiscal_start_date = accDetailsData.fiscal_start_date
        let fiscal = `fiscal_start_date = '${fiscal_start_date}'`
        updatedColumns.push(fiscal)
    }
    if (accDetailsData.fiscal_end_date !== undefined) {
        fiscal_end_date = accDetailsData.fiscal_end_date
        let fiscal = `fiscal_end_date = '${fiscal_end_date}'`
        updatedColumns.push(fiscal)
    }
    if (accDetailsData.blended_rate_fte !== undefined) {
        blended_rate_fte = accDetailsData.blended_rate_fte
        let blended = `blended_rate_fte = ${blended_rate_fte}`
        updatedColumns.push(blended)
    }
    if (accDetailsData.blended_rate_subcon !== undefined) {
        blended_rate_subcon = accDetailsData.blended_rate_subcon
        let blended = `blended_rate_subcon = ${blended_rate_subcon}`
        updatedColumns.push(blended)
    }
    if (accDetailsData.website !== undefined) {
        website = accDetailsData.website
        let web = `website = '${website.replace(/'/g, "''")}'`
        updatedColumns.push(web)
    }
    if (accDetailsData.modified_by !== undefined) {
        modifiedBy = accDetailsData.modified_by
        let data = `modified_by = '${modifiedBy}'`
        updatedColumns.push(data)
    }
    if (accDetailsData.modified_datetime !== undefined) {
        modifiedDatetime = accDetailsData.modified_datetime
        let data = `modified_datetime = NOW()`
        updatedColumns.push(data)
    }
    if (updatedColumns.length > 0) {
        let accDetailsQuery = rawQueries.updateAccDetails(schemaName, updatedColumns, accountRid)
        await sequelize.query(accDetailsQuery)
    }
  }

  export const setKeyContactData = async (data : any, sequelize : Sequelize, schemaName : string, ) => {
    let key_contact_name
    let key_contact_email
    let key_contact_role
    let is_primary_contact
    let interaction_cc_recipient
    let status_rid
    let modified_by
    let updatedKeyData: any = []
    for (let d of data.key_contacts) {
        if (d.rid == undefined || d.rid == '') {
            return {
                statusCode: HttpStatus.BAD_REQUEST,
                statusMessage: STATUS_MESSAGE.keyContactIdMissing
            }
        }
        let dbKeyContactData: any = await sequelize.query(rawQueries.fetchKeyContactDetailsByRid(schemaName, d.rid))
        if (dbKeyContactData[0].length > 0) {
            let setDataResult = setKeyContact(dbKeyContactData[0][0], d)
            if (setDataResult.key_contact_name !== undefined) {
                key_contact_name = setDataResult.key_contact_name
                let name = `key_contact_name = '${key_contact_name}'`
                updatedKeyData.push(name)
            }
            if (setDataResult.key_contact_email !== undefined) {
                key_contact_email = setDataResult.key_contact_email
                let email = `key_contact_email = '${key_contact_email}'`
                updatedKeyData.push(email)
            }
            if (setDataResult.key_contact_role !== undefined) {
                key_contact_role = setDataResult.key_contact_role
                let role = `key_contact_role = '${key_contact_role}'`
                updatedKeyData.push(role)
            }
            if (setDataResult.is_primary_contact !== undefined) {
                is_primary_contact = setDataResult.is_primary_contact
                let primary = `is_primary_contact = ${is_primary_contact}`
                updatedKeyData.push(primary)
            }
            if (setDataResult.interaction_cc_recipient !== undefined) {
                interaction_cc_recipient = setDataResult.interaction_cc_recipient
                let recipient = `interaction_cc_recipient = ${interaction_cc_recipient}`
                updatedKeyData.push(recipient)
            }
            if (setDataResult.status_rid !== undefined) {
                status_rid = setDataResult.status_rid
                let status = `status_rid = '${status_rid}'`
                updatedKeyData.push(status)
            }
            if (setDataResult.modified_by !== undefined) {
                modified_by = setDataResult.modified_by
                let status = `modified_by = '${modified_by}'`
                updatedKeyData.push(status)
            }
            await sequelize.query(rawQueries.updateKeyContactDetails(schemaName, updatedKeyData, dbKeyContactData[0][0].rid))
        }
    }
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