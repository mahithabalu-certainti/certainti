import { Request, Response } from "express";
import {
  errorLog,
  handleCustomResponse,
  handleErrorResponse,
  logMessage,
  successLog,
  validateRequest,
} from "../utils/helpers";
import { HttpStatus } from "../utils/constants";
import Configurations from "../config/config";
import { jurisdictionSchema } from "../lib/joi/schemas/schema";
// Load services from configuration
const Services = Configurations.getInstance().getServices();
const jurisdictionService = Services.jurisdictionService;


/**
 * Controller to handle creation or update of jurisdiction configuration.
 *
 * Steps:
 * 1. Logs incoming request
 * 2. Validates request using Joi schema
 * 3. Ensures user ID is present in headers
 * 4. Calls jurisdiction service to create or update configuration
 * 5. Returns structured success/error responses
 */
async function addOrUpdateJurisdictionConfiguration(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "Add/Update Jurisdiction Configuration";
  try {
    // Step 1: Log request
    logMessage(
      `[${methodName}] Request received: ${JSON.stringify(
        req.body
      )}, userId: ${req.headers["x-user-id"]}`
    );

    // Step 2: Validate request body
    const value = await validateRequest(req, jurisdictionSchema, res);
    if (!value) {
      errorLog(methodName, "Invalid request body");
      return;
    }

    // Step 3: Validate userId
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      errorLog(methodName, "User ID missing in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }

    // Step 4: Call service to create/update record
    const result = await jurisdictionService.createOrUpdateJurisdiction(
      value,
      userId,
    );

    // Step 5: Handle service response
    if (result.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleCustomResponse(res, result.data, result.message);
    } else {
      errorLog(methodName, result.message);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        result.message
      );
    }
  } catch (err) {
    // Step 6: Catch unexpected errors
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
 * Controller to get jurisdiction configuration.
 *
 * Steps:
 * 1. Logs incoming request
 * 2. Validates required params (accountRid, caseRid)
 * 3. Calls service to fetch jurisdiction data
 * 4. Returns structured success/error responses
 */
async function getJurisdictionConfiguration(req: Request, res: Response): Promise<void> {
  const methodName = "Get Jurisdiction Configuration";
  try {
    // Step 1: Log request
    logMessage(
      `[${methodName}] Request received: params=${JSON.stringify(req.params)}, userId=${req.headers["x-user-id"]}`
    );

    // Step 2: Extract parameters
    const { accountRid, caseRid, level } = req.query;
    const userId = req.headers["x-user-id"] as string;

    // Validate required parameters
    if (!userId) {
      errorLog(methodName, "User ID missing in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers"
      );
      return;
    }

    if (!accountRid) {
      errorLog(methodName, "Missing accountRid");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "AccountRid is required"
      );
      return;
    }

    if (!level) {
      errorLog(methodName, "Missing level");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "level is required"
      );
      return;
    }

    if (level === "case" && !caseRid) {
      errorLog(methodName, "Missing caseRid");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "Case RID is required"
      );
      return;
    }

    const entity_rid = level === "case" ? caseRid : accountRid;

    // Step 3: Call service
    const result = await jurisdictionService.getJurisdictionConfiguration(accountRid as string, entity_rid as string);

    // Step 4: Handle service response
    if (result.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleCustomResponse(res, result.data, result.message);
    } else {
      errorLog(methodName, result.message);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        result.message
      );
    }
  } catch (err) {
    // Step 5: Catch unexpected errors
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

// Export controller
export default {
  addOrUpdateJurisdictionConfiguration,
  getJurisdictionConfiguration
};
