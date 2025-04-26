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
} from "../utils/helpers";
import {
  createResourceSkillSchema,
  updateResourceSkillSchema,
  listResourceSkillSchema
} from "../lib/joi/schemas/schema";

const logger = configurations.getInstance().getLogger();
const services = configurations.getInstance().getServices();
const resourceSkillService = services.resourceSkillServices;


/**
 * Handles the request to create a resource skill.
 *
 * @param {Request} req The request object containing details of the HTTP request.
 * @param {Response} res The response object to send the HTTP response.
 * @returns {Promise<void>} A promise that resolves when the request is processed.
 *
 * This method validates the request data using `createResourceSkillSchema`, calls the `createResourceSkill` service to create a new resource skill,
 * and sends an appropriate response:
 * - If successful, it sends a success response with the created resource skill data.
 * - If failed, it logs the error and sends an error response with the error message.
 */
async function createResourceSkill(req: Request, res: Response): Promise<void> {
    const methodName = "createResourceCost";
    try {
      const value = await validateRequest(req, createResourceSkillSchema, res);
      const userId = req.headers["x-user-id"] as string;
      if(!userId) {
        handleErrorResponse(
          res,
          HttpStatus.BAD_REQUEST,
          HttpStatus.BAD_REQUEST_MESSAGE,
          "User Id is required in headers."
        );
        return;
      }
  
      if (!value) {
        return;
      }
  
      const resourceSkill = await resourceSkillService.createResourceSkill(value,userId);
  
      if (resourceSkill.statusCode === HttpStatus.SUCCESS) {
        successLog(methodName);
        handleSuccessResponse(res, resourceSkill.data);
        return;
      } else {
        errorLog(methodName, resourceSkill.errorMessage);
        handleErrorResponse(
          res,
          HttpStatus.BAD_REQUEST,
          HttpStatus.BAD_REQUEST_MESSAGE,
          resourceSkill.errorMessage
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
 * Handles the request to update an existing resource skill.
 *
 * @param {Request} req The request object containing details of the HTTP request.
 * @param {Response} res The response object to send the HTTP response.
 * @returns {Promise<void>} A promise that resolves when the request is processed.
 *
 * This method validates the request data using `updateResourceSkillSchema`, calls the `updateResourceSkill` service to update the resourceSkill,
 * and sends an appropriate response:
 * - If successful, it sends a success response with the updated account data.
 * - If failed, it logs the error and sends an error response with the error message.
 */
async function updateResourceSkill(req: Request, res: Response): Promise<void> {
  const methodName = "updateResourceSkill";
  try {
    const value = await validateRequest(req, updateResourceSkillSchema, res);
    const userId = req.headers["x-user-id"] as string;
    if(!userId) {
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User Id is required in headers."
      );
      return;
    }

    if (!value) {
      return;
    }

    const resourceSkill = await resourceSkillService.updateResourceSkill(value, userId);

    if (resourceSkill.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, resourceSkill.data);
      return;
    } else {
      errorLog(methodName, resourceSkill.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        resourceSkill.errorMessage
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
 * @function resourceSkill
 * @description Handles the retrieval of resourceSkill information.
 *
 * @param {Request} req - Express Request object.
 * @param {Response} res - Express Response object.
 * @returns {Promise<void>} - Sends a JSON response with resource skill data on success,
 * or an error message on failure.
 */
async function resourceSkill(req: Request, res: Response): Promise<void> {
  const methodName = "resourceSkill";
  try {
    const value = await validateRequest(
      req,
      listResourceSkillSchema,
      res,
      "GET"
    );

    if (!value) {
      return;
    }

    // Check if we have a direct lookup by rid
    if (value.rid && value.accountNumber) {
      // If rid is provided, we can directly fetch the specific resource skill
      const resourceSkill = await resourceSkillService.resourceSkillList(
        value.rid,
        1,  // Default page
        1,  // Limit to 1 since we're looking for a specific record
        "",  // No search needed
        {},  // No filters needed
        "createdAt",  // Default sort
        "DESC",  // Default order
        value.accountNumber,
        value.fiscalYear || 0,
        ""
      );

      if (resourceSkill.statusCode === HttpStatus.SUCCESS) {
        successLog(methodName);
        handleSuccessResponse(res, resourceSkill.data);
        return;
      } else {
        errorLog(methodName, resourceSkill.errorMessage);
        handleErrorResponse(
          res,
          HttpStatus.BAD_REQUEST,
          HttpStatus.BAD_REQUEST_MESSAGE,
          resourceSkill.message
        );
        return;
      }
    }

    // If no rid is provided, proceed with normal filtering and pagination
    let parsedFilters: Record<string, any> = {};
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

    const resourceSkill = await resourceSkillService.resourceSkillList(
      "",  // No specific rid
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

    if (resourceSkill.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, resourceSkill.data);
      return;
    } else {
      errorLog(methodName, resourceSkill.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        resourceSkill.message
      );
      return;
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
    return;
  }
}


  export default {
    createResourceSkill,
    updateResourceSkill,
    resourceSkill
  }