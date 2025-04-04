import { Request, Response } from "express";
import { constants } from "../utils/constant";
import { errorResponse, successResponse } from "../utils/apiResponse";
import configurations from "../config/config";

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
  try {
    const roles = await services.userServices.roles();

    if (roles.statusCode === constants.SUCCESS) {
      logger.info("Success log: ", {
        timestamp: new Date().toISOString(),
        method: "get roles",
      });

      successResponse(
        res,
        constants.SUCCESS,
        constants.SUCCESS_MESSAGE,
        roles.data
      );
    } else {
      logger.error("Failed log: ", {
        timestamp: new Date().toISOString(),
        method: "get roles",
      });
      errorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        roles.message
      );
    }
  } catch (error) {
    const err = error as Error;
    logger.error("Failed log: ", {
      timestamp: new Date().toString(),
      method: "get roles",
      message: err.message,
    });
    errorResponse(res, constants.FAILED, constants.FAILED_MESSAGE, err.message);
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
  try {
    const profiles = await services.userServices.profiles();

    if (profiles.statusCode === constants.SUCCESS) {
      logger.info("Success log: ", {
        timestamp: new Date().toISOString(),
        method: "get profiles",
      });

      successResponse(
        res,
        constants.SUCCESS,
        constants.SUCCESS_MESSAGE,
        profiles.data
      );
    } else {
      logger.error("Failed log: ", {
        timestamp: new Date().toISOString(),
        method: "get roles",
      });
      errorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        profiles.message
      );
    }
  } catch (error) {
    const err = error as Error;
    logger.error("Failed log: ", {
      timestamp: new Date().toString(),
      method: "get profiles",
      message: err.message,
    });
    errorResponse(res, constants.FAILED, constants.FAILED_MESSAGE, err.message);
  }
}

export { userProfiles, userRoles };
