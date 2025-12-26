import { Request, Response } from "express";
import { listNotificationSchema } from "../lib/joi/schemas/schema";
import { errorResponse } from "../utils/apiResponse";
import { constants } from "../utils/constant";
import configurations from "../config/config";

import {
  errorLog,
  handleCustomMessage,
  handleErrorResponse,
  handleSuccessResponse,
  successLog,
  validateRequest,
} from "../utils/helpers";

const services = configurations.getInstance().getServices();


/**
 * Controller to list notifications for a user.
 *
 * @param {Request} req - Express request object (expects x-user-id in headers).
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response with notifications data or error.
 *
 * This function:
 * - Extracts the user ID from request headers and validates its presence.
 * - Calls the notification service to fetch the list of notifications for the user.
 * - Sends a success response with the notifications data if retrieval succeeds.
 * - Logs errors and sends appropriate error responses on failure.
 */
async function listNotifications(req: Request, res: Response): Promise<void> {
  const methodName = "List Notifications for User";
  // See function-level comment above
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
     const value = await validateRequest(req, listNotificationSchema, "", res, "GET");

    if (!value) {
      return;
    }

    const listResponse = await services.notificationService.listNotifications(userId,value.limit,value.nextOffset);

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

 /**
   * Controller to update notification status for a user (mark all as read).
   *
   * @param {Request} req - Express request object (expects x-user-id in headers).
   * @param {Response} res - Express response object.
   * @returns {Promise<void>} - Sends a JSON response with update result or error.
   *
   * This function:
   * - Extracts the user ID from request headers and validates its presence.
   * - Calls the notification service to update all unread notifications to read for the user.
   * - Sends a success response with the update result if successful.
   * - Logs errors and sends appropriate error responses on failure.
   */
async function updateNotificationStatus(req: Request, res: Response): Promise<void> {
  const methodName = "Update Notification Status for User";
 
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

    const updateResponse = await services.notificationService.updateNotificationStatus(userId);

    if (updateResponse.statusCode === constants.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, updateResponse.data);
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

async function getWebsocketUrl(req: Request, res: Response): Promise<void> {
  const methodName = "List Notifications for User";
  // See function-level comment above
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
  

    const listResponse = await services.notificationService.getWebsocketUrl(userId);

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

export { listNotifications,updateNotificationStatus,getWebsocketUrl };
