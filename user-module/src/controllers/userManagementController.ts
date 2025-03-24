import { Request, Response } from "express";
import { constants } from "../utils/constant";
import { errorResponse, successResponse } from "../utils/apiResponse";
import configurations from "../config/config";

const logger = configurations.getInstance().getLogger();
const services = configurations.getInstance().getServices();

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
