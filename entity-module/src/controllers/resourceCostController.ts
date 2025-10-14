import { Request, Response } from "express";
import { HttpStatus } from "../utils/constants";
import { errorResponse, successResponse } from "../utils/apiResponse";
import configurations from "../config/config";
import {
  validateRequest,
  successLog,
  errorLog,
  handleSuccessResponse,
  handleErrorResponse,
  generateExcelBase64,
  handlePromptResponse,
} from "../utils/helpers";
import {
  resourceCostSchema,
  listResourceCostSchema,
  getResourceCostSchema,
  updateResourceCostSchema,
  exportResourceCostSchema,
  updateResourceDuplicateStatus,
  listResourceCostSchemaForFinancialHighlights,
  exportResourceCostSchemaForFinancialHighlights
} from "../lib/joi/schemas/schema";

// const logger = configurations.getInstance().getLogger();
const services = configurations.getInstance().getServices();
const resourceCostService = services.resourceCostServices;

/**
 * @async
 * @function resourceCosts
 * @description Handles the retrieval of resourceCost information.
 *
 * @param {Request} req - Express Request object.
 * @param {Response} res - Express Response object.
 * @returns {Promise<void>} - Sends a JSON response with resource cost data on success,
 * or an error message on failure.
 */
async function resourceCosts(req: Request, res: Response): Promise<void> {
  const methodName = "resourceCosts";
  try {
    const value = await validateRequest(
      req,
      listResourceCostSchema,
      res,
      "GET"
    );

    let parsedFilters: Record<string, any> = {};

    if (!value) {
      return;
    }

    try {
      parsedFilters = JSON.parse(value.filters);
    } catch (error) {
      errorLog(
        methodName,
        "Invalid filters format. Must be a valid JSON object."
      );
    }

    const pageNum: number = parseInt(value.page, 10) || 1;
    const limitNum: number = parseInt(value.limit, 10) || 10;

    const resourceCost = await resourceCostService.resourceCostList(
      pageNum,
      limitNum,
      value.search,
      parsedFilters,
      value.sortBy,
      value.sortOrder,
      value.accountNumber,
      value.fiscalYear,
      value.resourceRid
    );

    if (resourceCost.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, resourceCost.data);
    } else {
      errorLog(methodName, resourceCost.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        resourceCost.message
      );
    }
  } catch (err) {
    const error = err as Error;
    errorLog(error.message);

    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

/**
 * @async
 * @function resourceCosts
 * @description Handles the retrieval of resourceCost information for downloading.
 *
 * @param {Request} req - Express Request object.
 * @param {Response} res - Express Response object.
 * @returns {Promise<void>} - Sends a JSON response with resource cost data on success,
 * or an error message on failure.
 */
async function exportResourceCosts(req: Request, res: Response): Promise<void> {
  const methodName = "export resourceCosts";
  try {
    const value = await validateRequest(
      req,
      exportResourceCostSchema,
      res,
      "GET"
    );

    let parsedFilters: Record<string, any> = {};
    const userId = req.headers["x-user-id"] as string;
    if (!value) {
      return;
    }

    try {
      parsedFilters = JSON.parse(value.filters);
    } catch (error) {
      errorLog(
        methodName,
        "Invalid filters format. Must be a valid JSON object."
      );
    }
    const resourceCost = await resourceCostService.exportResourceCostList(
      value.search,
      parsedFilters,
      value.sortBy,
      value.sortOrder,
      value.accountNumber,
      value.fiscalYear,
      value.resourceRid,userId
    );

    if (resourceCost.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(
        res,
        await generateExcelBase64(
          resourceCost?.data?.resourceCost,
          "Resource Cost"
        )
      );
    } else {
      errorLog(methodName, resourceCost.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        resourceCost.message
      );
    }
  } catch (err) {
    const error = err as Error;
    errorLog(error.message);

    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

/**
 * Handles the request to create a resource cost.
 *
 * @param {Request} req The request object containing details of the HTTP request.
 * @param {Response} res The response object to send the HTTP response.
 * @returns {Promise<void>} A promise that resolves when the request is processed.
 *
 * This method validates the request data using `resourceCostSchema`, calls the `createResourceCost` service to create a new resource cost,
 * and sends an appropriate response:
 * - If successful, it sends a success response with the created account data.
 * - If failed, it logs the error and sends an error response with the error message.
 */
async function createResourceCost(req: Request, res: Response): Promise<void> {
  const methodName = "createResourceCost";
  try {
    const value = await validateRequest(req, resourceCostSchema, res);
    const userId = req.headers["x-user-id"] as string;

    if (!userId) {
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }

    if (!value) {
      return;
    }

    if(value.user_preference === "reject"){
      return;
    }

    const resourceCost = await resourceCostService.createResourceCost(
      value,
      userId,
      value.user_preference
    );

    if (resourceCost.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, resourceCost.data);
      return;
    } else if(resourceCost.statusCode === HttpStatus.PROMPT) {
      handlePromptResponse(res, HttpStatus.PROMPT, resourceCost.message, resourceCost.data);
    } else {
      errorLog(methodName, resourceCost.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        resourceCost.errorMessage
          ?.replace(/(Validation error:|Validation failed)/g, "")
          .trim()
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
 * Handles the request to update an existing resource cost.
 *
 * @param {Request} req The request object containing details of the HTTP request.
 * @param {Response} res The response object to send the HTTP response.
 * @returns {Promise<void>} A promise that resolves when the request is processed.
 *
 * This method validates the request data using `updateResourceCostSchema`, calls the `updateResourceCost` service to update the resourceCost,
 * and sends an appropriate response:
 * - If successful, it sends a success response with the updated account data.
 * - If failed, it logs the error and sends an error response with the error message.
 */
async function updateResourceCost(req: Request, res: Response): Promise<void> {
  const methodName = "updateResourceCost";
  try {
    const value = await validateRequest(req, updateResourceCostSchema, res);
    const userId = req.headers["x-user-id"] as string;

    if (!userId) {
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }

    if (!value) {
      return;
    }

    if(value.user_preference === "reject"){
      return;
    }

    const resourceCost = await resourceCostService.updateResourceCost(
      value,
      userId,
      value.user_preference,
    );

    if (resourceCost.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, resourceCost.data);
      return;
    } else if(resourceCost.statusCode === HttpStatus.PROMPT){
      handlePromptResponse(res, HttpStatus.PROMPT, resourceCost.message, resourceCost.data);
    } else {
      errorLog(methodName, resourceCost.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        resourceCost.errorMessage
          ?.replace(/(Validation error:|Validation failed)/g, "")
          .trim()
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
 * Handles the request to fetch a specific resourceCost by its ID.
 *
 * @param {Request} req The request object containing details of the HTTP request.
 * @param {Response} res The response object to send the HTTP response.
 * @returns {Promise<void>} A promise that resolves when the request is processed.
 *
 * This method retrieves the resource cost ID from the request parameters, calls the `resourceCostById` service to fetch the resource details along with resource cost,
 * and sends an appropriate response:
 * - If successful, it sends a success response with the resource cost data.
 * - If failed, it logs the error and sends an error response with the error message.
 */
async function resourceCostById(req: Request, res: Response): Promise<void> {
  const methodName = "resourceCostById";
  try {
    const { id } = req.params;
    const accountNumber = req.query.accountNumber as string;
    const result = await resourceCostService.resourceCostById(
      id,
      accountNumber
    );

    if (result.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, result.data);
    } else {
      errorLog(methodName, result.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        result.errorMessage
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

async function acceptStatus(req: Request, res: Response): Promise<void> {
  const methodName = "Accept duplicate";
  try {
    const value = await validateRequest(req, updateResourceDuplicateStatus, res);

    if(!value){
      return;
    }

    const result = await resourceCostService.acceptResourceCostStatus(
      value.rid,
      value.accountNumber,
      value.action,
      value.type
    );

    if (result.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: result.message,
        data: result.data,
      });
      return;
    } else {
      errorLog(methodName, result.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        result.errorMessage
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
 * @async
 * @function resourceCostsForFinancialHighlights
 * @description Handles the retrieval of resourceCost information.
 *
 * @param {Request} req - Express Request object.
 * @param {Response} res - Express Response object.
 * @returns {Promise<void>} - Sends a JSON response with resource cost data on success,
 * or an error message on failure.
 */
async function resourceCostsForFinancialHighlights(req: Request, res: Response): Promise<void> {
  const methodName = "resourceCosts For FinancialHighlights";
  try {
    const value = await validateRequest(
      req,
      listResourceCostSchemaForFinancialHighlights,
      res,
      "GET"
    );

    let parsedFilters: Record<string, any> = {};

    if (!value) {
      return;
    }

    try {
      parsedFilters = JSON.parse(value.filters);
    } catch (error) {
      errorLog(
        methodName,
        "Invalid filters format. Must be a valid JSON object."
      );
    }

    const pageNum: number = parseInt(value.page, 10) || 1;
    const limitNum: number = parseInt(value.limit, 10) || 10;

    const resourceCost = await resourceCostService.resourceCostsForFinancialHighlights(
      pageNum,
      limitNum,
      value.search,
      parsedFilters,
      value.sortBy,
      value.sortOrder,
      value.accountNumber,
      value.fiscalYear,
      value.projectRid,
      value.accountRid
    );

    if (resourceCost.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, resourceCost.data);
    } else {
      errorLog(methodName, resourceCost.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        resourceCost.message
      );
    }
  } catch (err) {
    const error = err as Error;
    errorLog(error.message);

    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}

/**
 * @async
 * @function exportResourceCostsForFinancialHighlights
 * @description Handles the retrieval of resourceCost information for downloading.
 *
 * @param {Request} req - Express Request object.
 * @param {Response} res - Express Response object.
 * @returns {Promise<void>} - Sends a JSON response with resource cost data on success,
 * or an error message on failure.
 */
async function exportResourceCostsForFinancialHighlights(req: Request, res: Response): Promise<void> {
  const methodName = "export resourceCosts";
  try {
    const { accountRid, projectRid } = req.params;
    const value = await validateRequest(
      req,
      exportResourceCostSchemaForFinancialHighlights,
      res,
      "GET"
    );

    let parsedFilters: Record<string, any> = {};
    const userId = req.headers["x-user-id"] as string;
    if (!value) {
      return;
    }

    try {
      parsedFilters = JSON.parse(value.filters);
    } catch (error) {
      errorLog(
        methodName,
        "Invalid filters format. Must be a valid JSON object."
      );
    }
    const resourceCost = await resourceCostService.exportResourceCostsForFinancialHighlights(
      value.search,
      parsedFilters,
      value.sortBy,
      value.sortOrder,
      value.accountNumber,
      value.fiscalYear,
      value.projectRid,
      value.accountRid,
      userId
    );

    if (resourceCost.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(
        res,
        await generateExcelBase64(
          resourceCost?.data?.financialHighlights,
          "Resource Cost"
        )
      );
    } else {
      errorLog(methodName, resourceCost.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        resourceCost.message
      );
    }
  } catch (err) {
    const error = err as Error;
    errorLog(error.message);

    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
}
export default {
  resourceCosts,
  exportResourceCosts,
  createResourceCost,
  updateResourceCost,
  resourceCostById,
  acceptStatus,
  resourceCostsForFinancialHighlights,
  exportResourceCostsForFinancialHighlights
};
