import { Request, Response } from "express";
import {
  errorLog,
  handleErrorResponse,
  handleSuccessResponse,
  logMessage,
  successLog,
} from "../utils/helpers";
import { HttpStatus, STATUS_MESSAGE } from "../utils/constants";
import configurations from "../config/config";

const services = configurations.getInstance().getServices();
const templateService = services.templateServices;

/**
 * Handles uploading a template file.
 *
 * This method:
 * 1. Validates the presence of the user ID in the request headers.
 * 2. Checks if a file has been uploaded in the request.
 * 3. Calls the template service to process the uploaded file.
 * 4. Sends appropriate success or error responses based on the operation outcome.
 *
 * @param req - Express Request object, expected to have `file` and `body.templateId`
 * @param res - Express Response object used to send back responses
 * @returns Promise resolving to void
 */
async function uploadTemplate(req: Request, res: Response): Promise<any> {
  const methodName = "Upload Template";
  try {
    const userId = req.headers["x-user-id"] as string;
    logMessage("Request received for upload template with data: " + JSON.stringify(req.body) + " and userId: " + userId);

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

    const uploadTemplate = await templateService.uploadTemplate(
      req.file,
      req.body.templateId,
      userId
    );

    if (uploadTemplate.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      return res.status(HttpStatus.SUCCESS).send({
        statusCode : HttpStatus.SUCCESS,
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        statusMessage : STATUS_MESSAGE.templateUploadedSuccess,
        data : uploadTemplate.data
      })
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

/**
 * Handles listing all available templates.
 *
 * This method:
 * 1. Validates the presence of the user ID in the request headers.
 * 2. Calls the template service to retrieve the list of templates.
 * 3. Sends appropriate success or error responses based on the operation outcome.
 *
 * @param req - Express Request object
 * @param res - Express Response object used to send back responses
 * @returns Promise resolving to void
 */
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
  listTemplates,
};
