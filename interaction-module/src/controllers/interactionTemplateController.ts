import { Request, Response } from "express";
import {  accountinteractionFieldMappings, HttpStatus, interactionFieldMappings, interactionSource, STATUS_MESSAGE, techSummaryFieldMappings } from "../utils/constants";
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
import ExcelJS from "exceljs";
import configurations from "../config/config";
import {
  createInteractionTemplateSchema,
  listInteractionTemplatesSchema,
  updateInteractionTemplateSchema,
} from "../lib/joi/schemas/schema";

// import Joi schemas and interaction services as needed

const services = configurations.getInstance().getServices();
const interactionService = services.interactionService;
async function createInteractionTemplate(req: Request, res: Response): Promise<void> {
  const methodName = "Create template interaction";
  try {
    console.log(`[${methodName}] Request received`,JSON.stringify(req.body));
    const value = await validateRequest(req, createInteractionTemplateSchema, res);
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
    const interaction = await interactionService.createInteractionTemplate(
      value,
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
async function listInteractionTemplates(req: Request, res: Response) {
  const methodName = "listInteractionTemplate"
  try {
    console.log(`[${methodName}] Request received`);
    const userId = req.headers["x-user-id"] as string;
    const value = await validateRequest(req, listInteractionTemplatesSchema, res, "GET");
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
      parsedFilters = value.filters;
    } catch (error) {
      errorLog(
        methodName,
        "Invalid filters format. Must be a valid JSON object."
      );
    }

    const page: number = value.page || 1;
    const limit: number = value.limit || 10;
    const result = await interactionService.listInteractionTemplates(value,userId,parsedFilters)
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
async function updateInteractionTemplate(req: Request, res: Response): Promise<void> {
  const methodName = "Update interaction template";
  try {
    console.log(`[${methodName}] Request received`, JSON.stringify(req.body));
    const value = await validateRequest(req, updateInteractionTemplateSchema, res);
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
    const interaction = await interactionService.updateInteractionTemplate(
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
async function getInteractionTemplateDetailsById(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Get interaction template details";
  try {
    console.log(`[${methodName}] Request received`, JSON.stringify(req.body));
    const { templateRid } = req.params;
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

    if (!templateRid) {
      errorLog(
        methodName,
        "templateRid is required in params"
      );
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "interactionRid and accountId are required in params"
      );
      return;
    }
    let interactionDetails;
   interactionDetails =
        await interactionService.getInteractionTemplateDetailsById(
          templateRid
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
async function exportInteractionTemplate(req : Request, res : Response) {
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
    const result = await interactionService.getInteractionTemplateDetailsById(data.template_rid!);
    const isValidTZ = data.timezone &&  isValidTimezone(data.timezone);
    const formatDate = (date?: Date) =>
        date
          ? moment(date).tz(isValidTZ ? data.timezone : 'UTC').format('YYYY-MM-DD, hh:mm:ss A')
          : null;
    const response = result.data?.interactionDetails;
    if(result.statusCode == HttpStatus.SUCCESS) {

       const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Interaction");
      const headerRows = [
      ["Template ID", response?.r_number ?? ""],
      ["Interaction Name", response?.interaction_name ?? ""],
      ["Interaction Type", response?.interaction_type_name ?? ""],
      ["Interaction Level", response?.interaction_level_name ?? ""],
      ["Status", response?.status_name ?? ""],
      ["Created By", response?.created_by ?? ""],
    ];
    headerRows.forEach((row, idx) => {
      worksheet.addRow(row);
      worksheet.getRow(idx + 1).getCell(1).font = { bold: true };
    });
     worksheet.addRow(["Question No","Questions", "Notes", "Is Mandatory"]);
     worksheet.getRow(7).eachCell((cell) => {
      cell.font = { bold: true };
    });
     worksheet.columns = [
      { key: "question no", width: 15 },
      { key: "question", width: 50 },
      { key: "notes", width: 30 },
      { key: "is_mandatory", width: 15 },
    ];
      response.questions.forEach((item: any) => {
      const plain = item.get ? item.get({ plain: true }) : item;
      const row = worksheet.addRow({
        "question no": plain.question_seq_num,
        "question": plain.question,
        "notes": "",
        "is_mandatory": plain.is_mandatory ? "Yes" : "No",
      });
    });
    const excelBuffer = await workbook.xlsx.writeBuffer();
    //await workbook.xlsx.writeFile('Profile_Permissions.xlsx');
        handleSuccessResponse(res, Buffer.from(excelBuffer).toString("base64"));
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




export default {
  createInteractionTemplate,
  listInteractionTemplates,
  updateInteractionTemplate,
  getInteractionTemplateDetailsById,
  exportInteractionTemplate
};