import { Request, Response } from "express";
import {
  errorLog,
  handleErrorResponse,
  handleSuccessResponse,
  successLog,
} from "../utils/helpers";
import { HttpStatus } from "../utils/constants";
import configurations from "../config/config";

const services = configurations.getInstance().getServices();
const templateService = services.templateServices;

async function uploadTemplate(req: Request, res: Response): Promise<void> {
  const methodName = "Upload Template";
  try {
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

    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const uploadTemplate = await templateService.uploadTemplate(req.file, req.body.templateId, userId);

    if (uploadTemplate.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, uploadTemplate.data);
      return;
    } else {
      errorLog(methodName, uploadTemplate.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        uploadTemplate.errorMessage
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

async function listTemplates(req: Request, res: Response): Promise<void> {
  const methodName = "List Template";
  try {
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

    const uploadTemplate = await templateService.listTemplates();

    if (uploadTemplate.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, uploadTemplate.data);
      return;
    } else {
      errorLog(methodName, uploadTemplate.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        uploadTemplate.errorMessage
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
  uploadTemplate,
  listTemplates
};
