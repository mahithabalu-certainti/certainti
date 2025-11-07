import { Request, Response } from "express";
import { HttpStatus } from "../utils/constants";
import configurations from "../config/config";
import {
  validateRequest,
  successLog,
  errorLog,
  handleSuccessResponse,
  handleErrorResponse,
  generateExcelBase64,
  logMessage
} from "../utils/helpers";
import {
  createResourceSkillSchema,
  updateResourceSkillSchema,
  listResourceSkillSchema,
  exportResourceSkillSchema,
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
      logMessage(`Create Resource Skill payload received: ${JSON.stringify(value)}  User Id: ${userId}`);
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
    logMessage(`Update Resource Skill payload received: ${JSON.stringify(value)}  User Id: ${userId}`);
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

    const resourceSkill = await resourceSkillService.updateResourceSkill(
      value,
      userId
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
    const userId = req.headers["x-user-id"] as string;
    logMessage(`List Resource Skills payload received: ${JSON.stringify(value)} User Id: ${userId}`);

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

/**
 * @async
 * @function resourceSkill
 * @description Handles the retrieval of resourceSkill information for excel download.
 *
 * @param {Request} req - Express Request object.
 * @param {Response} res - Express Response object.
 * @returns {Promise<void>} - Sends a JSON response with resource skill data on success,
 * or an error message on failure.
 */
async function exportResourceSkill(req: Request, res: Response): Promise<void> {
  const methodName = "export ResourceSkill";
  try {
    const value = await validateRequest(
      req,
      exportResourceSkillSchema,
      res,
      "GET"
    );

    if (!value) {
      return;
    }
    const userId = req.headers["x-user-id"] as string;
    logMessage(`Export Resource Skills payload received: ${JSON.stringify(value)} User Id: ${userId}`);

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

    const resourceSkill = await resourceSkillService.exportResourceSkillList(
      value.search,
      parsedFilters,
      value.sortBy,
      value.sortOrder,
      value.accountNumber,
      value.fiscalYear,
      value.resourceRid,
      userId
    );

    if (resourceSkill.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(
        res,
        await generateExcelBase64(
          resourceSkill?.data?.resourceSkill,
          "Resource Skill"
        )
      );
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

/**
 * Handles the request to fetch a specific resourceSkill by its ID.
 *
 * @param {Request} req The request object containing details of the HTTP request.
 * @param {Response} res The response object to send the HTTP response.
 * @returns {Promise<void>} A promise that resolves when the request is processed.
 *
 * This method retrieves the resource skill ID from the request parameters, calls the `resourceSkillById` service to fetch the resource details along with resource skill details,
 * and sends an appropriate response:
 * - If successful, it sends a success response with the resource skill data.
 * - If failed, it logs the error and sends an error response with the error message.
 */
async function resourceSkillById(req: Request, res: Response): Promise<void> {
  const methodName = "resourceSkillById";
  try {
    const { id } = req.params;
    const accountNumber = req.query.accountNumber as string;
    const result = await resourceSkillService.resourceSkillById(id,accountNumber);
    const userId = req.headers["x-user-id"] as string;
    logMessage(`Resource Skill by ID payload received ID: ${id} Account Number : ${accountNumber} User Id: ${userId}`);

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

/**
 * Handles the HTTP request to retrieve all available skill types.
 *
 * - Calls the `resourceSkillService.getSkillTypes` service method.
 * - On success, returns a list of skill types in the response.
 * - On failure, returns an appropriate error message and HTTP status.
 *
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} A Promise that resolves once the response is sent.
 */
async function getSkillTypes(req: Request, res: Response): Promise<void> {
  const methodName = "getSkillTypes";
  try {
    const result = await resourceSkillService.getSkillTypes();

    if (result.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, result.data?.skillTypes);
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
 * Handles the HTTP request to retrieve skill subtypes based on provided skill type RIDs.
 *
 * - Parses the `skillTypeRids` from the query parameters, accepting formats like:
 *   - Array (`?skillTypeRids[]=...`)
 *   - Comma-separated string (`?skillTypeRids=rid1,rid2`)
 *   - JSON string (`?skillTypeRids=["rid1","rid2"]`)
 * - Calls `resourceSkillService.getSkillSubTypes` with the parsed list.
 * - On success, returns the corresponding skill subtypes.
 * - On failure, returns an appropriate error message and HTTP status.
 *
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} A Promise that resolves once the response is sent.
 */
async function getSkillSubTypes(req: Request, res: Response): Promise<void> {
  const methodName = "getSkillSubTypes";
  try {
    let skillTypeRids: string[] = [];
    const raw = req.query.skillTypeRids;
    if (Array.isArray(raw)) {
      skillTypeRids = raw as string[];
    } else if (typeof raw === "string") {
      if (raw.trim().startsWith("[")) {
        try {
          skillTypeRids = JSON.parse(raw);
        } catch {
          skillTypeRids = [];
        }
      } else {
        skillTypeRids = raw
          .split(",")
          .map((rid) => rid.trim().replace(/^"|"$/g, "")) // ✅ remove quotes
          .filter(Boolean);
      }
    }
    const result = await resourceSkillService.getSkillSubTypes(skillTypeRids);

    if (result.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, result.data?.skillSubTypes);
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

export default {
  createResourceSkill,
  updateResourceSkill,
  resourceSkill,
  exportResourceSkill,
  resourceSkillById,
  getSkillTypes,
  getSkillSubTypes,
};
