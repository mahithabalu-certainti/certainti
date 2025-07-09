import { Request, Response } from "express";
import { HttpStatus } from "../utils/constant";
import configurations from "../config/config";
import {
  errorLog,
  handleErrorResponse,
  handleSuccessResponse,
  successLog,
  validateRequest,
  generateExcelBase64,
  uploadToAzureBlob,
  deleteFromAzureBlob
} from "../utils/helpers";
import {
  accountSchema,
  listAccountSchema,
  exportAccountSchema,
  updateAccountSchema,
  listOrgAccountSchema,
} from "../lib/joi/schemas/schema";


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
  const methodName = "list user";
  try {
    const value = await validateRequest(req, listAccountSchema, res, "GET");
    let parsedFilters: Record<string, any> = {};
    let parsedGlobalFilters: Record<string, string[]> = {}

    if (!value) {
      return;
    }

    try {
      if (value.filters) {
        parsedFilters = JSON.parse(value.filters);
      }
      if (value.globalFilters) {
        parsedGlobalFilters = JSON.parse(value.globalFilters);
      }
    } catch (error) {
      errorLog(
        methodName,
        "Invalid filters format. Must be a valid JSON object."
      );
    }
    const pageNum: number = parseInt(value.page, 10) || 1;
    const limitNum: number = parseInt(value.limit, 10) || 10;
    const fiscalYear: number | "FY-All" = value?.fiscalYear || null ;
  

    const accounts = await accountServices.accountList(
      pageNum,
      limitNum,
      value.search,
      parsedFilters,
      value.sortBy,
      value.sortOrder,
      parsedGlobalFilters,
      fiscalYear
    );

    if (accounts.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, accounts.data);
      return;
    } else {
      errorLog(methodName, accounts.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        accounts.errorMessage!
      );
      return;
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
    return;
  }
}

/**
 * @async
 * @function exportAccounts
 * @description Handles the exporting the account information as base64 encoded.
 *
 * @param {Request} req - Express Request object.
 * @param {Response} res - Express Response object.
 * @returns {Promise<void>} - Sends a JSON response with account data on success,
 * or an error message on failure.
 */
async function exportAccounts(req: Request, res: Response): Promise<void> {
  const methodName = "Export user";
  try {
    const value = await validateRequest(req, exportAccountSchema, res, "GET");
    let parsedFilters: Record<string, any> = {};
    let parsedGlobalFilters: Record<string, string[]> = {}

    if (!value) {
      return;
    }

    try {
      if (value.filters) {
        parsedFilters = JSON.parse(value.filters);
      }
      if (value.globalFilters) {
        parsedGlobalFilters = JSON.parse(value.globalFilters);
      }
    } catch (error) {
      errorLog(
        methodName,
        "Invalid filters format. Must be a valid JSON object."
      );
    }

    const fiscalYear: number | "FY-All" = value?.fiscalYear || null ;
  

    const accounts = await accountServices.exportAccountList(
      value.search,
      parsedFilters,
      value.sortBy,
      value.sortOrder,
      parsedGlobalFilters,
      fiscalYear
    );

    if (accounts.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, await generateExcelBase64(accounts?.data?.account,"Accounts"));

      return
    } else {
      errorLog(methodName, accounts.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        accounts.errorMessage!
      );
      return;
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
    return;
  }
}

/**
 * Handles the request to create a new account.
 *
 * @param {Request} req The request object containing details of the HTTP request.
 * @param {Response} res The response object to send the HTTP response.
 * @returns {Promise<void>} A promise that resolves when the request is processed.
 *
 * This method validates the request data using `accountSchema`, calls the `createAccount` service to create a new account,
 * and sends an appropriate response:
 * - If successful, it sends a success response with the created account data.
 * - If failed, it logs the error and sends an error response with the error message.
 */
async function createAccount(req: Request, res: Response): Promise<void> {
  const methodName = "create account";
  let file_url = '';
  try {
    const value = await validateRequest(req, accountSchema, res);
     if (!value) {
      return;    }
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User id is required"
      );
      return;
    }

   
    

    const account = await accountServices.createAccount(value, userId,req.file);

    if (account.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, account.data);
      return;
    } else {
      errorLog(methodName, account.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        account.errorMessage
      );
      return;
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.BAD_REQUEST,
      HttpStatus.BAD_REQUEST_MESSAGE,
      error.message
    );
    return;
  }
}

/**
 * Handles the request to update an existing account.
 *
 * @param {Request} req The request object containing details of the HTTP request.
 * @param {Response} res The response object to send the HTTP response.
 * @returns {Promise<void>} A promise that resolves when the request is processed.
 *
 * This method validates the request data using `updateAccountSchema`, calls the `updateAccount` service to update the account,
 * and sends an appropriate response:
 * - If successful, it sends a success response with the updated account data.
 * - If failed, it logs the error and sends an error response with the error message.
 */
async function updateAccount(req: Request, res: Response): Promise<void> {
  const methodName = "update account";
  let file_url = '';
  try {
    const value = await validateRequest(req, updateAccountSchema, res);
    if (!value) {
      return;
    }
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User id is required"
      );
      return;
    }
    if(req.file && value.logo_action  ==="upload")
    {
      if(value.logo_url)
      {
        await deleteFromAzureBlob(value.logo_url);
      }
      file_url = await uploadToAzureBlob(req.file,value?.account_rid);
      value.logo_url = file_url; 
    }
    else if(value.logo_action  === "delete")
    {
       await deleteFromAzureBlob(value.logo_url);
        value.logo_url = ""; 
    }
    const account = await accountServices.updateAccount(value, userId);

    if (account.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, account.data);
      return;
    } else {
      errorLog(methodName, account.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        account.errorMessage
      );
      return;
    }
  } catch (err) {
    const error = err as Error;

    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
    return;
  }
}

/**
 * Handles the request to fetch all global accounts.
 *
 * @param {Request} req The request object containing details of the HTTP request.
 * @param {Response} res The response object to send the HTTP response.
 * @returns {Promise<void>} A promise that resolves when the request is processed.
 *
 * This method calls the `globalAccounts` service to fetch all global accounts and sends an appropriate response:
 * - If successful, it sends a success response with the global accounts data.
 * - If failed, it logs the error and sends an error response with the error message.
 */
async function globalAccounts(req: Request, res: Response): Promise<void> {
  const methodName = "global account";
  try {
    const account = await accountServices.globalAccounts();

    if (account.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, account.data);
    } else {
      errorLog(methodName, account.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        account.errorMessage
      );
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

/**
 * Handles the request to fetch a specific account by its ID.
 *
 * @param {Request} req The request object containing details of the HTTP request.
 * @param {Response} res The response object to send the HTTP response.
 * @returns {Promise<void>} A promise that resolves when the request is processed.
 *
 * This method retrieves the account ID from the request parameters, calls the `accountById` service to fetch the account,
 * and sends an appropriate response:
 * - If successful, it sends a success response with the account data.
 * - If failed, it logs the error and sends an error response with the error message.
 */
async function accountById(req: Request, res: Response): Promise<void> {
  const methodName = "global account";
  try {
    const { id } = req.params;
    const account = await accountServices.accountById(id);

    if (account.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, account.data);
    } else {
      errorLog(methodName, account.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        account.errorMessage
      );
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

async function listOrgAccounts(req: Request, res: Response): Promise<void> {
   const methodName = "List Org account";
    try {
       const value = await validateRequest(req, listOrgAccountSchema, res,"GET");
    if (!value) {
      return;
    }
    let parsedFilters: Record<string, any> = {};
      try {
      if (value.filters) {
        parsedFilters = JSON.parse(value.filters);
      }
    
    } catch (error) {
      errorLog(
        methodName,
        "Invalid filters format. Must be a valid JSON object."
      );
    }
  
    const account = await accountServices.listAllAccounts({
  page: value.page,
  limit: value.limit,
  sortBy: value.sortBy,
  sortOrder: value.sortOrder,
  filters: parsedFilters,
});

    if (account.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, account.data);
    } else {
      errorLog(methodName, account.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        account.errorMessage
      );
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}
async function ListGlobalAccounts(req: Request, res: Response): Promise<void> {
  const methodName = "List global account";
  try {
    const account = await accountServices.listGlobalAccounts();

    if (account.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, account.data);
    } else {
      errorLog(methodName, account.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        account.errorMessage
      );
    }
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

  async function getKeyContactRoles(req: Request, res: Response): Promise<void> {
    const methodName = "get key contact roles";
    try {
      const entity_type = req.query.entity_type as string;
      const account = await accountServices.getKeyContactRoles(entity_type);

      if (account.statusCode === HttpStatus.SUCCESS) {
        successLog(methodName);
        handleSuccessResponse(res, account.data);
      }
      else{
        errorLog(methodName, account.errorMessage);
        handleErrorResponse(
          res,
          HttpStatus.BAD_REQUEST,
          HttpStatus.BAD_REQUEST_MESSAGE,
          account.errorMessage
        );
      }
    }
    catch (err) {
      const error = err as Error;
      errorLog(methodName, error.message);
      handleErrorResponse(
        res,
        HttpStatus.FAILED,
        HttpStatus.FAILED_MESSAGE,
        error.message
      );
    }
  }



export default {
  accounts,
  exportAccounts,
  createAccount,
  updateAccount,
  globalAccounts,
  accountById,
  ListGlobalAccounts,
  getKeyContactRoles,
  listOrgAccounts
};
