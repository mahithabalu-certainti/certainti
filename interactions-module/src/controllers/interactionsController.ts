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
import {
  createInteractionSchema,
  updateInteractionResponseSchema,
  updateInteractionSchema,
} from "../lib/joi/schemas/schema";

// import Joi schemas and interaction services as needed

const services = configurations.getInstance().getServices();
const interactionService = services.interactionService;
async function createInteraction(req: Request, res: Response): Promise<void> {
  const methodName = "Create interaction";
  try {
    console.log(`[${methodName}] Request received`);
    const value = await validateRequest(req, createInteractionSchema, res);
    const userId = req.headers["x-user-id"] as string;
    console.log(`[${methodName}] userId:`, userId);
    console.log(`[${methodName}] request body:`, JSON.stringify(value));
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
    const interaction = await interactionService.createInteraction(
      value,
      userId
    );
    console.log(
      `[${methodName}] Service response:`,
      JSON.stringify(interaction)
    );
    if (interaction.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      console.log(`[${methodName}] Success:`, JSON.stringify(interaction.data));
      handleSuccessResponse(res, interaction.data);
      return;
    } else {
      errorLog(methodName, interaction.errorMessage);
      console.log(`[${methodName}] Error:`, interaction.errorMessage);
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
    console.log(`[${methodName}] Exception:`, error);
    handleErrorResponse(
      res,
      HttpStatus.BAD_REQUEST,
      HttpStatus.BAD_REQUEST_MESSAGE,
      error.message
    );
    return;
  }
}

async function updateInteraction(req: Request, res: Response): Promise<void> {
  const methodName = "Update interaction";
  try {
    console.log(`[${methodName}] Request received`);
    const value = await validateRequest(req, updateInteractionSchema, res);
    const userId = req.headers["x-user-id"] as string;
    console.log(`[${methodName}] userId:`, userId);
    console.log(`[${methodName}] request body:`, JSON.stringify(value));
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
    const interaction = await interactionService.updateInteraction(
      value,
      userId
    );
    console.log(
      `[${methodName}] Service response:`,
      JSON.stringify(interaction)
    );
    if (interaction.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      console.log(`[${methodName}] Success:`, JSON.stringify(interaction.data));
      handleSuccessResponse(res, interaction.data);
      return;
    } else {
      errorLog(methodName, interaction.errorMessage);
      console.log(`[${methodName}] Error:`, interaction.errorMessage);
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

async function updateInteractionResponse(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Update interaction response";
  try {
    console.log(`[${methodName}] Request received`);
    const value = await validateRequest(
      req,
      updateInteractionResponseSchema,
      res
    );
    const userId = req.headers["x-user-id"] as string;
    console.log(`[${methodName}] userId:`, userId);
    console.log(`[${methodName}] request body:`, JSON.stringify(value));
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
      userId
    );
    console.log(
      `[${methodName}] Service response:`,
      JSON.stringify(interaction)
    );
    if (interaction.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      console.log(`[${methodName}] Success:`, JSON.stringify(interaction.data));
      handleSuccessResponse(res, interaction.data);
      return;
    } else {
      errorLog(methodName, interaction.errorMessage);
      console.log(`[${methodName}] Error:`, interaction.errorMessage);
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

async function getInteractionDetailsById(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Get interaction details";
  try {
    console.log(`[${methodName}] Request received`);
    const { interactionRid, accountId } = req.params;
    const userId = req.headers["x-user-id"] as string;
    console.log(
      `[${methodName}] userId: ${userId}, interactionRid: ${interactionRid}, accountId: ${accountId}`
    );

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
        accountId
      );
    console.log(
      `[${methodName}] Service response:`,
      JSON.stringify(interactionDetails)
    );
    if (interactionDetails.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      console.log(
        `[${methodName}] Success:`,
        JSON.stringify(interactionDetails.data)
      );
      handleSuccessResponse(res, interactionDetails.data);
      return;
    } else {
      errorLog(methodName, interactionDetails.errorMessage);
      console.log(`[${methodName}] Error:`, interactionDetails.errorMessage);
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
    console.log(`[${methodName}] Exception:`, error);
    handleErrorResponse(
      res,
      HttpStatus.BAD_REQUEST,
      HttpStatus.BAD_REQUEST_MESSAGE,
      error.message
    );
    return;
  }
}
async function getInteractionQuestionsById(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Get interaction questions";
  try {
    const { interactionRid, accountId } = req.params;
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

    if (!interactionRid || !accountId) {
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "interactionRid and accountId are required in params"
      );
      return;
    }

    const interactionDetails =
      await interactionService.getInteractionQuestionsById(
        interactionRid,
        accountId
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
async function getInteractionStatus(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Get resource roles";
  try {
    const interactionStatus = await interactionService.getInteractionStatus();
    if (interactionStatus.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, interactionStatus.data);
      return;
    } else {
      errorLog(methodName, interactionStatus.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        interactionStatus.errorMessage
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

async function getInteractionTypes(req: Request, res: Response): Promise<void> {
  const methodName = "Get interaction types";
  try {
    const interactionTypes = await interactionService.getInteractionTypes();
    if (interactionTypes.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, interactionTypes.data);
      return;
    } else {
      errorLog(methodName, interactionTypes.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        interactionTypes.errorMessage
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

async function getInteractionSource(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Get interaction source";
  try {
    const interactionSource = await interactionService.getInteractionSource();
    if (interactionSource.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, interactionSource.data);
      return;
    } else {
      errorLog(methodName, interactionSource.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        interactionSource.errorMessage
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
  createInteraction,
  updateInteraction,
  updateInteractionResponse,
  getInteractionStatus,
  getInteractionTypes,
  getInteractionSource,
  getInteractionDetailsById,
  getInteractionQuestionsById,
};
