import { Request, Response } from "express";
import { HttpStatus } from "../utils/constants";
import {
  errorLog,
  handleErrorResponse,
  handleSuccessResponse,
  logMessage,
  successLog,
  validateRequest,
} from "../utils/helpers";
import configurations from "../config/config";
import {
  listInteractionDetailsByIdSchema,
  updateInteractionResponseSchema,
} from "../lib/joi/schemas/schema";

const services = configurations.getInstance().getServices();
const interactionService = services.interactionService;

/**
 * Updates an interaction response based on the provided request data.
 *
 * This function validates the request body using a schema, extracts the required authentication
 * and user information from the request headers, and invokes the interaction service to update
 * the interaction response. It handles all response statuses including success and error scenarios.
 *
 * @param {Request} req - The Express request object containing the interaction response data in the body and user/auth headers.
 * @param {Response} res - The Express response object used to send back the result of the update operation.
 *
 * @returns {Promise<void>} - A promise that resolves once the response is sent.
 *
 * @throws {Error} - Throws an error if validation fails, required headers are missing, or the service operation fails.
 */
async function updateInteractionResponse(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Update interaction response";
  try {
   
    const value = await validateRequest(
      req,
      updateInteractionResponseSchema,
      res
    );

    const authToken = req.headers["authorization"] as string;
    const userId = req.headers["x-user-id"] as string;
     logMessage(`[${methodName}] Request received, ${JSON.stringify(req.body)} userId: ${userId}`);
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
      userId,
      authToken
    );
  
    if (interaction.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, interaction.data);
      return;
    } else {
      errorLog(methodName, interaction.errorMessage);
      handleErrorResponse(
        res,
        interaction.statusCode,
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
 * Retrieves detailed information for a specific interaction by its RID and associated account ID.
 *
 * This function validates the request parameters and headers, ensures required identifiers
 * are present, and calls the interaction service to fetch detailed interaction data.
 * It handles all response statuses including validation errors, missing headers, and service-level errors.
 *
 * @param {Request} req - The Express request object containing path parameters (interactionRid, accountId), headers, and optional query data.
 * @param {Response} res - The Express response object used to return interaction details or error responses.
 *
 * @returns {Promise<void>} - A promise that resolves once the response is sent back to the client.
 *
 * @throws {Error} - Throws an error if required parameters or headers are missing, validation fails, or the service call encounters an issue.
 */
async function getInteractionDetailsById(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Get interaction details";
  try {
    const { interactionRid, accountId } = req.params;

    const value = await validateRequest(
      req,
      listInteractionDetailsByIdSchema,
      res,
      "GET"
    );

    const authToken = req.headers["authorization"] as string;

    const userId = req.headers["x-user-id"] as string;
    logMessage(`[${methodName}] interactionRid: ${interactionRid}, accountId: ${accountId}, userId: ${userId}`);
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
        accountId,
        userId,
        authToken
      );
   
    if (interactionDetails.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, interactionDetails.data);
      return;
    } else {
      errorLog(methodName, interactionDetails.errorMessage);
      handleErrorResponse(
        res,
        interactionDetails.statusCode,
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
 * Uploads an attachment to Azure Blob Storage and associates it with an interaction.
 *
 * This function handles file upload from a multipart/form-data request, extracts required headers
 * and metadata, and delegates the actual upload logic to the `interactionService.uploadAttachment` method.
 * It validates the presence of the user ID and file, handles success and error responses appropriately,
 * and returns metadata about the uploaded file on success.
 *
 * @param {Request} req - The Express request object containing the file in `req.file`, metadata in `req.body`,
 * and headers (`authorization`, `x-user-id`).
 *
 * @param {Response} res - The Express response object used to return the result of the upload operation.
 *
 * @returns {Promise<void>} - A promise that resolves once the response has been sent back to the client.
 *
 * @throws {Error} - Throws an error if the user ID is missing, no file is uploaded, or if the upload process fails.
 */
async function uploadAttachmentToAzure(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Upload attachment to Azure";
  try {
    //  const value = await validateRequest(req, sendInteractionSchema, res)

    const authToken = req.headers["authorization"] as string;
    const userId = req.headers["x-user-id"] as string;
    let value = req.body;
    logMessage(`[${methodName}] Request received, ${JSON.stringify(req.body)} userId: ${userId}`);
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

    if (req.file) {
      let fileInfo = await interactionService.uploadAttachment(
        req.file,
        value?.account_rid,
        value?.interaction_rid,
        value?.project_rid,
        userId,
        authToken
      );
      if (
        fileInfo &&
        fileInfo.statusCode === HttpStatus.SUCCESS &&
        fileInfo.data
      ) {
        handleSuccessResponse(res, {
          fileName: fileInfo.data?.fileName,
          fileSize: fileInfo.data?.fileSize,
          fileType: fileInfo.data?.fileType,
          fileUrl: fileInfo.data?.fileUrl,
        });
        return;
      } else {
        handleErrorResponse(
          res,
          fileInfo.statusCode,
          HttpStatus.BAD_REQUEST_MESSAGE,
          fileInfo.errorMessage
        );
        return;
      }
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

/**
 * Deletes an attachment from Azure Blob Storage based on the provided file URL.
 *
 * This function receives the file URL from the request body and deletes the corresponding
 * file from Azure Blob Storage using the `interactionService.deleteFromAzureBlob` method.
 * It also ensures the presence of required headers (user ID and authorization token)
 * and handles success and error scenarios gracefully.
 *
 * @param {Request} req - The Express request object containing the file URL in `req.body`,
 * along with headers for `authorization` and `x-user-id`.
 *
 * @param {Response} res - The Express response object used to return the result of the deletion operation.
 *
 * @returns {Promise<void>} - A promise that resolves once the deletion response has been sent to the client.
 *
 * @throws {Error} - Throws an error if the user ID is missing, the file URL is not provided,
 * or if deletion from Azure fails for any reason.
 */
async function deleteAttachmentFromAzure(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Delete attachment from Azure";
  try {
    const authToken = req.headers["authorization"] as string;
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
      logMessage(`[${methodName}] Request received, ${JSON.stringify(req.body)} userId: ${userId}`);

    if (value.file_url) {
      let deleted = await interactionService.deleteFromAzureBlob(
        value.file_url,
        userId,
        authToken
      );
      if (deleted && deleted.statusCode === HttpStatus.SUCCESS) {
        handleSuccessResponse(res, deleted);
        return;
      } else {
        handleErrorResponse(
          res,
          deleted.statusCode,
          HttpStatus.BAD_REQUEST_MESSAGE,
          deleted.errorMessage
        );
        return;
      }
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
  updateInteractionResponse,
  getInteractionDetailsById,
  uploadAttachmentToAzure,
  deleteAttachmentFromAzure,
};
