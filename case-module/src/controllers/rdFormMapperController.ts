import { Request, Response } from "express";
import {
  errorLog,
  generateExcelBase64,
  handleCustomResponse,
  handleErrorResponse,
  handleSuccessResponse,
  isValidTimezone,
  logMessage,
  successLog,
  validateRequest,
} from "../utils/helpers";
import { HttpStatus, STATUS_MESSAGE } from "../utils/constants";
import Configurations from "../config/config";
import { rdFormGenerationSchema, rdFormPreviewSchema, rdFormSignOffSchema } from "../lib/joi/schemas/schema";
const Services = Configurations.getInstance().getServices();
const rdFormService = Services.rdFormMapperService;

async function processRdFormMapperRequests(req: Request, res: Response) {
  const methodName = "processKafkaMessages";
  try {
    //  logMessage(`[${methodName}] Processing Kafka messages data: ${JSON.stringify(req)}`);
    const value = await validateRequest(req, rdFormGenerationSchema, res);
    const result = await rdFormService.initiateRDFormFillerProcess(value.account_rid, value.case_rid, value.fiscal_year);
    if(result.statusCode !== HttpStatus.SUCCESS){
      return res.status(result.statusCode).json({
        statusCode: result.statusCode,
        statusCodeValue: HttpStatus.FAILED_MESSAGE,
        statusMessage: result.errorMessage,
        data: {}
      });
    }
    return res.status(HttpStatus.SUCCESS).json({
      statusCode: HttpStatus.SUCCESS,
      statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
      statusMessage: STATUS_MESSAGE.rdFormProcessInitiatedSuccess,
      data: result.data,
    });
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
  }
}

async function signOffRdForms(req : Request, res : Response) {
    const methodName = "signOffRdForms";
    try {
       const value = await validateRequest(req, rdFormSignOffSchema, res);
       const userId = req.headers["x-user-id"] as string;
        if (!userId) {
            errorLog(methodName, "User ID is required in headers");
            handleErrorResponse(res, HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST_MESSAGE, "User ID is required in headers");
            return;
        }
        const data = value;
        data.userId = userId;
        const result = await rdFormService.signOffRdForms(data, req.file);
        if(result.statusCode === HttpStatus.SUCCESS) {
            return res.status(HttpStatus.SUCCESS).json({
                statusCode : HttpStatus.SUCCESS,
                statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
                statusMessage : result.statusMessage
            })
        } else if (result.statusCode === HttpStatus.FAILED) {
            return res.status(HttpStatus.FAILED).json({
                statusCode : HttpStatus.FAILED,
                statusCodeValue : HttpStatus.FAILED_MESSAGE,
                statusMessage : result.statusMessage
            })
        } else if (result.statusCode === HttpStatus.BAD_REQUEST) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                statusCode : HttpStatus.BAD_REQUEST,
                statusCodeValue : HttpStatus.BAD_REQUEST_MESSAGE,
                statusMessage : result.statusMessage
            })
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


async function getRdFormMapperResults(
  req: Request,
  res: Response,
): Promise<any> {
  const methodName = "getRdFormMapperResults";
  try {
    // Step 1: Log request
    logMessage(
      `[${methodName}] Request received: ${JSON.stringify(
        req.params,
      )}, userId: ${req.headers["x-user-id"]}`,
    );
   
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      errorLog(methodName, "User ID missing in headers");
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        "User ID is required in headers",
      );
      return;
    }

    const value = await validateRequest(req, rdFormPreviewSchema, res, "GET");
    if (!value) {
      errorLog(methodName, "Invalid request parameters");
      return;
    }
    
    const resultState = await rdFormService.getRdFormUrl(
      value
    );
    if (resultState.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).json({
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        statusMessage: resultState.message,
        data: resultState.data,
      });
    }
    else {
      return res.status(HttpStatus.NOT_FOUND).json({
        statusCode: HttpStatus.NOT_FOUND,
        statusCodeValue: HttpStatus.NOT_FOUND_MESSAGE,
        statusMessage: resultState.message,
        data: {},
      });
    }
  } catch (err) {
    // Step 6: Catch unexpected errors
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message,
    );
  }
}

export default {
  processRdFormMapperRequests,
  getRdFormMapperResults,
  signOffRdForms
};
