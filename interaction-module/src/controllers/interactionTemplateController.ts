import { Request, Response } from "express";
import {
  HttpStatus,
  STATUS_MESSAGE,
  templateFieldMappings,
} from "../utils/constants";
import {
  errorLog,
  generateExcelBase64,
  handleCustomResponse,
  handleErrorResponse,
  handleSuccessResponse,
  isValidTimezone,
  logMessage,
  successLog,
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

/**
 * Handles the creation of an interaction template via an HTTP request.
 *
 * @param {Request} req - Express request object containing headers and body.
 * @param {Response} res - Express response object used to send the response.
 *
 * @returns {Promise<void>} - Sends HTTP response indicating success or failure.
 *
 * @description
 * - Validates the incoming request body against a schema.
 * - Checks for required user ID in headers.
 * - Calls the service layer to create the interaction template.
 * - Sends a success response with created data or an error response with details.
 * - Logs the process steps and errors.
 */
async function createInteractionTemplate(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Create template interaction";
  try {
    const value = await validateRequest(req, createInteractionTemplateSchema, res);
    const userId = req.headers["x-user-id"] as string;
    logMessage(`[${methodName}] Request received, ${JSON.stringify(value)} userId: ${userId}`);
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

/**
 * Handles listing interaction templates with optional filters and pagination.
 *
 * @param {Request} req - Express request object containing headers and body.
 * @param {Response} res - Express response object used to send the response.
 *
 * @returns {Promise<void>} - Sends HTTP response with the list of templates or an error.
 *
 * @description
 * - Validates the incoming request body against a schema.
 * - Checks for required user ID in headers.
 * - Parses filters from the request body.
 * - Calls the service layer to fetch interaction templates.
 * - Returns success response with data or a "data not found" message.
 * - Logs request, responses, and errors.
 */
async function listInteractionTemplates(req: Request, res: Response) {
  const methodName = "listInteractionTemplate";
  try {
    const userId = req.headers["x-user-id"] as string;
    const value = await validateRequest(req, listInteractionTemplatesSchema, res, "POST");
    logMessage(`[${methodName}] Request received, ${JSON.stringify(value)} userId: ${userId}`);
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

    const result = await interactionService.listInteractionTemplates(value,userId,parsedFilters,"list")
    if(result.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: HttpStatus.SUCCESS_NOTIFICATION,
        data: result.data,
      });
    } else {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.dataNotFound,
        data: result.data,
      });
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
    return;
  }
}

/**
 * Handles updating an existing interaction template.
 *
 * @param {Request} req - Express request object containing headers and body.
 * @param {Response} res - Express response object used to send the response.
 *
 * @returns {Promise<void>} - Sends HTTP response with update result or error.
 *
 * @description
 * - Validates the incoming request body against update schema.
 * - Checks for required user ID in headers.
 * - Calls the service layer to update the interaction template.
 * - Sends success response with updated data or error message.
 * - Logs requests, responses, and errors.
 */
async function updateInteractionTemplate(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Update interaction template";
  try {
    const value = await validateRequest(req, updateInteractionTemplateSchema, res);
    const userId = req.headers["x-user-id"] as string;
    logMessage(`[${methodName}] Request received, ${JSON.stringify(value)} userId: ${userId}`);
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

/**
 * Retrieves details of an interaction template by its ID.
 *
 * @param {Request} req - Express request containing `templateRid` in params and `x-user-id` in headers.
 * @param {Response} res - Express response object to send the result.
 *
 * @returns {Promise<void>} - Sends HTTP response with the template details or error.
 *
 * @description
 * - Validates presence of user ID in headers and templateRid in params.
 * - Calls service to fetch interaction template details by ID.
 * - Returns success response with data or error response with message.
 * - Logs all key steps and errors.
 */
async function getInteractionTemplateDetailsById(
  req: Request<{templateRid : string}>,
  res: Response
): Promise<void> {
  const methodName = "Get interaction template details";
  try {
    const { templateRid } = req.params;
    const userId = req.headers["x-user-id"] as string;
    logMessage(`[${methodName}] Request received,  templateRid: ${templateRid} userId: ${userId}`);
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
      errorLog(methodName, "templateRid is required in params");
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

/**
 * Exports an interaction template’s details as an Excel file encoded in base64.
 *
 * @param {Request} req - Express request containing export parameters and user ID in headers.
 * @param {Response} res - Express response to send the exported data or error.
 *
 * @returns {Promise<void>} - Sends a base64 Excel file on success or error response on failure.
 *
 * @description
 * - Validates presence of user ID in headers.
 * - Fetches interaction template details and allowed export fields for the user.
 * - Filters export fields based on user permissions.
 * - Generates an Excel workbook with template info and optionally questions.
 * - Formats dates according to provided timezone or defaults to UTC.
 * - Sends the Excel file as base64 in response or an error if export fails.
 */
async function exportInteractionTemplate(req: Request, res: Response) {
  try {
    const methodName = "exportAllInteractions"
    const data = req.body
    const userId = req.headers["x-user-id"] as string;
     logMessage(`[${methodName}] Request received, ${JSON.stringify(data)} userId: ${userId}`);
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
    const result = await interactionService.getInteractionTemplateDetailsById(
      data.template_rid!
    );
    const allowedFieldsForExport =
      await interactionService.getAllowedExportFields(
        userId,
        "interaction_templates_view_edit"
      );
    const allowedFieldSet = new Set<string>();
    for (const field of allowedFieldsForExport) {
      if (field.read) {
        allowedFieldSet.add(field.field_name);
      }
    }
    const isValidTZ = data.timezone && isValidTimezone(data.timezone);
    const formatDate = (date?: Date) =>
      date
        ? moment(date)
            .tz(isValidTZ ? data.timezone : "UTC")
            .format("YYYY-MM-DD, hh:mm:ss A")
        : null;
    const response = result.data?.interactionDetails;
    if (result.statusCode == HttpStatus.SUCCESS) {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Interaction");
      // Define mapping of field keys to labels and their corresponding values from response
      const fieldMappings: Record<string, { label: string; value: any }> = {
        r_number: { label: "Template ID", value: response?.r_number },
        template_name: {
          label: "Template Name",
          value: response?.template_name,
        },
        interaction_type_rid: {
          label: "Interaction Type",
          value: response?.interaction_type_name,
        },
        interaction_level_rid: {
          label: "Interaction Level",
          value: response?.interaction_level_name,
        },
        status_rid: { label: "Status", value: response?.status_name },
        created_by: {
          label: "Created By",
          value: response?.created_user_name || response?.created_by,
        },
        created_datetime: {
          label: "Created Date",
          value: formatDate(response?.created_datetime),
        },
      };

      // Dynamically build header rows based on allowedFieldSet and fieldMappings
      const headerRows: [string, string][] = [];
      Object.keys(fieldMappings).forEach((field) => {
        if (allowedFieldSet.has(field)) {
          const mapping = fieldMappings[field];
          if (mapping) {
            headerRows.push([mapping.label, String(mapping.value ?? "")]);
          }
        }
      });

      headerRows.forEach((row, idx) => {
        worksheet.addRow(row);
        worksheet.getRow(idx + 1).getCell(1).font = { bold: true };
      });
      // headerSheet.addRow(headers);
      if (allowedFieldSet.has("questions")) {
        worksheet.addRow(["Question No", "Questions", "Notes"]);
        worksheet.getRow(8).eachCell((cell) => {
          cell.font = { bold: true };
        });
        worksheet.columns = [
          { key: "question no", width: 15 },
          { key: "question", width: 50 },
          { key: "notes", width: 30 }
        ];
        response.questions.forEach((item: any) => {
          const plain = item.get ? item.get({ plain: true }) : item;
          const row = worksheet.addRow({
            "question no": plain.question_seq_num,
            question: plain.question,
            notes: ""
          });
        });
      }
      const excelBuffer = await workbook.xlsx.writeBuffer();
      handleSuccessResponse(res, Buffer.from(excelBuffer).toString("base64"));
      return;
    } else {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.dataNotFound,
        data: null,
      });
    }
  } catch (error: any) {
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

/**
 * Exports all interaction templates based on filters and user permissions as a base64-encoded Excel file.
 *
 * @param {Request} req - Express request containing filter criteria, timezone, and user ID in headers.
 * @param {Response} res - Express response to send the exported Excel data or error response.
 *
 * @returns {Promise<void>} - Sends an Excel file encoded as base64 on success or an error response on failure.
 *
 * @description
 * - Validates user ID and request body against the schema.
 * - Parses filters from request body, with error logging for invalid format.
 * - Retrieves interaction templates based on filters and user ID.
 * - Fetches allowed export fields for the user and filters data accordingly.
 * - Formats dates based on provided timezone or defaults to UTC.
 * - Generates a base64-encoded Excel file containing the filtered interaction templates.
 * - Sends the Excel file in response or appropriate error/status messages.
 */
async function exportAllInteractionTemplates(req: Request, res: Response) {
  const methodName = "listInteractionTemplate";
  try {
    const userId = req.headers["x-user-id"] as string;
    const value = await validateRequest(req, listInteractionTemplatesSchema, res, "POST");
    logMessage(`[${methodName}] Request received, ${JSON.stringify(value)} userId: ${userId}`);
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

    const result = await interactionService.listInteractionTemplates(value,userId,parsedFilters,"export")
    const fields = await interactionService.getAllowedExportFields(
      userId,
      "interaction_templates_view_edit"
    );
    const allowedFieldSet = new Set<string>();
    for (const field of fields) {
      if (field.read) {
        allowedFieldSet.add(field.field_name);
      }
    }
    const isValidTZ = value.timezone && isValidTimezone(value.timezone);
    const formatDate = (date?: Date) =>
           date
             ? moment(date).tz(isValidTZ ? value.timezone : 'UTC').format('YYYY-MMM-DD, hh:mm:ss A')
             : null;
    if(result.statusCode === HttpStatus.SUCCESS) {
        const finalStructuredData = result.data?.interactions.length < 1 ? [] : result.data?.interactions.map((d: any) => {
        let resultMap: { [key: string]: any } = {
          "r_number": d.r_number,
          "template_name":d.template_name,
          "status_rid": d.status_name,
          "interaction_level_rid": d.interaction_level_name,
          "interaction_type_rid": d.interaction_type_name,
          "created_by": d.created_user_name,
          "created_datetime":formatDate(d.created_datetime),
          "modified_by": d.modified_user_name,
          "modified_datetime": d.modified_datetime == null ? '' : formatDate(d.modified_datetime),
        };

              // Build exportRecord using allowed fields and resultMap
              const exportRecord: Record<string, any> = {};
              templateFieldMappings.forEach((mapping) => {
                if (allowedFieldSet.has(mapping.permissionField)) {
                  exportRecord[mapping.exportField] =
                    resultMap[mapping.dataField];
                }
              });

              return exportRecord;
            });
      const base64Response = await generateExcelBase64(
        finalStructuredData,
        "Template_Interactions"
      );
      handleSuccessResponse(res, base64Response);
    } else {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: STATUS_MESSAGE.dataNotFound,
        data: result.data,
      });
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
    return;
  }
}

export default {
  createInteractionTemplate,
  listInteractionTemplates,
  updateInteractionTemplate,
  getInteractionTemplateDetailsById,
  exportInteractionTemplate,
  exportAllInteractionTemplates,
};
