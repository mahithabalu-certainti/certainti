import { Request, Response } from "express";
import { errorLog, handleErrorResponse, logMessage, validateAccountSettingRequest, validateProjectSettingRequest } from "../utils/helpers";
import { HttpStatus, STATUS_MESSAGE, UPDATE_FLAG } from "../utils/constants";
import Configurations from "../config/config";

const Services = Configurations.getInstance().getServices();
const settingServices = Services.settingServices;

/**
 * Handles updating of account or project-level settings based on the provided flag.
 *
 * - Extracts and validates the user ID from the request headers.
 * - Depending on the `flag` in the request body (`UPDATE_FLAG.account` or otherwise),
 *   it validates either account or project settings.
 * - If validation passes, it calls the service to update settings.
 * - Sends appropriate HTTP response based on the result of the operation.
 *
 * @param {Request} req - The Express request object containing the settings data and user ID.
 * @param {Response} res - The Express response object used to send back the appropriate HTTP response.
 *
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 */
const settingController = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const userId = req.headers["x-user-id"];
    logMessage("Request received for updating settings with data: " + JSON.stringify(data) + " and userId: " + userId);
    if (!userId) {
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        STATUS_MESSAGE.userIdMissingInHeader
      );
      return;
    }
    if (data.flag == UPDATE_FLAG.account) {
      let validateRequest = validateAccountSettingRequest(data);
      if (validateRequest) {
        errorLog("Validation error in account settings: " + validateRequest);
        handleErrorResponse(
          res,
          HttpStatus.BAD_REQUEST,
          HttpStatus.BAD_REQUEST_MESSAGE,
          validateRequest
        );
        return;
      }
    } else {
      let validateRequest = validateProjectSettingRequest(data);
      if (validateRequest) {
        errorLog("Validation error in account settings: " + validateRequest);
        handleErrorResponse(
          res,
          HttpStatus.BAD_REQUEST,
          HttpStatus.BAD_REQUEST_MESSAGE,
          validateRequest
        );
        return;
      }
    }
    data.userId = userId;
    const result = await settingServices.updateSettings(data);
    if (result.statusCode == HttpStatus.SUCCESS) {
      handleErrorResponse(
        res,
        HttpStatus.SUCCESS,
        HttpStatus.SUCCESS_MESSAGE,
        result.statusMessage
      );
      return;
    } else {
      handleErrorResponse(
        res,
        result.statusCode,
        HttpStatus.BAD_REQUEST_MESSAGE,
        result.statusMessage
      );
      return;
    }
  } catch (error: any) {
    errorLog("Error in settingController: " + error.message);
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
    return;
  }
};

export default {
  settingController,
};
