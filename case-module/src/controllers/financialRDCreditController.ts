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
import { rdCreditGenerationSchema } from "../lib/joi/schemas/schema";
import Configurations from "../config/config";
const Services = Configurations.getInstance().getServices();
const financialRDCreditService = Services.financialRDCreditService;

async function financialRDCredit(
  req: Request,
  res: Response
): Promise<void> {
  const methodName = "financialRDCredit";
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
    const result = await financialRDCreditService.computeRDCredit(value.account_rid, value.case_rid, value.effective_start, value.effective_end);

    // Step 5: Handle service response
    handleCustomResponse(
      res,
      HttpStatus.SUCCESS,
      HttpStatus.SUCCESS_MESSAGE
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
  financialRDCredit
};