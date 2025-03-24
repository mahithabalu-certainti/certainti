import { Request, Response } from "express";
import {
  createUserSchema,
  enterpriseUserSchema,
  userDetailsUpdateSchema,
  listUserByIdSchema,
  listUserSchema,
  updateUserSchema,
  userReqSchema,
} from "../lib/joi/schemas/schema";
import { errorResponse, successResponse } from "../utils/apiResponse";
import { constants } from "../utils/constant";
import configurations from "../config/config";
import { createAzureB2CUser, updateAzureUser } from "../services/manageUser";
import { generateSecurePassword } from "../utils/generatePassword";
import { sendEmail } from "../services/emailService";
import { mailTemplate } from "../utils/mailTemplate";
import { requestErrorMessages, validateRequest } from "../utils/helpers";

const logger = configurations.getInstance().getLogger();
const services = configurations.getInstance().getServices();

async function createUser(req: Request, res: Response): Promise<void> {
  try {
    const { organization } = req.body;

    const { error: reqErr } = userReqSchema.validate({
      organization
    }, {
      abortEarly: false,
    });

    if (reqErr) {
      errorResponse(res, constants.BAD_REQUEST, constants.BAD_REQUEST_MESSAGE, {
        organization: "organization is required",
      });
      return;
    }

    const value = await validateRequest(
      req,
      organization === constants.PLATFORM_TWO
        ? createUserSchema
        : enterpriseUserSchema,
      organization,
      res
    );

    const password = await generateSecurePassword(12);
    const azureUser = await createAzureB2CUser(value, password);
    if (!azureUser) {
      errorResponse(
        res,
        constants.FAILED,
        constants.FAILED_MESSAGE,
        "Azure AD B2C user creation failed"
      );
      return;
    }

    const user = await services.userServices.createUser(value, azureUser.id);
    const mailContent = mailTemplate(value, password);
    await sendEmail(mailContent);

    if (user.statusCode === constants.SUCCESS) {
      logger.info("Success log: ", {
        timestamp: new Date().toISOString(),
        method: "create user",
      });

      successResponse(res, constants.SUCCESS, constants.SUCCESS_MESSAGE, user);
    } else {
      logger.error("Failed log: ", {
        timestamp: new Date().toISOString(),
        method: "create user",
      });
      errorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        user.error
      );
    }
  } catch (error) {
    const err = error as Error;
    logger.error("Failed log: ", {
      timestamp: new Date().toString(),
      method: "create user",
      message: err.message,
    });
    errorResponse(res, constants.FAILED, constants.FAILED_MESSAGE, err.message);
  }
}

async function updateUser(req: Request, res: Response): Promise<void> {
  try {
    const { organization } = req.body;
    const { error: reqErr } = userReqSchema.validate({
      organization
    }, {
      abortEarly: false,
    });

    if (reqErr) {
      errorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        "organization is required"
      );
      return;
    }

    const value = await validateRequest(
      req,
      organization === constants.PLATFORM_TWO
        ? updateUserSchema
        : userDetailsUpdateSchema,
      organization,
      res
    );

    if(!value){
      return;
    }

    const azureUser = await updateAzureUser(value);
    if (!azureUser) {
      logger.error("Failed log: ", {
        timestamp: new Date().toString(),
        method: "update user",
        message: "Azure AD B2C user update failed",
      });
      errorResponse(
        res,
        constants.FAILED,
        constants.FAILED_MESSAGE,
        "Azure AD B2C user update failed"
      );
      return;
    }

    const user = await services.userServices.updateUser(value, value.rid);

    if (user.statusCode === constants.SUCCESS) {
      logger.info("Success log: ", {
        timestamp: new Date().toISOString(),
        method: "update user",
      });

      successResponse(
        res,
        constants.SUCCESS,
        constants.SUCCESS_MESSAGE,
        user.data
      );
    } else {
      logger.error("Failed log: ", {
        timestamp: new Date().toISOString(),
        method: "update user",
      });
      errorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        user.message
      );
    }
  } catch (error) {
    const err = error as Error;
    logger.error("Failed log: ", {
      timestamp: new Date().toString(),
      method: "update user",
      message: err.message,
    });
    errorResponse(res, constants.FAILED, constants.FAILED_MESSAGE, err.message);
  }
}

const listUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = listUserSchema.validate(req.query, {
      abortEarly: true,
    });

    if (error) {
      const errorMessages = requestErrorMessages(error);
      logger.error("Failed log: ", {
        timestamp: new Date().toString(),
        method: "list user",
        message: "Request validation failed",
      });
      errorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        errorMessages
      );
      return;
    }

    let parsedFilters: Record<string, any> = {};

    try {
      parsedFilters = JSON.parse(value.filters);
    } catch (error) {
      logger.error("Failed log: ", {
        timestamp: new Date().toISOString(),
        method: "list user",
        message: "Invalid filters format. Must be a valid JSON object.",
      });
    }

    const pageNum: number = parseInt(value.page, 10) || 1;
    const limitNum: number = parseInt(value.limit, 10) || 10;

    const result = await services.userServices.listUsers(
      pageNum,
      limitNum,
      value.search,
      parsedFilters,
      value.sortBy,
      value.sortOrder,
      value.organization
    );
    if (result.statusCode === constants.SUCCESS) {
      logger.info("Success log: ", {
        timestamp: new Date().toISOString(),
        method: "list user",
      });

      successResponse(
        res,
        constants.SUCCESS,
        constants.SUCCESS_MESSAGE,
        result.data
      );
      return;
    } else {
      logger.error("Failed log: ", {
        timestamp: new Date().toISOString(),
        method: "list user",
      });
      errorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        result.errorMessage
      );
      return;
    }
  } catch (error) {
    const err = error as Error;
    logger.error("Failed log: ", {
      timestamp: new Date().toString(),
      method: "list user",
      message: err.message,
    });
    errorResponse(res, constants.FAILED, constants.FAILED_MESSAGE, err.message);
  }
};

const listUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: userId } = req.params;

    const { error, value } = listUserByIdSchema.validate(req.query, {
      abortEarly: true,
    });

    if (error) {
      const errorMessages = requestErrorMessages(error);
      logger.error("Failed log: ", {
        timestamp: new Date().toString(),
        method: "list user",
        message: "Request validation failed",
      });
      errorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        errorMessages
      );
      return;
    }

    const result = await services.userServices.listUserById(
      userId,
      value.organization
    );
    if (result.statusCode === constants.SUCCESS) {
      logger.info("Success log: ", {
        timestamp: new Date().toISOString(),
        method: "list user",
      });

      successResponse(
        res,
        constants.SUCCESS,
        constants.SUCCESS_MESSAGE,
        result.data
      );
      return;
    } else {
      logger.error("Failed log: ", {
        timestamp: new Date().toISOString(),
        method: "list user",
      });
      errorResponse(
        res,
        constants.BAD_REQUEST,
        constants.BAD_REQUEST_MESSAGE,
        result.errorMessage
      );
      return;
    }
  } catch (error) {
    const err = error as Error;
    logger.error("Failed log: ", {
      timestamp: new Date().toString(),
      method: "list user",
      message: err.message,
    });
    errorResponse(res, constants.FAILED, constants.FAILED_MESSAGE, err.message);
  }
};

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

export {
  createUser,
  updateUser,
  userRoles,
  userProfiles,
  listUsers,
  listUserById,
};
