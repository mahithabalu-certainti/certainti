import { Request, Response } from "express";
import { HttpStatus, STATUS_MESSAGE } from "../utils/constants";
import {
  errorLog,
  generateExcelBase64,
  handleErrorResponse,
  handleSuccessResponse,
  successLog,
  validateRequest,
} from "../utils/helpers";
import configurations from "../config/config";

// import Joi schemas and interaction services as needed

const services = configurations.getInstance().getServices();
const interactionService = services.interactionService;

async function listAllInteractionPrjAcc (req : Request, res : Response) {
  try {
    let data = req.body;
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
    const data = req.body
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
    const data = req.body;
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
    const data = req.body;
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

export default {
  listAllInteractionPrjAcc,
  exportAllInteractions,
  listOutAllInteractionSummary,
  exportAllInteractionSummary
};
