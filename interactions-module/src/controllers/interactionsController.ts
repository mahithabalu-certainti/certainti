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
      console.log(result.data.interactions)
      const finalStructuredData = result.data.interactions.length < 1 ? [] : result.data.interactions.map(( d : any) => {
       return {
         "Interaction ID": d.r_number,
        "Last Sent Date": d.last_resent_on,
        "Recipient Name": d.recipient_name,
        "Age": d.interaction_age,
        "Interaction Link": d.interaction_url,
        "Recipient Email": d.recipient_email,
        "Response Source": d.response_source,
        "Last Reminder Date": d.last_reminder_on,
        "Last Updated Date": d.modified_datetime,
        "Last Response Update": d.response_updated_on,
        "Response Date": d.response_submitted_on,
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

export default {
  listAllInteractionPrjAcc,
  exportAllInteractions
};
