import { Request, Response } from "express";
import {
  
} from "../lib/joi/schemas/schema";
import { errorResponse } from "../utils/apiResponse";
import { constants } from "../utils/constant";
import configurations from "../config/config";

import {
  errorLog,
  handleErrorResponse,
  handleSuccessResponse,
  successLog,
} from "../utils/helpers";

const services = configurations.getInstance().getServices();

async function updateSettings(req: Request, res: Response): Promise<void> {
  const methodName = "Update Admin settings";
  try {
    const value = req.body;

    // const validatedData = await validateRequest(
    //   req,
    //   createUserGroupSchema,
    //   "",
    //   res,
    //   "POST"
    // );

    // If validation fails, validateRequest will handle the response
    //if (!validatedData) return;

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
