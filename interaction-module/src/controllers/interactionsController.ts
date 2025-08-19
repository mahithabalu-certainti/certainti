import { Request, Response } from "express";
import { HttpStatus, STATUS_MESSAGE } from "../utils/constants";
import {
  deleteFromAzureBlob,
  errorLog,
  generateExcelBase64,
  handleErrorResponse,
  handleSuccessResponse,
  successLog,
  uploadToAzureBlob,
  validateRequest,
} from "../utils/helpers";
import configurations from "../config/config";
import {
  createInteractionSchema,
  updateInteractionResponseSchema,
  updateInteractionSchema,
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
        accountId
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
async function getInteractionQuestionsById(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Get interaction questions";
  try {
    const { interactionRid, accountId } = req.params;
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
    const interactionStatus = await interactionService.getInteractionStatus();
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
    const result = await interactionService.listInteractionPrjAccount(data)
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
        statusMessage : STATUS_MESSAGE.interactionFetchedSuccess,
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
    const result = await interactionService.listInteractionPrjAccount(data)
    if(result.status == HttpStatus.SUCCESS) {
      const finalStructuredData = result.data.interactions.length < 1 ? [] : result.data.interactions.map(( d : any) => {
       return {
          "Interaction ID": d.r_number,
          "Last Sent Date": d.last_resent_on === null ? '' : new Date(d.last_resent_on).toISOString().split('T')[0],
          "Recipient Name": d.recipient_name,
          "Age": d.interaction_age,
          "Interaction Link": d.interaction_url,
          "Recipient Email": d.recipient_email,
          "Response Source": d.response_source,
          "Last Reminder Date": d.last_reminder_on == null ? '' : new Date(d.last_reminder_on).toISOString().split('T')[0],
          "Last Updated Date": d.modified_datetime == null ? '' : new Date(d.modified_datetime).toISOString().split('T')[0],
          "Last Response Update": d.response_updated_on == null ? '' : new Date(d.response_updated_on).toISOString().split('T')[0],
          "Response Date": d.response_submitted_on === null ? '' : new Date(d.response_submitted_on).toISOString().split('T')[0],
          "Parent Interaction ID": d.parent_interaction_rid,
          "Status": d.status_name,
          "Type": d.interaction_type_name,
          "Created By": d.created_user_name,
          "Last Updated By": d.updated_user_name
        }
      });

      const base64Response = await generateExcelBase64(finalStructuredData, "Interactions")
        handleSuccessResponse(res, base64Response);
        return; 
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
    const result = await interactionService.fetchInteractionSummary(data)
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
      return res.status(HttpStatus.NOT_FOUND).json({
        statusCode : HttpStatus.NOT_FOUND,
        statusCodeValue : HttpStatus.NOT_FOUND_MESSAGE,
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
    const result = await interactionService.fetchInteractionSummary(data);
    if(result.statusCodeValue == HttpStatus.SUCCESS_MESSAGE) {
      let structuredData = result.data.length < 1 ? [] : result.data.map(( d : any) => {
        return {
          "Interaction ID": d.r_number,
          "Last Sent Date": d.last_resent_on === null ? '' : new Date(d.last_resent_on).toISOString().split('T')[0],
          "Recipient Name": d.recipient_name,
          "Age": d.interaction_age,
          "Interaction Link": d.interaction_url,
          "Recipient Email": d.recipient_email,
          "Response Source": d.response_source,
          "Last Reminder Date": d.last_reminder_on == null ? '' : new Date(d.last_reminder_on).toISOString().split('T')[0],
          "Last Updated Date": d.modified_datetime == null ? '' : new Date(d.modified_datetime).toISOString().split('T')[0],
          "Last Response Update": d.response_updated_on == null ? '' : new Date(d.response_updated_on).toISOString().split('T')[0],
          "Response Date": d.response_submitted_on === null ? '' : new Date(d.response_submitted_on).toISOString().split('T')[0],
          "Parent Interaction ID": d.parent_interaction_rid,
          "Status": d.status_name,
          "Type": d.interaction_type_name,
          "Created By": d.created_user_name,
          "Last Updated By": d.updated_user_name
        }
        });
    const base64Response = await generateExcelBase64(structuredData, "Interactions")
    handleSuccessResponse(res, base64Response);
    return; 
    } else {
      handleErrorResponse(res, HttpStatus.NOT_FOUND, HttpStatus.NOT_FOUND_MESSAGE, STATUS_MESSAGE.dataNotFound)
      return;
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
      return res.status(HttpStatus.NOT_FOUND).json({
        statusCode : HttpStatus.NOT_FOUND,
        statusCodeValue : HttpStatus.NOT_FOUND_MESSAGE,
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
      handleErrorResponse(res, HttpStatus.NOT_FOUND, HttpStatus.NOT_FOUND_MESSAGE, STATUS_MESSAGE.dataNotFound)
      return;
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
  //  const value = await validateRequest(req, sendInteractionSchema, res);
    const value = req.body;
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
   /* const interaction = {
      statusCode: HttpStatus.SUCCESS,
      data: { message: " interaction sent successfully" },
      errorMessage: ""
    };*/
     const interaction = await interactionService.sendInteraction(
       value.interaction_rid,
       value.account_rid,
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
   if( req.file)
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



export default {
  listAllInteractionPrjAcc,
  exportAllInteractions,
  listOutAllInteractionSummary,
  exportAllInteractionSummary,
  listResponseHistory,
  exportResponseHistory,
  createInteraction,
  updateInteraction,
  updateInteractionResponse,
  getInteractionStatus,
  getInteractionTypes,
  getInteractionSource,
  getInteractionDetailsById,
  getInteractionQuestionsById,
  sendInteraction,
  uploadAttachmentToAzure,
  deleteAttachmentFromAzure
};
