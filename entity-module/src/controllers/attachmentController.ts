import { Request, Response } from "express";
import { HttpStatus } from "../utils/constants";
import {
  errorLog,
  generateExcelBase64,
  handleErrorResponse,
  handleSuccessResponse,
  logMessage,
  successLog,
  validateRequest,
} from "../utils/helpers";
import configurations from "../config/config";
import {
  createAttachmentSchema,
  exportListAttachmentsSchema,
  exportListAttachmentSummarySchema,
  getDocumentTypeAndCategorySchema,
  listAttachmentsSchema,
  listAttachmentSummarySchema,
} from "../lib/joi/schemas/schema";

const services = configurations.getInstance().getServices();
const attachmentService = services.attachmentServices;

/**
 * Handles the creation of a new attachment.
 *
 * This async function validates the incoming request body and file upload,
 * ensures that a user ID is present in the request headers,
 * and delegates the creation logic to the attachment service.
 * It returns appropriate success or error responses based on the operation result.
 *
 * @param {Request} req - Express request object containing attachment data, headers, and file.
 * @param {Response} res - Express response object used to return the operation result.
 *
 * @returns {Promise<void>} - Resolves after sending a success or error response to the client.
 *
 * @throws {Error} - Throws if validation fails or the service encounters an error.
 */
async function createAttachment(req: Request, res: Response): Promise<void> {
  const methodName = "create attachment";
  try {
    const value = await validateRequest(req, createAttachmentSchema, res);
    if (!value) {
      return;
    }
    const userId = req.headers["x-user-id"] as string;
    logMessage(
      "Request received for create attachment with data: " +
        JSON.stringify(req.body) +
        " and userId: " +
        userId
    );

    if (!userId) {
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User id is required"
      );
      return;
    }

    if (!req.file) {
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "File is required"
      );
      return;
    }
    const attachment = await attachmentService.createAttachment(
      value,
      userId,
      req.file
    );

    if (attachment.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      res.status(attachment.statusCode).json({
        statusCode: attachment.statusCode,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: "Attachment uploaded successfully.",
        data: attachment.data,
      });
      return;
    } else {
      errorLog(methodName, attachment.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        attachment.errorMessage
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
 * Retrieves a paginated list of attachments based on query parameters.
 *
 * Validates request parameters, ensures a user ID is present,
 * parses filter JSON if necessary, and calls the attachment service
 * to fetch the filtered and sorted attachments.
 *
 * @param {Request} req - Express request object containing filters and pagination in query and headers.
 * @param {Response} res - Express response object used to return the list of attachments.
 *
 * @returns {Promise<void>} - Resolves after sending a list or error response to the client.
 *
 * @throws {Error} - Throws if validation or service interaction fails.
 */
async function getAllAttachments(req: Request, res: Response): Promise<void> {
  const methodName = "get all attachments";
  try {
    const value = await validateRequest(req, listAttachmentsSchema, res, "GET");
    if (!value) {
      return;
    }
    const userId = req.headers["x-user-id"] as string;
    logMessage(
      "Request received for get all attachments with query params: " +
        JSON.stringify(value) +
        " and userId: " +
        userId
    );

    if (!userId) {
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User id is required"
      );
      return;
    }

    // Before calling buildRawWhereClause
    if (typeof value.filters === "string") {
      try {
        value.filters = JSON.parse(value.filters);
      } catch (err) {
        logMessage(`Invalid filters JSON: ${value.filters}`);
        value.filters = {};
      }
    }
    const attachments = await attachmentService.getAttachments(
      userId,
      value.attachmentLevel,
      value.entityId,
      value.accountRid,
      value.page,
      value.limit,
      value.search,
      value.filters,
      value.sortBy,
      value.sortOrder,
      value.fiscalYear,
      {},
      value.type
    );

    if (attachments.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, attachments.data);
      return;
    } else {
      errorLog(methodName, attachments.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        attachments.errorMessage
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
 * Exports all matching attachments as an Excel file in base64 format.
 *
 * Validates query parameters, ensures the presence of a user ID in headers,
 * parses filters if provided as a string, and uses the service to fetch data.
 * The result is then converted into an Excel file and returned in base64 format.
 *
 * @param {Request} req - Express request object containing export parameters in query and user ID in headers.
 * @param {Response} res - Express response object used to return the base64-encoded Excel file.
 *
 * @returns {Promise<void>} - Resolves after sending the file or error response to the client.
 *
 * @throws {Error} - Throws if validation or export logic fails.
 */
async function exportAllAttachments(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "exportAllAttachments";
  try {
    const value = await validateRequest(
      req,
      exportListAttachmentsSchema,
      res,
      "GET"
    );
    if (!value) {
      return;
    }
    const userId = req.headers["x-user-id"] as string;
    logMessage(
      "Request received for export all attachments with query params: " +
        JSON.stringify(value) +
        " and userId: " +
        userId
    );

    if (!userId) {
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User id is required"
      );
      return;
    }

    // Before calling buildRawWhereClause
    if (typeof value.filters === "string") {
      try {
        value.filters = JSON.parse(value.filters);
      } catch (err) {
        logMessage(`Invalid filters JSON: ${value.filters}`);
        value.filters = {};
      }
    }
    const attachments = await attachmentService.exportAttachments(
      userId,
      value.attachmentLevel,
      value.entityId,
      value.accountRid,
      value.search,
      value.filters,
      value.sortBy,
      value.sortOrder,
      value.fiscalYear,
      {},
      value.timezone,
      value.type
    );

    if (attachments.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(
        res,
        await generateExcelBase64(
          attachments?.data?.attachments,
          "All Attachments"
        )
      );
      return;
    } else {
      errorLog(methodName, attachments.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        attachments.errorMessage
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
 * Retrieves document types and categories based on the provided category RID.
 *
 * Validates the request, then fetches matching document types and categories
 * from the attachment service.
 *
 * @param {Request} req - Express request object containing the category_rid in the query.
 * @param {Response} res - Express response object used to return the data or error.
 *
 * @returns {Promise<void>} - Resolves after responding with the document type and category data or an error.
 *
 * @throws {Error} - Throws if validation fails or the service call fails.
 */
async function getDocumentTypeAndCategory(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "get document type and category";
  try {
    const value = await validateRequest(
      req,
      getDocumentTypeAndCategorySchema,
      res,
      "GET"
    );
    if (!value) {
      return;
    }
    logMessage(
      "Request received for get document type and category with query params: " +
        JSON.stringify(value)
    );
    const documentTypeAndCategory =
      await attachmentService.getDocumentTypeAndCategory(value.category_rid);

    if (documentTypeAndCategory.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, documentTypeAndCategory.data);
      return;
    } else {
      errorLog(methodName, documentTypeAndCategory.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        documentTypeAndCategory.errorMessage
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
 * Retrieves a paginated summary of all attachments based on filters and search parameters.
 *
 * Validates request query parameters, parses filters if necessary, and requires a valid user ID.
 * Calls the attachment service to retrieve a summary view of attachments.
 *
 * @param {Request} req - Express request object with summary filters, pagination, and user ID.
 * @param {Response} res - Express response object used to send the summary data or an error.
 *
 * @returns {Promise<void>} - Resolves after responding with the attachment summary or error.
 *
 * @throws {Error} - Throws if validation or service interaction fails.
 */
async function getAllAttachmentSummary(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "getAllAttachmentSummary";
  try {
    const value = await validateRequest(
      req,
      listAttachmentSummarySchema,
      res,
      "POST"
    );
    if (!value) {
      return;
    }
    const userId = req.headers["x-user-id"] as string;
    logMessage(
      "Request received for get all attachment summary with query params: " +
        JSON.stringify(value) +
        " and userId: " +
        userId
    );

    if (!userId) {
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User id is required"
      );
      return;
    }

    // Before calling buildRawWhereClause
    if (typeof value.filters === "string") {
      try {
        value.filters = JSON.parse(value.filters);
      } catch (err) {
        logMessage(`Invalid filters JSON: ${value.filters}`);
        value.filters = {};
      }
    }
    const attachments = await attachmentService.getAttachmentSummary(
      userId,
      value.page,
      value.limit,
      value.search,
      value.filters,
      value.globalFilters,
      value.sortBy,
      value.sortOrder,
      value.fiscalYear
    );

    if (attachments.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, attachments.data);
      return;
    } else {
      errorLog(methodName, attachments.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        attachments.errorMessage
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
 * Exports a summary of all attachments based on filters and search parameters into an Excel file.
 *
 * Validates query parameters, parses filters if necessary, and ensures the presence of a user ID.
 * Calls the service to fetch attachment summary data, which is then exported as a base64 Excel file.
 *
 * @param {Request} req - Express request object containing export filters and user ID.
 * @param {Response} res - Express response object used to send the exported summary file or an error.
 *
 * @returns {Promise<void>} - Resolves after sending the Excel base64 or error response.
 *
 * @throws {Error} - Throws if validation or export logic fails.
 */
async function exportAllAttachmentSummary(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "exportAllAttachmentSummary";
  try {
    const value = await validateRequest(
      req,
      exportListAttachmentSummarySchema,
      res,
      "POST"
    );
    if (!value) {
      return;
    }
    const userId = req.headers["x-user-id"] as string;
    logMessage(
      "Request received for export all attachment summary with query params: " +
        JSON.stringify(value) +
        " and userId: " +
        userId
    );

    if (!userId) {
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User id is required"
      );
      return;
    }

    // Before calling buildRawWhereClause
    if (typeof value.filters === "string") {
      try {
        value.filters = JSON.parse(value.filters);
      } catch (err) {
        logMessage(`Invalid filters JSON: ${value.filters}`);
        value.filters = {};
      }
    }
    const attachments = await attachmentService.exportAttachmentSummary(
      userId,
      value.search,
      value.filters,
      value.globalFilters,
      value.sortBy,
      value.sortOrder,
      value.fiscalYear,
      value.timezone
    );

    if (attachments.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(
        res,
        await generateExcelBase64(
          attachments?.data?.attachments,
          "All Attachments Summary"
        )
      );
      return;
    } else {
      errorLog(methodName, attachments.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        attachments.errorMessage
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
  createAttachment,
  getAllAttachments,
  getDocumentTypeAndCategory,
  getAllAttachmentSummary,
  exportAllAttachments,
  exportAllAttachmentSummary,
};
