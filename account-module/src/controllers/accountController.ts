import { Request, Response } from "express";
import { errorResponse, successResponse } from "../utils/apiResponse";
import { HttpStatus } from "../utils/constant";
import configurations from "../config/config";
import { validateRequest } from "../utils/helpers";
import { accountSchema } from "../lib/joi/schemas/schema";

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
    const accounts = await accountServices.accountList();

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
      successResponse(
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

    successResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

async function createAccount(req: Request, res: Response): Promise<void> {
  try {
    const value = await validateRequest(
      req,
      accountSchema,
      res
    );

    if(!value){
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

    successResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

async function updateAccount(req: Request, res: Response): Promise<void> {
  try{
    
  }catch(err){
    const error = err as Error;
    logger.error("Failed log: ", {
      timestamp: new Date().toString(),
      method: "create account",
      message: error.message,
    });

    successResponse(
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
  updateAccount
};