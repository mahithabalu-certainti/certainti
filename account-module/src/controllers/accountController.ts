import { Request, Response } from "express";
import { errorResponse, successResponse } from "../utils/apiResponse";
import { HttpStatus } from "../utils/constant";
import configurations from "../config/config";
import { validateRequest } from "../utils/helpers";
import {
  accountSchema,
  listAccountSchema,
  updateAccountSchema,
} from "../lib/joi/schemas/schema";

const logger = configurations.getInstance().getLogger();
const services = configurations.getInstance().getServices();
const accountServices = services.accountServices;

/**
 * @async
 * @function accounts
 * @description Handles the retrieval of account information.
 *
 * @param {Request} req - Express Request object.
 * @param {Response} res - Express Response object.
 * @returns {Promise<void>} - Sends a JSON response with account data on success,
 * or an error message on failure.
 */
async function accounts(req: Request, res: Response): Promise<void> {
  const methodName = "account";
  try {
    const value = await validateRequest(req, listAccountSchema, res, "GET");

    let parsedFilters: Record<string, any> = {};

    if (!value) {
      return;
    }

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

    const accounts = await accountServices.accountList(
      pageNum,
      limitNum,
      value.search,
      parsedFilters,
      value.sortBy,
      value.sortOrder
    );

    if (accounts.statusCode === HttpStatus.SUCCESS) {
      logger.info("Success log: ", {
        timestamp: new Date().toISOString(),
        method: methodName,
      });

      successResponse(
        res,
        HttpStatus.SUCCESS,
        HttpStatus.SUCCESS_MESSAGE,
        accounts.data
      );
    } else {
      logger.error("Failed log: ", {
        timestamp: new Date().toISOString(),
        method: methodName,
      });
      errorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        accounts.message
      );
    }
  } catch (err) {
    const error = err as Error;
    logger.error("Failed log: ", {
      timestamp: new Date().toString(),
      method: methodName,
      message: error.message,
    });

    errorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

async function createAccount(req: Request, res: Response): Promise<void> {
  try {
    const value = await validateRequest(req, accountSchema, res);

    if (!value) {
      return;
    }

    const account = await accountServices.createAccount(value);

    if (account.statusCode === HttpStatus.SUCCESS) {
      logger.info("Success log: ", {
        timestamp: new Date().toISOString(),
        method: "create account",
      });

      successResponse(
        res,
        HttpStatus.SUCCESS,
        HttpStatus.SUCCESS_MESSAGE,
        account.data
      );
    } else {
      logger.error("Failed log: ", {
        timestamp: new Date().toISOString(),
        method: "create account",
      });
      errorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        account.errorMessage || account.message
      );
    }
  } catch (err) {
    const error = err as Error;
    logger.error("Failed log: ", {
      timestamp: new Date().toString(),
      method: "create account",
      message: error.message,
    });

    errorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

async function updateAccount(req: Request, res: Response): Promise<void> {
  try {
    const value = await validateRequest(req, updateAccountSchema, res);

    if (!value) {
      return;
    }

    const account = await accountServices.updateAccount(value);

    if (account.statusCode === HttpStatus.SUCCESS) {
      logger.info("Success log: ", {
        timestamp: new Date().toISOString(),
        method: "update account",
      });

      successResponse(
        res,
        HttpStatus.SUCCESS,
        HttpStatus.SUCCESS_MESSAGE,
        account.data
      );
    } else {
      logger.error("Failed log: ", {
        timestamp: new Date().toISOString(),
        method: "update account",
      });
      errorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        account.errorMessage || account.message
      );
    }
  } catch (err) {
    const error = err as Error;
    logger.error("Failed log: ", {
      timestamp: new Date().toString(),
      method: "update account",
      message: error.message,
    });

    errorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

async function globalAccounts(req: Request, res: Response): Promise<void> {
  try {
    const account = await accountServices.gloablAcconunts();

    if (account.statusCode === HttpStatus.SUCCESS) {
      logger.info("Success log: ", {
        timestamp: new Date().toISOString(),
        method: "global account",
      });

      successResponse(
        res,
        HttpStatus.SUCCESS,
        HttpStatus.SUCCESS_MESSAGE,
        account.data
      );
    } else {
      logger.error("Failed log: ", {
        timestamp: new Date().toISOString(),
        method: "global account",
      });
      errorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        account.errorMessage || account.message
      );
    }
  } catch (err) {
    const error = err as Error;
    logger.error("Failed log: ", {
      timestamp: new Date().toString(),
      method: "global account",
      message: error.message,
    });

    errorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

export default {
  accounts,
  createAccount,
  updateAccount,
  globalAccounts
};
