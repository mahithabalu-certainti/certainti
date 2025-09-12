import { Request, Response } from "express";
import { HttpStatus } from "../utils/constants";
import {
  errorLog,
  handleErrorResponse,
  handleSuccessResponse,
  successLog,
  validateRequest,
} from "../utils/helpers";
import configurations from "../config/config";
import { listInteractionDetailsByIdSchema, updateInteractionResponseSchema } from "../lib/joi/schemas/schema";

const services = configurations.getInstance().getServices();
const interactionService = services.interactionService;

async function updateInteractionResponse(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Update interaction response";
  try {
    console.log(`[${methodName}] Request received`, JSON.stringify(req.body));
    const value = await validateRequest(
      req,
      updateInteractionResponseSchema,
      res
    );

    const authToken = req.headers['authorization'] as string;
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
    const interaction = await interactionService.updateInteractionResponse(
      value,
      userId,
      authToken
    );
    console.log(
      `[${methodName}] Service response:`,
      JSON.stringify(interaction)
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

async function getInteractionDetailsById(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Get interaction details";
  try {
    console.log(`[${methodName}] Request received`, JSON.stringify(req.body));
    const { interactionRid, accountId } = req.params;
    
    const value = await validateRequest(
      req,
      listInteractionDetailsByIdSchema,
      res,
      "GET"
    );

    const authToken = req.headers['authorization'] as string;

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
        value.project_fiscal_rid,
        authToken
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

async function uploadAttachmentToAzure(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Upload attachment to Azure";
  try {
    console.log(`[${methodName}] Request received`);
    //  const value = await validateRequest(req, sendInteractionSchema, res)

    const authToken = req.headers['authorization'] as string;
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

async function deleteAttachmentFromAzure(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Delete attachment from Azure";
  try {
    const authToken = req.headers['authorization'] as string;
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

    if (value.file_url) {
      let deleted = await interactionService.deleteFromAzureBlob(value.file_url, userId, authToken);
      if (
        deleted &&
        deleted.statusCode === HttpStatus.SUCCESS
      ) {
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
  deleteAttachmentFromAzure
};
