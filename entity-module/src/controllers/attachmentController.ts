import { Request, Response } from "express";
import { HttpStatus } from "../utils/constants";
import {
  errorLog,
  generateExcelBase64,
  handleErrorResponse,
  handleSuccessResponse,
  successLog,
  validateRequest,
} from "../utils/helpers";
import configurations from "../config/config";
import { createAttachmentSchema, exportListAttachmentsSchema, exportListAttachmentSummarySchema, getDocumentTypeAndCategorySchema, listAttachmentsSchema, listAttachmentSummarySchema } from "../lib/joi/schemas/schema";

const services = configurations.getInstance().getServices();
const attachmentService = services.attachmentServices;

async function createAttachment(req: Request, res: Response): Promise<void> {
  const methodName = "create attachment";
  try {
    const value = await validateRequest(req, createAttachmentSchema, res);
     if (!value) {
      return;    }
    const userId = req.headers['x-user-id'] as string;

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
    const attachment = await attachmentService.createAttachment(value, userId, req.file);

    if (attachment.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, attachment.data);
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

async function getAllAttachments(req: Request, res: Response): Promise<void> {
  const methodName = "get all attachments";
  try {

    const value = await validateRequest(req, listAttachmentsSchema, res, "GET");
     if (!value) {
      return;    }
    const userId = req.headers['x-user-id'] as string;

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
    if (typeof value.filters === 'string') {
      try {
        value.filters = JSON.parse(value.filters);
      } catch (err) {
        console.error('Invalid filters JSON:', value.filters);
        value.filters = {};
      }
    }
    const attachments = await attachmentService.getAttachments(userId,value.attachmentLevel,value.entityId,value.accountRid,value.page,value.limit,value.search,value.filters,value.sortBy,value.sortOrder,value.fiscalYear, {});

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

async function exportAllAttachments(req: Request, res: Response): Promise<void> {
  const methodName = "exportAllAttachments";
  try {

    const value = await validateRequest(req, exportListAttachmentsSchema, res, "GET");
     if (!value) {
      return;    }
    const userId = req.headers['x-user-id'] as string;

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
    if (typeof value.filters === 'string') {
      try {
        value.filters = JSON.parse(value.filters);
      } catch (err) {
        console.error('Invalid filters JSON:', value.filters);
        value.filters = {};
      }
    }
    const attachments = await attachmentService.exportAttachments(userId,value.attachmentLevel,value.entityId,value.accountRid,value.search,value.filters,value.sortBy,value.sortOrder,value.fiscalYear, {});

    if (attachments.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, await generateExcelBase64(attachments?.data?.attachments,"All Attachments"));
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

  async function getDocumentTypeAndCategory(req: Request, res: Response): Promise<void> {
      const methodName = "get document type and category";
      try {
        const value = await validateRequest(req, getDocumentTypeAndCategorySchema, res, "GET");
        if (!value) {
          return;      }
        const documentTypeAndCategory = await attachmentService.getDocumentTypeAndCategory(value.category_rid);
    
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

  async function getAllAttachmentSummary(req: Request, res: Response): Promise<void>{
     const methodName = "getAllAttachmentSummary";
  try {

    const value = await validateRequest(req, listAttachmentSummarySchema, res, "GET");
     if (!value) {
      return;    }
    const userId = req.headers['x-user-id'] as string;

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
    if (typeof value.filters === 'string') {
      try {
        value.filters = JSON.parse(value.filters);
      } catch (err) {
        console.error('Invalid filters JSON:', value.filters);
        value.filters = {};
      }
    }
    const attachments = await attachmentService.getAttachmentSummary(userId,value.page,value.limit,value.search,value.filters,value.globalFilters,value.sortBy,value.sortOrder,value.fiscalYear);

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

  async function exportAllAttachmentSummary(req: Request, res: Response): Promise<void>{
     const methodName = "exportAllAttachmentSummary";
  try {

    const value = await validateRequest(req, exportListAttachmentSummarySchema, res, "GET");
     if (!value) {
      return;    }
    const userId = req.headers['x-user-id'] as string;

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
    if (typeof value.filters === 'string') {
      try {
        value.filters = JSON.parse(value.filters);
      } catch (err) {
        console.error('Invalid filters JSON:', value.filters);
        value.filters = {};
      }
    }
    const attachments = await attachmentService.exportAttachmentSummary(userId,value.search,value.filters,value.globalFilters,value.sortBy,value.sortOrder,value.fiscalYear);

    if (attachments.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, await generateExcelBase64(attachments?.data?.attachments,"All Attachments Summary"));
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
  exportAllAttachmentSummary
}
