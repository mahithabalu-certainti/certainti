import { Request, Response } from "express";
import { constants } from "../utils/constant";
import { errorResponse, successResponse } from "../utils/apiResponse";
import configurations from "../config/config";
import { ParsedQs } from "qs";
import {
  errorLog,
  handleErrorResponse,
  handleSuccessResponse,
  successLog,
} from "../utils/helpers";

const logger = configurations.getInstance().getLogger();
const services = configurations.getInstance().getServices();

/**
 * Fetches the user roles from the service and returns them in the response.
 * Logs success or failure depending on the outcome.
 *
 * @param {Request} req - The Express request object containing any necessary request data.
 * @param {Response} res - The Express response object used to send the response back to the client.
 * @returns {Promise<void>} - A promise that resolves when the user roles are fetched and the response is sent.
 *
 * @throws {Error} - Throws an error if the request to fetch roles fails at any step.
 */
async function userRoles(req: Request, res: Response): Promise<void> {
  const methodName = "User roles";
  try {
    const roles = await services.userServices.roles();

    if (roles.statusCode === constants.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, roles.data);
    } else {
      errorLog(methodName, roles.errorMessage);
      handleErrorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        roles.errorMessage
      );
    }
  } catch (error) {
    const err = error as Error;
    errorLog(methodName, err.message);
    handleErrorResponse(res, constants.FAILED, constants.FAILED_MESSAGE, err.message);
  }
}

/**
 * Fetches the user profiles from the service and returns them in the response.
 * Logs success or failure depending on the outcome.
 *
 * @param {Request} req - The Express request object containing any necessary request data.
 * @param {Response} res - The Express response object used to send the response back to the client.
 * @returns {Promise<void>} - A promise that resolves when the user profiles are fetched and the response is sent.
 *
 * @throws {Error} - Throws an error if the request to fetch profiles fails at any step.
 */
async function userProfiles(req: Request, res: Response): Promise<void> {
  const methodName = "User profiles"
  try {
    const profiles = await services.userServices.profiles();

    if (profiles.statusCode === constants.SUCCESS) {
      successLog(methodName)
      handleSuccessResponse(
        res,
        profiles.data
      );
    } else {
      errorLog(methodName, profiles.errorMessage);
      handleErrorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        profiles.errorMessage
      );
    }
  } catch (error) {
    const err = error as Error;
    errorLog(methodName, err.message);
    handleErrorResponse(res, constants.FAILED, constants.FAILED_MESSAGE, err.message);
  }
}

// ... existing code ...
async function userPermissionFields(req: Request, res: Response): Promise<void> {
  const methodName = "User permission fields";
  try {
    const userId: string = req.params.userId;
    let permissionIds = req.query.id;

    if (!userId || !permissionIds) {
      errorLog(methodName, "userId and permission ids are required");
      handleErrorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        "userId and permission ids are required"
      );
      return;
    }

    if (typeof permissionIds === "string") {
      permissionIds = permissionIds.split(",");
    } else {
      permissionIds = [];
    }

    // Ensure permissionIds is string[]
    const permissionIdsArr: string[] = (permissionIds as Array<string | ParsedQs>)
      .map(id => typeof id === "string" ? id : String(id));

    const result = await services.userServices.getPermissionFieldsByIds(userId, permissionIdsArr);

    successLog(methodName);
    handleSuccessResponse(res, result);
  } catch (err: any) {
    errorLog("User permission fields", err.message);
    handleErrorResponse(
      res,
      constants.FAILED,
      constants.FAILED_MESSAGE,
      err.message
    );
  }
}
// ... existing code ...
async function userPermissionById(req: Request, res: Response): Promise<void> {
  const methodName = "User permission by ID";
  try {
    const userAzureId = req.params.id;
    const userRole = await services.userServices.permissionById(userAzureId);
    if (userRole.statusCode === constants.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, userRole.data);
    } else {
      errorLog(methodName, userRole.errorMessage);
      handleErrorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        userRole.errorMessage
      );
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
  }
}

export { userProfiles, userRoles, userPermissionById, userPermissionFields};
