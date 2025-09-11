import { Request, Response } from "express";
import { HttpStatus, interactionFieldMappings, interactionSource, STATUS_MESSAGE, techSummaryFieldMappings } from "../utils/constants";
import {
  deleteFromAzureBlob,
  errorLog,
  formatToLocalTime,
  generateExcelBase64,
  handleCustomResponse,
  handleErrorResponse,
  handleSuccessResponse,
  isValidTimezone,
  successLog,
  uploadToAzureBlob,
  validateRequest,
} from "../utils/helpers";
import moment from "moment-timezone";
import configurations from "../config/config";
import {
  createAccountInteractionSchema,
  createInteractionSchema,
  exportTechnicalSummarySchema,
  getInteractionStatusSchema,
  listAccountInteractionSchema,
  listAllTechnicalSummarySchema,
  listInteractionDetailsByIdSchema,
  listTechnicalSummarySchema,
  sendAccountInteractionSchema,
  sendInteractionSchema,
  updateInteractionResponseSchema,
  updateInteractionSchema,
  updateTechSummaryContextSchema,
} from "../lib/joi/schemas/schema";

// import Joi schemas and interaction services as needed

const services = configurations.getInstance().getServices();
const interactionService = services.interactionService;
async function createInteraction(req: Request, res: Response): Promise<void> {
  const methodName = "Create interaction";
  try {
    console.log(`[${methodName}] Request received`,JSON.stringify(req.body));
    const value = await validateRequest(req, createInteractionSchema, res);
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    if (!value) {
      errorLog(methodName, "Request body is empty");
      return;
    }
    const interaction = await interactionService.createInteraction(
      value,interactionSource.MANUAL,
      userId
    );
    console.log(
      `[${methodName}] Service response:`,
      JSON.stringify(interaction)
    );
    if (interaction.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleCustomResponse(res, interaction.data,interaction.message);
      return;
    } else {
      errorLog(methodName, interaction.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        interaction.errorMessage
      );
      return;
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.BAD_REQUEST,
      HttpStatus.BAD_REQUEST_MESSAGE,
      error.message
    );
    return;
  }
}

async function createAccountInteraction(req: Request, res: Response): Promise<void> {
  const methodName = "Create account interaction";
  try {
    console.log(`[${methodName}] Request received`, JSON.stringify(req.body));
    const value = await validateRequest(req, createAccountInteractionSchema, res);
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    if (!value) {
      errorLog(methodName, "Request body is empty");
      return;
    }
    const interaction = await interactionService.createAccountInteraction(
      value,interactionSource.MANUAL,
      userId
    );
    console.log(
      `[${methodName}] Service response:`,
      JSON.stringify(interaction)
    );
    if (interaction.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleCustomResponse(res, interaction.data,interaction.message);
      return;
    } else {
      errorLog(methodName, interaction.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        interaction.errorMessage
      );
      return;
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.BAD_REQUEST,
      HttpStatus.BAD_REQUEST_MESSAGE,
      error.message
    );
    return;
  }
}

async function listAccountInteractions(req: Request, res: Response): Promise<void> {
  const methodName = "List account interactions";
  try {
    console.log(`[${methodName}] Request received`, JSON.stringify(req.body));
    const value = await validateRequest(req, listAccountInteractionSchema, res,"GET");
    console.log("value",value);
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    if (!value) {
      errorLog(methodName, "Request body is empty");
      return;
    }
    
     const page: number = parseInt(value.page, 10) || 1;
    const limit: number = parseInt(value.limit, 10) || 10;
    let parsedFilters: Record<string, any> = {};
     try {
      parsedFilters = JSON.parse(value.filters);
    } catch (error) {
      errorLog(
        methodName,
        "Invalid filters format. Must be a valid JSON object."
      );
    }
    const interaction = await interactionService.listAccountInteractions(
      value,
      page,
      limit,
      parsedFilters
    );
    console.log(
      `[${methodName}] Service response:`,
      JSON.stringify(interaction)
    );
    if (interaction.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleCustomResponse(res, interaction.data,interaction.message);
      return;
    } else {
      errorLog(methodName, interaction.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        interaction.errorMessage
      );
      return;
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.BAD_REQUEST,
      HttpStatus.BAD_REQUEST_MESSAGE,
      error.message
    );
    return;
  }
}

async function updateInteraction(req: Request, res: Response): Promise<void> {
  const methodName = "Update interaction";
  try {
    console.log(`[${methodName}] Request received`, JSON.stringify(req.body));
    const value = await validateRequest(req, updateInteractionSchema, res);
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    if (!value) {
      errorLog(methodName, "Request body is empty");
      return;
    }
    const interaction = await interactionService.updateInteraction(
      value,
      userId
    );
    console.log(
      `[${methodName}] Service response:`,
      JSON.stringify(interaction)
    );
    if (interaction.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleCustomResponse(res, interaction.data, interaction.message);
      return;
    } else {
      errorLog(methodName, interaction.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        interaction.errorMessage
      );
      return;
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.BAD_REQUEST,
      HttpStatus.BAD_REQUEST_MESSAGE,
      error.message
    );
    return;
  }
}

async function updateInteractionResponse(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Update interaction response";
  try {
    console.log(`[${methodName}] Request received`, JSON.stringify(req.body));
    const value = await validateRequest(
      req,
      updateInteractionResponseSchema,
      res
    );
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    if (!value) {
      errorLog(methodName, "Request body is empty");
      return;
    }
    const interaction = await interactionService.updateInteractionResponse(
      value,
      userId
    );
    console.log(
      `[${methodName}] Service response:`,
      JSON.stringify(interaction)
    );
    if (interaction.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, interaction.data);
      return;
    } else {
      errorLog(methodName, interaction.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        interaction.errorMessage
      );
      return;
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.BAD_REQUEST,
      HttpStatus.BAD_REQUEST_MESSAGE,
      error.message
    );
    return;
  }
}

async function getInteractionDetailsById(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Get interaction details";
  try {
    console.log(`[${methodName}] Request received`, JSON.stringify(req.body));
    const { interactionRid, accountId } = req.params;
    const value = await validateRequest(
      req,
      listInteractionDetailsByIdSchema,
      res,
      "GET"
    );
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }

    if (!interactionRid || !accountId) {
      errorLog(
        methodName,
        "interactionRid and accountId are required in params"
      );
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "interactionRid and accountId are required in params"
      );
      return;
    }

    const interactionDetails =
      await interactionService.getInteractionDetailsById(
        interactionRid,
        accountId,
        value.project_fiscal_rid
      );
    console.log(
      `[${methodName}] Service response:`,
      JSON.stringify(interactionDetails)
    );
    if (interactionDetails.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, interactionDetails.data);
      return;
    } else {
      errorLog(methodName, interactionDetails.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        interactionDetails.errorMessage
      );
      return;
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.BAD_REQUEST,
      HttpStatus.BAD_REQUEST_MESSAGE,
      error.message
    );
    return;
  }
}
async function getTechnicalSummaryDetailsById(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Get technical summary details";
  try {
    console.log(`[${methodName}] Request received`, JSON.stringify(req.body));
    const value = await validateRequest(req, listTechnicalSummarySchema, res, "GET");
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }

    if (!value) {
      errorLog(
        methodName,
        "tech_summary_rid and account_rid are required in params"
      );
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "interactionRid and accountId are required in params"
      );
      return;
    }

    const interactionDetails =
      await interactionService.getTechnicalSummaryDetailsById(
        value.tech_summary_rid,
        value.account_rid
      );
    console.log(
      `[${methodName}] Service response:`,
      JSON.stringify(interactionDetails)
    );
    if (interactionDetails.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, interactionDetails.data);
      return;
    } else {
      errorLog(methodName, interactionDetails.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        interactionDetails.errorMessage
      );
      return;
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.BAD_REQUEST,
      HttpStatus.BAD_REQUEST_MESSAGE,
      error.message
    );
    return;
  }
}

async function updateTechSummaryContext(req: Request, res: Response): Promise<void> {
  const methodName = "Update technical summary context";
  try {
    console.log(`[${methodName}] Request received`, JSON.stringify(req.body));
    const value = await validateRequest(req, updateTechSummaryContextSchema, res);
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    if (!value) {
      errorLog(methodName, "Request body is empty");
      return;
    }
    const interaction = await interactionService.updateTechSummaryContext(
      value.summary_context,
      value.tech_summary_rid,
      value.account_rid,
      userId
    );
    console.log(
      `[${methodName}] Service response:`,
      JSON.stringify(interaction)
    );
    if (interaction.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleCustomResponse(res, interaction.data, interaction.message);
      return;
    } else {
      errorLog(methodName, interaction.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        interaction.errorMessage
      );
      return;
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.BAD_REQUEST,
      HttpStatus.BAD_REQUEST_MESSAGE,
      error.message
    );
    return;
  }
}




async function getInteractionQuestionsById(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Get interaction questions";
  try {
    const { interactionRid, accountId } = req.params;
    const value = req.params
    const userId = req.headers["x-user-id"] as string;

    if (!userId) {
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }

    if (!interactionRid || !accountId) {
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "interactionRid and accountId are required in params"
      );
      return;
    }

    const interactionDetails =
      await interactionService.getInteractionQuestionsById(
        interactionRid,
        accountId
      );
    if (interactionDetails.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, interactionDetails.data);
      return;
    } else {
      errorLog(methodName, interactionDetails.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        interactionDetails.errorMessage
      );
      return;
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.BAD_REQUEST,
      HttpStatus.BAD_REQUEST_MESSAGE,
      error.message
    );
    return;
  }
}
async function getInteractionStatus(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Get resource roles";
  try {
    const value = await validateRequest(req, getInteractionStatusSchema, res,"GET");
    const interactionStatus = await interactionService.getInteractionStatus(value.status_scope,value.current_status);
    if (interactionStatus.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, interactionStatus.data);
      return;
    } else {
      errorLog(methodName, interactionStatus.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        interactionStatus.errorMessage
      );
      return;
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.BAD_REQUEST,
      HttpStatus.BAD_REQUEST_MESSAGE,
      error.message
    );
    return;
  }
}

async function getInteractionTypes(req: Request, res: Response): Promise<void> {
  const methodName = "Get interaction types";
  try {
    const interactionTypes = await interactionService.getInteractionTypes();
    if (interactionTypes.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, interactionTypes.data);
      return;
    } else {
      errorLog(methodName, interactionTypes.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        interactionTypes.errorMessage
      );
      return;
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.BAD_REQUEST,
      HttpStatus.BAD_REQUEST_MESSAGE,
      error.message
    );
    return;
  }
}

async function getInteractionSource(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Get interaction source";
  try {
    const interactionSource = await interactionService.getInteractionSource();
    if (interactionSource.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, interactionSource.data);
      return;
    } else {
      errorLog(methodName, interactionSource.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        interactionSource.errorMessage
      );
      return;
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.BAD_REQUEST,
      HttpStatus.BAD_REQUEST_MESSAGE,
      error.message
    );
    return;
  }
}
async function getResponseSource(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Get response source";
  try {
    const responseSource = await interactionService.getResponseSource();
    if (responseSource.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, responseSource.data);
      return;
    } else {
      errorLog(methodName, responseSource.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        responseSource.errorMessage
      );
      return;
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.BAD_REQUEST,
      HttpStatus.BAD_REQUEST_MESSAGE,
      error.message
    );
    return;
  }
}


async function listAllInteractionPrjAcc (req : Request, res : Response) {
  try {
    const methodName = "listAllInteractionPrjAcc"
    console.log(`[${methodName}] Request received`,JSON.stringify(req.body));
    let data = req.body;
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    const result = await interactionService.listInteractionPrjAccount(data,userId)
    if(result.status == HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode : HttpStatus.SUCCESS,
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        statusMessage : STATUS_MESSAGE.interactionFetchedSuccess,
        data : result.data
      })
      
    } else {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode : HttpStatus.SUCCESS,
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        statusMessage : STATUS_MESSAGE.dataNotFound,
        data : result.data
      })
      return;
    }
  } catch (error : any) {
    handleErrorResponse(res, HttpStatus.FAILED, HttpStatus.FAILED_MESSAGE, error.message)
  }
}

async function exportAllInteractions (req : Request, res : Response) {
  try {
    const methodName = "exportAllInteractions"
    console.log(`[${methodName}] Request received`,JSON.stringify(req.body));
    const data = req.body
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    const result = await interactionService.listInteractionPrjAccount(data,userId)
    const fields = await interactionService.getAllowedExportFields(
          userId,
          "interactions_view_edit"
        );
      const allowedFieldSet = new Set<string>();
      for (const field of fields) {
        if (field.read) {
          allowedFieldSet.add(field.field_name);
        }
      }
       const isValidTZ = data.timezone &&  isValidTimezone(data.timezone);
       const formatDate = (date?: Date) =>
        date
          ? moment(date).tz(isValidTZ ? data.timezone : 'UTC').format('YYYY-MM-DD, hh:mm:ss A')
          : null;

    if(result.status == HttpStatus.SUCCESS) {
      const finalStructuredData = result.data.interactions.length < 1 ? [] : result.data.interactions.map((d: any) => {
        let resultMap: { [key: string]: any } = {
          "r_number": d.r_number,
          "project_code": d.project_code,
          "interaction_age": d.interaction_age,
          "fiscal_year": d.fiscal_year,
          "status_name": d.status_name,
          "recipient_name": d.recipient_name,
          "recipient_email": d.recipient_email,
          "last_resent_on": d.last_resent_on === null ? '' : formatDate(d.last_resent_on),
          "last_reminder_on": d.last_reminder_on == null ? '' : formatDate(d.last_reminder_on),
          "response_submitted_on": d.response_submitted_on === null ? '' : formatDate(d.response_submitted_on),
          "response_updated_on": d.response_updated_on == null ? '' : formatDate(d.response_updated_on),
          "attachment_count": d.attachment_count === 0 || d.attachment_count === "" ? null : d.attachment_count,
          "interaction_url": d.interaction_url
        ? {
            text: "Link",
            hyperlink: d.interaction_url,
            style: {
          fontColor: "1755E7",
            }
          }
        : null,
          "interaction_type_name": d.interaction_type_name,
          "response_source_name": d.response_source_name,
          "created_by": d.created_user_name,
          "created_datetime":formatDate(d.created_datetime),
          "modified_by": d.updated_user_name,
          "modified_datetime": d.modified_datetime == null ? '' : formatDate(d.modified_datetime),
        };

        // Build exportRecord using allowed fields and resultMap
        const exportRecord: Record<string, any> = {};
        interactionFieldMappings.forEach(mapping => {
          if (allowedFieldSet.has(mapping.permissionField)) {
            exportRecord[mapping.exportField] = resultMap[mapping.dataField];
          }
        });

        return exportRecord;
      });

      const base64Response = await generateExcelBase64(finalStructuredData, "Interactions")
        handleSuccessResponse(res, base64Response);
        return; 
    } else {
        return res.status(HttpStatus.SUCCESS).json({
          statusCode : HttpStatus.SUCCESS,
          statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
          statusMessage : STATUS_MESSAGE.dataNotFound,
          data : null
        })
      }
  } catch (error : any) {
    handleErrorResponse(res, HttpStatus.FAILED, HttpStatus.FAILED_MESSAGE, error.message)
  }
}

async function listOutAllInteractionSummary (req : Request, res : Response) {
  try {
    const methodName = "listOutAllInteractionSummary"
    console.log(`[${methodName}] Request received`,JSON.stringify(req.body));
    const data = req.body;
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    const result = await interactionService.fetchInteractionSummary(data,userId);
    if(result.statusCodeValue == HttpStatus.SUCCESS_MESSAGE) {
      const finalData = {
        page : data.page,
        limit : data.limit,
        totalCount: result.data[0].total_records,
        interactions : result.data
      }
      return res.status(HttpStatus.SUCCESS).json({
        statusCode : HttpStatus.SUCCESS,
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        statusMessage : STATUS_MESSAGE.interactionFetchedSuccess,
        data : finalData
      })
    } else {
      const finalData = {
        page : data.page,
        limit : data.limit,
        totalCount: 0,
        interactions : []
      }
      return res.status(HttpStatus.SUCCESS).json({
        statusCode : HttpStatus.SUCCESS,
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        statusMessage : STATUS_MESSAGE.dataNotFound,
        data : finalData
      })
    }
  } catch (error : any) {
    return res.status(HttpStatus.FAILED).json({
        statusCode : HttpStatus.FAILED,
        statusCodeValue : HttpStatus.FAILED_MESSAGE,
        statusMessage : error.message,
        data : []
      })
  }
}

async function exportAllInteractionSummary (req : Request, res : Response) {
  try {
    const methodName = "exportAllInteractionSummary"
    console.log(`[${methodName}] Request received`,JSON.stringify(req.body));
    const data = req.body;
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    const result = await interactionService.fetchInteractionSummary(data,userId);
     const fields = await interactionService.getAllowedExportFields(
          userId,
          "interactions_view_edit"
        );
      const allowedFieldSet = new Set<string>();
      for (const field of fields) {
        if (field.read) {
          allowedFieldSet.add(field.field_name);
        }
      }
       const isValidTZ = data.timezone &&  isValidTimezone(data.timezone);
       const formatDate = (date?: Date) =>
        date
          ? moment(date).tz(isValidTZ ? data.timezone : 'UTC').format('YYYY-MM-DD, hh:mm:ss A')
          : null;
    if(result.statusCodeValue == HttpStatus.SUCCESS_MESSAGE) {
      let structuredData = result.data.length < 1 ? [] : result.data.map(( d : any) => {
       let resultMap: { [key: string]: any }  = {
          "r_number": d.r_number,
          "account_name":d.account_name,
          "project_code": d.project_code,
          "interaction_age": d.interaction_age,
          "fiscal_year": d.fiscal_year,
          "status_name": d.status_name,
          "recipient_name": d.recipient_name,
          "recipient_email": d.recipient_email,
          "last_sent_date": d.last_resent_on === null ? '' : formatDate(d.last_resent_on),
          "last_reminder_date": d.last_reminder_on == null ? '' : formatDate(d.last_reminder_on),
          "response_submitted_on": d.response_submitted_on === null ? '' : formatDate(d.response_submitted_on),
          "response_updated_on": d.response_updated_on == null ? '' : formatDate(d.response_updated_on),
          "attachment_count":d.attachment_count === 0 || d.attachment_count === "" ? null : d.attachment_count,
          "interaction_url": d.interaction_url
            ? {
              text: "Link",
              hyperlink: d.interaction_url,
              style: {
                fontColor: "1755E7",
              }
              }
            : null,
          "interaction_type_name": d.interaction_type_name,
          "response_source_name": d.response_source_name,
          "created_by": d.created_user_name,
          "created_datetime": d.created_datetime == null ? '' : formatDate(d.created_datetime),
          "modified_by": d.updated_user_name,
          "modified_datetime": d.modified_datetime == null ? '' : formatDate(d.modified_datetime)
        }

            const exportRecord: Record<string, any> = {};
        interactionFieldMappings.forEach(mapping => {
          if (allowedFieldSet.has(mapping.permissionField)) {
            exportRecord[mapping.exportField] = resultMap[mapping.dataField];
          }
        });
        return exportRecord;
        }
      );
    const base64Response = await generateExcelBase64(structuredData, "Interactions")
    handleSuccessResponse(res, base64Response);
    return; 
    } else {
        return res.status(HttpStatus.SUCCESS).json({
          statusCode : HttpStatus.SUCCESS,
          statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
          statusMessage : STATUS_MESSAGE.dataNotFound,
          data : null
        })
      }
  } catch (error : any) {
    return res.status(HttpStatus.FAILED).json({
        statusCode : HttpStatus.FAILED,
        statusCodeValue : HttpStatus.FAILED_MESSAGE,
        statusMessage : error.message,
        data : []
      })
  }
}

async function listResponseHistory (req : Request, res : Response) {
  try {
    const methodName = "listResponseHistory"
    console.log(`[${methodName}] Request received`,JSON.stringify(req.body));
    const data = req.body;
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    const result = await interactionService.listInteractionResponseHistory(data)
    if(result.statusCodeValue == HttpStatus.SUCCESS_MESSAGE) {
      let responseData = {
        page : data.page,
        limit : data.limit,
        totalCount : result.data[0].total_records,
        response_history : result.data
      }
      return res.status(HttpStatus.SUCCESS).json({
        statusCode : HttpStatus.SUCCESS,
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        statusMessage : STATUS_MESSAGE.historyResponseFetched,
        data : responseData
      })
    } else {
      let responseData = {
        page : data.page,
        limit : data.limit,
        totalCount : 0,
        response_history : result.data
      }
      return res.status(HttpStatus.SUCCESS).json({
        statusCode : HttpStatus.SUCCESS,
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        statusMessage : STATUS_MESSAGE.dataNotFound,
        data : responseData
      })
    }
  } catch (error : any) {
    return res.status(HttpStatus.FAILED).json({
        statusCode : HttpStatus.FAILED,
        statusCodeValue : HttpStatus.FAILED_MESSAGE,
        statusMessage : error.message,
        data : []
      })
  }
}

async function exportResponseHistory (req : Request, res : Response) {
  try {
    const methodName = "exportResponseHistory"
    console.log(`[${methodName}] Request received`,JSON.stringify(req.body));
    const data = req.body;
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    const result = await interactionService.listInteractionResponseHistory(data);
    if(result.statusCodeValue == HttpStatus.SUCCESS_MESSAGE) {
      let structuredData = result.data.map((d : any) => {
        return {
          "Interaction ID" : d.r_number,
          "Interaction Type" : d.interaction_source_name,
          "Response Via" : d.interaction_response,
          "Response On" : d.response_on == null ? '' : new Date(d.response_on).toISOString().split('T')[0],
          "Response Email-ID" : d.response_email,
          "Response By" : d.response_by
        }
      }) 
    const base64Response = await generateExcelBase64(structuredData, "Interactions")
    handleSuccessResponse(res, base64Response);
    return;
    } else {
        return res.status(HttpStatus.SUCCESS).json({
          statusCode : HttpStatus.SUCCESS,
          statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
          statusMessage : STATUS_MESSAGE.dataNotFound,
          data : null
        })
      }
  } catch (error : any) {
    return res.status(HttpStatus.FAILED).json({
        statusCode : HttpStatus.FAILED,
        statusCodeValue : HttpStatus.FAILED_MESSAGE,
        statusMessage : error.message,
        data : []
      })
  }
}

async function sendInteraction(req: Request, res: Response): Promise<void> {
  const methodName = "Send interaction";
  try {
    console.log(`[${methodName}] Request received`, JSON.stringify(req.body));
    const value = await validateRequest(req, sendInteractionSchema, res);
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    if (!value) {
      errorLog(methodName, "Request body is empty");
      return;
    }
     const interaction = await interactionService.sendInteraction(
       value.interactions,
       value.account_rid,
       userId,
       value.is_interaction_followup
     );
    console.log(
      `[${methodName}] Service response:`,
      JSON.stringify(interaction)
    );
    if (interaction.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, interaction.data);
      return;
    } else {
      errorLog(methodName, interaction.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        interaction.errorMessage
      );
      return;
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.BAD_REQUEST,
      HttpStatus.BAD_REQUEST_MESSAGE,
      error.message
    );
    return;
  }
}

async function sendAccountInteraction(req: Request, res: Response): Promise<void> {
  const methodName = "Send account interaction";
  try {
    console.log(`[${methodName}] Request received`, JSON.stringify(req.body));
    const value = await validateRequest(req, sendAccountInteractionSchema, res);
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    if (!value) {
      errorLog(methodName, "Request body is empty");
      return;
    }
     const interaction = await interactionService.sendAccountInteraction(
       value.account_rid,
       value.account_interaction_rid,
       value.projects,
       userId,
     );
    console.log(
      `[${methodName}] Service response:`,
      JSON.stringify(interaction)
    );
    if (interaction.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, interaction.data);
      return;
    } else {
      errorLog(methodName, interaction.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        interaction.errorMessage
      );
      return;
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.BAD_REQUEST,
      HttpStatus.BAD_REQUEST_MESSAGE,
      error.message
    );
    return;
  }
}
async function uploadAttachmentToAzure(req: Request, res: Response): Promise<void> {
  const methodName = "Upload attachment to Azure";
  try {
    console.log(`[${methodName}] Request received`);
  //  const value = await validateRequest(req, sendInteractionSchema, res)
    const userId = req.headers["x-user-id"] as string;
    let value = req.body;
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
   if( req.file)
   {
      let fileInfo = await uploadToAzureBlob(req.file, value?.account_rid,value?.project_rid,value?.interaction_rid);
      handleSuccessResponse(res, {
      fileName: fileInfo.name,
      fileSize: fileInfo.size,
      fileType: fileInfo.extension,
      fileUrl: fileInfo.url
    });
    return;
  } else {
    handleErrorResponse(
      res,
      HttpStatus.BAD_REQUEST,
      HttpStatus.BAD_REQUEST_MESSAGE,
      "No file uploaded"
    );
    return;
  }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.BAD_REQUEST,
      HttpStatus.BAD_REQUEST_MESSAGE,
      error.message
    );
    return;
  }
}

async function deleteAttachmentFromAzure(req: Request, res: Response): Promise<void> {
  const methodName = "Delete attachment from Azure";
  try {
  //  const value = await validateRequest(req, sendInteractionSchema, res)
    const userId = req.headers["x-user-id"] as string;
    let value = req.body;
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
   if(value.file_url)
   {
      let deleted = await deleteFromAzureBlob(value.file_url);
      handleSuccessResponse(res,deleted);
    return;
  } else {
    handleErrorResponse(
      res,
      HttpStatus.BAD_REQUEST,
      HttpStatus.BAD_REQUEST_MESSAGE,
      "No file uploaded"
    );
    return;
  }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.BAD_REQUEST,
      HttpStatus.BAD_REQUEST_MESSAGE,
      error.message
    );
    return;
  }
}

async function listTechnicalSummary(req: Request, res: Response) {
  const methodName = "listTechnicalSummary"
  try {
    console.log(`[${methodName}] Request received`);
    const userId = req.headers["x-user-id"] as string;
    const value = await validateRequest(req, listAllTechnicalSummarySchema, res, "GET");
    console.log(`[${methodName}] userId:`, userId);
    console.log(`[${methodName}] value:`, value);
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    if (!value) return;
    let parsedFilters: Record<string, any> = {};
    try {
      parsedFilters = JSON.parse(value.filters);
    } catch (error) {
      errorLog(
        methodName,
        "Invalid filters format. Must be a valid JSON object."
      );
    }

    const page: number = parseInt(value.page, 10) || 1;
    const limit: number = parseInt(value.limit, 10) || 10;
    const result = await interactionService.listTechnicalSummary(value,page,limit,parsedFilters)
    if(result.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode : HttpStatus.SUCCESS,
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        statusMessage : HttpStatus.SUCCESS_NOTIFICATION,
        data : result.data
      })
    } else {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode : HttpStatus.SUCCESS,
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        statusMessage : STATUS_MESSAGE.dataNotFound,
        data : result.data
      })
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    console.log(`[${methodName}] Exception:`, error);
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
    return;
  }
}
async function exportTechnicalSummary(req: Request, res: Response) {
  const methodName = "exportTechnicalSummary"
  try {

    console.log(`[${methodName}] Request received`);
    const userId = req.headers["x-user-id"] as string;
    const value = await validateRequest(req, exportTechnicalSummarySchema, res, "GET");
    console.log(`[${methodName}] userId:`, userId);
    console.log(`[${methodName}] value:`, value);
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    if (!value) return;
    let parsedFilters: Record<string, any> = {};
    try {
      parsedFilters = JSON.parse(value.filters);
    } catch (error) {
      errorLog(
        methodName,
        "Invalid filters format. Must be a valid JSON object."
      );
    }
    const result = await interactionService.exportTechnicalSummary(value,parsedFilters)
    const fields = await interactionService.getAllowedExportFields(
          userId,
          "projects_tech_summary_view_edit"
        );
      const allowedFieldSet = new Set<string>();
      for (const field of fields) {
        if (field.read) {
          allowedFieldSet.add(field.field_name);
        }
      }
     const isValidTZ = value.timezone &&  isValidTimezone(value.timezone);
       const formatDate = (date?: Date) =>
        date
          ? moment(date).tz(isValidTZ ? value.timezone : 'UTC').format('YYYY-MM-DD, hh:mm:ss A')
          : null;
    if(result.statusCode === HttpStatus.SUCCESS) {
         const finalStructuredData = result?.data?.techSummaryInfo.length < 1 ? [] : result?.data?.techSummaryInfo.map((d: any) => {
        let resultMap: { [key: string]: any } = {
          "r_number": d.r_number,
          "project_code": d.project_code,
          "fiscal_year": d.fiscal_year,
          "status_name": d.status_name,
          "version": d.version,
          "summary_context": d.summary_context,
          "technical_summary": d.technical_summary,
          "created_by": d.created_user_name,
          "created_datetime":formatDate(d.created_datetime),
          "modified_by": d.modified_user_name,
          "modified_datetime": d.modified_datetime == null ? '' : formatDate(d.modified_datetime),
        };

        // Build exportRecord using allowed fields and resultMap
        const exportRecord: Record<string, any> = {};
        techSummaryFieldMappings.forEach(mapping => {
          if (allowedFieldSet.has(mapping.permissionField)) {
            exportRecord[mapping.exportField] = resultMap[mapping.dataField];
          }
        });

        return exportRecord;
      });

       const generateBase64Response = await generateExcelBase64(finalStructuredData, "Technical Summary")
        handleSuccessResponse(res, generateBase64Response);
    } else {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode : HttpStatus.SUCCESS,
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        statusMessage : STATUS_MESSAGE.dataNotFound,
        data : result.data
      })
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    console.log(`[${methodName}] Exception:`, error);
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
    return;
  }
}
async function listInteractionHistory (req : Request, res : Response) {
  const methodName = "listInteractionHistory"
  try {
    console.log(`[${methodName}] Request received`);
    const userId = req.headers["x-user-id"] as string;
    let data = req.body;
    console.log(`[${methodName}] userId:`, userId);
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    const result = await interactionService.fetchInteractionHistory(data)
    if(result.statusCodeValue === HttpStatus.SUCCESS_MESSAGE) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode : HttpStatus.SUCCESS,
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        statusMessage : STATUS_MESSAGE.interactionHistoryFetched,
        data : result.data
      })
    } else {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode : HttpStatus.SUCCESS,
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        statusMessage : STATUS_MESSAGE.dataNotFound,
        data : result.data
      })
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    console.log(`[${methodName}] Exception:`, error);
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
    return;
  }
}
async function fetchInteractionAttachments(req : Request, res : Response) {
  const methodName = "fetchInteractionAttachments"
  try {
    console.log(`[${methodName}] Request received`);
    const userId = req.headers["x-user-id"] as string;
    let data = req.body;
    console.log(`[${methodName}] userId:`, userId);
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    const result = await interactionService.listInteractionAttachments(data);
    if(result.statusCodeValue == HttpStatus.SUCCESS_MESSAGE) {
      let finalData = {
        page : result.page,
        limit : result.limit,
        totalRecords : result.totalRecords,
        data : result.attachments
      }
      return res.status(HttpStatus.SUCCESS).json({
        statusCode : HttpStatus.SUCCESS,
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        statusMessage : STATUS_MESSAGE.interactionAttachmentFetched,
        data : finalData
      })
    } else {
      let finalData = {
        page : result.page,
        limit : result.limit,
        totalRecords : result.totalRecords,
        data : result.attachments
      }
      return res.status(HttpStatus.SUCCESS).json({
        statusCode : HttpStatus.SUCCESS,
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        statusMessage : STATUS_MESSAGE.dataNotFound,
        data : finalData
      })
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    console.log(`[${methodName}] Exception:`, error);
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
    return;
  }
}

async function fetchResponseHistoryDetails (req : Request, res : Response) {
   const methodName = "fetchResponseHistoryDetails"
    try {
    console.log(`[${methodName}] Request received`);
    const userId = req.headers["x-user-id"] as string;
    let data = req.body;
    console.log(`[${methodName}] userId:`, userId);
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    const result = await interactionService.listResponseHistoryDetails(data)
    if(result.statusCodeValue == HttpStatus.SUCCESS_MESSAGE) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode : HttpStatus.SUCCESS,
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        statusMessage : STATUS_MESSAGE.historyResponseFetched,
        data : result.data
      })
    } else {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode : HttpStatus.SUCCESS,
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        statusMessage : STATUS_MESSAGE.dataNotFound,
        data : result.data
      })
    }
    } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    console.log(`[${methodName}] Exception:`, error);
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
    return;
  }
  }

  async function triggerAIAndPassResponse (req : Request, res : Response) {
    const methodName = "triggerAIAndSendPassResponse"
    try {
     console.log(`[${methodName}] Request received`);
    const userId = req.headers["x-user-id"] as string;
    let data = req.body;
    console.log(`[${methodName}] userId:`, userId);
    if (!userId) {
      errorLog(methodName, "User ID is required in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }
    const result = await interactionService.triggerAI(data)
    return res.status(HttpStatus.SUCCESS).json({
      statusCode : HttpStatus.SUCCESS,
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        statusMessage : STATUS_MESSAGE.assessmentInitiated,
        data : result.data
    })
    } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    console.log(`[${methodName}] Exception:`, error);
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
    return;
  }
  }

  async function exportInteractionHistory (req : Request, res : Response) {
    const methodName = "exportInteractionHistory"
    try {
      console.log(`[${methodName}] Request received`);
      const userId = req.headers["x-user-id"] as string;
      let data = req.body;
      console.log(`[${methodName}] userId:`, userId);
      if (!userId) {
        errorLog(methodName, "User ID is required in headers");
        handleErrorResponse(
          res,
          HttpStatus.BAD_REQUEST,
          HttpStatus.BAD_REQUEST_MESSAGE,
          "User ID is required in headers"
        );
        return;
      }
      const result = await interactionService.fetchInteractionHistory(data)
      if(result.statusCodeValue == HttpStatus.SUCCESS_MESSAGE) {
        let finalStructuredData = result.data.data.interaction_history.map((data : any) => ({
          "Action" : data.status_name,
          "Date" : formatToLocalTime(data.date)
        }))
        const generateBase64Response = await generateExcelBase64(finalStructuredData, "Interaction-History")
        handleSuccessResponse(res, generateBase64Response);
        return;
      } else {
        return res.status(HttpStatus.SUCCESS).json({
          statusCode : HttpStatus.SUCCESS,
          statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
          statusMessage : STATUS_MESSAGE.dataNotFound,
          data : null
        })
      }
    } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    console.log(`[${methodName}] Exception:`, error);
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
    return;
  }
  }
  async function processKafkaMessages(data:any)
  {
    const methodName = "processKafkaMessages";
    try {
      console.log(`[${methodName}] Processing Kafka messages`);
       const result = await interactionService.processKafkaMessage(data)
      // Implement your Kafka message processing logic here
    } catch (err) {
      const error = err as Error;
      errorLog(methodName, error.message);
      console.log(`[${methodName}] Exception:`, error);
    }
  }



export default {
  listAllInteractionPrjAcc,
  exportAllInteractions,
  listOutAllInteractionSummary,
  exportAllInteractionSummary,
  listResponseHistory,
  exportResponseHistory,
  createInteraction,
  createAccountInteraction,
  listAccountInteractions,
  updateInteraction,
  updateInteractionResponse,
  getInteractionStatus,
  getInteractionTypes,
  getInteractionSource,
  getResponseSource,
  getInteractionDetailsById,
  getInteractionQuestionsById,
  sendInteraction,
  uploadAttachmentToAzure,
  deleteAttachmentFromAzure,
  listInteractionHistory,
  fetchInteractionAttachments,
  fetchResponseHistoryDetails,
  triggerAIAndPassResponse,
  exportInteractionHistory,
  processKafkaMessages,
  listTechnicalSummary,
  getTechnicalSummaryDetailsById,
  updateTechSummaryContext,
  exportTechnicalSummary,
  sendAccountInteraction
};
