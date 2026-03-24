import { Request, Response } from "express";
import {} from "../lib/joi/schemas/schema";
import { errorResponse } from "../utils/apiResponse";
import { constants } from "../utils/constant";
import configurations from "../config/config";

import {
  errorLog,
  handleCustomMessage,
  handleErrorResponse,
  handleSuccessResponse,
  successLog,
} from "../utils/helpers";

const services = configurations.getInstance().getServices();

/**
 * Handles the request to update admin settings for the current user.
 *
 * @param {Request} req The HTTP request object containing headers and body with update data.
 * @param {Response} res The HTTP response object used to send the outcome.
 * @returns {Promise<void>} A promise that resolves once the update request is processed.
 *
 * This function:
 * - Extracts the user ID from request headers and update data from the body.
 * - Validates presence of user ID and update payload.
 * - Calls the settings service to perform the update.
 * - Sends success response if update succeeds.
 * - Logs errors and sends appropriate error responses on failure.
 */
async function updateSettings(req: Request, res: Response): Promise<void> {
  const methodName = "Update Admin settings";
  try {
    const value = req.body;
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      handleErrorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        "User ID is required"
      );
      return;
    }
    if (!value) {
      return;
    }

    const updateResponse = await services.settingsService.updateSettings(
      userId,
      value
    );

    if (updateResponse.statusCode === constants.SUCCESS) {
      successLog(methodName);
      handleCustomMessage(
        res,
        updateResponse.statusCode,
        updateResponse.message,
        updateResponse.data
      );
      return;
    } else {
      errorLog(methodName, updateResponse.errorMessage);
      handleErrorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        updateResponse.errorMessage
      );
      return;
    }
  } catch (error) {
    const err = error as Error;
    errorLog(methodName, err.message);
    handleErrorResponse(
      res,
      constants.FAILED,
      constants.FAILED_MESSAGE,
      err.message
    );
    return;
  }
}

/**
 * Handles the request to list admin settings for the current user.
 *
 * @param {Request} req The HTTP request object containing headers.
 * @param {Response} res The HTTP response object used to send the settings data or errors.
 * @returns {Promise<void>} A promise that resolves once the settings are retrieved and response sent.
 *
 * This function:
 * - Extracts the user ID from request headers and validates its presence.
 * - Calls the settings service to fetch the list of settings for the user.
 * - Sends a success response with the settings data if retrieval succeeds.
 * - Logs errors and sends appropriate error responses on failure.
 */
async function listSettings(req: Request, res: Response): Promise<void> {
  const methodName = "List Admin settings";
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      handleErrorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        "User ID is required"
      );
      return;
    }

    const listResponse = await services.settingsService.listSettings(userId);

    if (listResponse.statusCode === constants.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, listResponse.data);
      return;
    } else {
      errorLog(methodName, listResponse.errorMessage);
      handleErrorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        listResponse.errorMessage
      );
      return;
    }
  } catch (error) {
    const err = error as Error;
    errorLog(methodName, err.message);
    handleErrorResponse(
      res,
      constants.FAILED,
      constants.FAILED_MESSAGE,
      err.message
    );
    return;
  }
}

export { updateSettings, listSettings };
