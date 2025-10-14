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
import { exportListNotesSummarySchema, listNotesSummarySchema, createNotesSchema, exportListNotesSchema, listNotesSchema, listNotesByIdSchema, updateNotesSchema } from "../lib/joi/schemas/schema";

const services = configurations.getInstance().getServices();
const notesService = services.notesService;

async function createNotes(req: Request, res: Response): Promise<void> {
  const methodName = "create notes";
  try {
    const value = await validateRequest(req, createNotesSchema, res);
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
    const attachment = await notesService.createNotes(value, userId, req.file);

    if (attachment.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      res.status(attachment.statusCode).json({
        statusCode: attachment.statusCode,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: "Notes created successfully.",  
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

async function getAllNotes(req: Request, res: Response): Promise<void> {
  const methodName = "get all notes";
  try {

    const value = await validateRequest(req, listNotesSchema, res, "GET");
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
    const attachments = await notesService.getNotes(userId,value.attachmentLevel,value.entityId,value.accountRid,value.page,value.limit,value.search,value.filters,value.sortBy,value.sortOrder,value.fiscalYear, {});

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

async function exportAllNotes(req: Request, res: Response): Promise<void> {
  const methodName = "exportAllNotes";
  try {

    const value = await validateRequest(req, exportListNotesSchema, res, "GET");
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
    const attachments = await notesService.exportNotes(userId,value.attachmentLevel,value.entityId,value.accountRid,value.search,value.filters,value.sortBy,value.sortOrder,value.fiscalYear, {}, value.timezone);

    if (attachments.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, await generateExcelBase64(attachments?.data?.notes,"All Attachments"));
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

  async function getAllNotesSummary(req: Request, res: Response): Promise<void>{
     const methodName = "getAllNotesSummary";
  try {

    const value = await validateRequest(req, listNotesSummarySchema, res, "GET");
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
    const attachments = await notesService.getNotesSummary(userId,value.page,value.limit,value.search,value.filters,value.globalFilters,value.sortBy,value.sortOrder,value.fiscalYear);

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

  async function exportAllNotesSummary(req: Request, res: Response): Promise<void>{
     const methodName = "exportAllNotesSummary";
  try {

    const value = await validateRequest(req, exportListNotesSummarySchema, res, "GET");
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
    const attachments = await notesService.exportNotesSummary(userId,value.search,value.filters,value.globalFilters,value.sortBy,value.sortOrder,value.fiscalYear, value.timezone);

    if (attachments.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, await generateExcelBase64(attachments?.data?.notes,"All Attachments Summary"));
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

  async function fetchNotesDetailsById (req : Request, res : Response) : Promise<any> {
    const methodName = "fetchNotesDetailsById"
    try {
      const value = await validateRequest(req, listNotesByIdSchema, res, "GET");
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
      value.user_rid = userId

      const result = await notesService.getNotesDetailsById(value)
      if(result.statusCode === HttpStatus.SUCCESS) {
        return res.status(HttpStatus.SUCCESS).json({
          statusCode : HttpStatus.SUCCESS,
          statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
          statusMessage: result.statusMessage,
          data : result.data
        })
      } else {
        return res.status(HttpStatus.SUCCESS).json({
          statusCode : HttpStatus.SUCCESS,
          statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
          statusMessage : result.statusMessage,
          data : result.data
        })
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

  async function updateNotes(req: Request, res: Response): Promise<void> {
  const methodName = "updateNotes";
  try {
    const value = await validateRequest(req, updateNotesSchema, res);
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

    const attachment = await notesService.updateNotes(value, userId, req?.file);

    if (attachment.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      res.status(attachment.statusCode).json({
        statusCode: attachment.statusCode,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: "Notes updated successfully.",  
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

export default {
  createNotes,
  getAllNotes,
  getAllNotesSummary,
  exportAllNotes,
  exportAllNotesSummary,
  fetchNotesDetailsById,
  updateNotes
}
