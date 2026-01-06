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
import { rdCreditGenerationSchema, rdCreditProcessSchema , rdCreditDataSchema} from "../lib/joi/schemas/schema";
import Configurations from "../config/config";

const Services = Configurations.getInstance().getServices();
const federalComputationService = Services.federalComputationService;
const stateComputationService = Services.stateComputationService;
const computationService = Services.computationService;

async function financialRDCreditFederal(
  req: Request,
  res: Response
): Promise<any> {
  const methodName = "financialRDCreditFederal";
  try {
    // Step 1: Log request
    logMessage(
      `[${methodName}] Request received: ${JSON.stringify(
        req.body
      )}, userId: ${req.headers["x-user-id"]}`
    );

    // Step 2: Validate request body
    const value = await validateRequest(req, rdCreditGenerationSchema, res);
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

    logMessage(JSON.stringify(value));

    // Step 4: Call service to create/update record
    const resultFederal = await federalComputationService.fetchFederalCalculatedData(value);
    return res.status(200).send({
      statusCode : HttpStatus.SUCCESS,
      statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
      data : resultFederal
    })
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

async function initiateRDCreditProcess(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "initiateRDCreditProcess";
  try {
    // Step 1: Log request
    logMessage(
      `[${methodName}] Request received: ${JSON.stringify(
        req.body
      )}, userId: ${req.headers["x-user-id"]}`
    );

    // Step 2: Validate request body
    const value = await validateRequest(req, rdCreditGenerationSchema, res);
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

    logMessage(JSON.stringify(value));
    const resultState = await computationService.initiateRDCreditProcess(value.account_rid, value.case_rid, value.effective_start, value.effective_end)
    // Step 5: Handle service response
    handleCustomResponse(
      res,
      resultState.statusCode,
      resultState.message
    );
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
 * 
 * @param req 
 * @param res 
 * @returns 
 */
async function findRdCreditComputedResults(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "findRdCreditComputedResults";
  try {
    // Step 1: Log request
    logMessage(
      `[${methodName}] Request received: ${JSON.stringify(
        req.body
      )}, userId: ${req.headers["x-user-id"]}`
    );

    // Step 2: Validate request body
    const value = await validateRequest(req, rdCreditDataSchema, res);
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

    logMessage(JSON.stringify(value));

    const resultState = await computationService.getComputationResultsByIDAndState(value.accountRid, value.caseRid, value.stateCode);

    // Step 5: Handle service response
    handleCustomResponse(
      res,
      resultState.data,
      resultState.message
    );
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
 * 
 * @param req 
 * @param res 
 * @returns 
 */
async function findProcessStatusByCaseRid(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "findProcessStatusByCaseRid";
  try {
    // Step 1: Log request
    logMessage(
      `[${methodName}] Request received: ${JSON.stringify(
        req.body
      )}, userId: ${req.headers["x-user-id"]}`
    );

    // Step 2: Validate request body
    const value = await validateRequest(req, rdCreditProcessSchema, res);
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

    logMessage(JSON.stringify(value));

    const resultState = await computationService.findProcessStatus(value.accountRid, value.caseRid);

    // Step 5: Handle service response
    handleCustomResponse(
      res,
      resultState.data,
      resultState.message,
    );
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

// Export controller
export default {
  financialRDCreditFederal,
  findRdCreditComputedResults,
  initiateRDCreditProcess,
  findProcessStatusByCaseRid
};