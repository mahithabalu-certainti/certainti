import { NextFunction, Request, Response } from "express";
import Configurations from "../config/config";
import { addLog, errorLog, handleErrorResponse, handleSuccessResponse, successLog, validateRequest } from "../utils/helpers";
import { HttpStatus, STATUS_MESSAGE } from "../utils/constants";
import { caseClosedListSchema, caseCloseSchema, validateFile } from "../lib/joi/schemas/schema";

const services = Configurations.getInstance().getServices();
const childCaseService = services.caseService;
const logger = Configurations.getInstance().getLogger();

async function signOffFinancialWorking (req : Request, res : Response) {
    const methodName = "signOffFinancialWorking";
    try {
       const userId = req.headers["x-user-id"] as string;
        if (!userId) {
            errorLog(methodName, "User ID is required in headers");
            handleErrorResponse(res, HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST_MESSAGE, "User ID is required in headers");
            return;
        }
        const data = req.body;
        data.userId = userId;
        const result = await childCaseService.signOffFinancialWorking(data, req.file);
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

async function regionListForFinancialHighlights (req : Request, res : Response) {
    const methodName = "RegionListForFinancialHighlights"
    try {
       const userId = req.headers["x-user-id"] as string;
        if (!userId) {
            errorLog(methodName, "User ID is required in headers");
            handleErrorResponse(res, HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST_MESSAGE, "User ID is required in headers");
            return;
        }
        const { accountId, caseId } = req.params;
        const data: any = {};
        data.account_rid = accountId;
        data.case_rid = caseId;
        const result = await childCaseService.stateWiseRegionList(data);
        if(result.length > 0) {
            return res.status(HttpStatus.SUCCESS).json({
                statusCode : HttpStatus.SUCCESS,
                statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
                statusMessage : STATUS_MESSAGE.regionsFetchedSuccess,
                data : result
            })
        } else {
            return res.status(HttpStatus.SUCCESS).json({
                statusCode : HttpStatus.SUCCESS,
                statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
                statusMessage : STATUS_MESSAGE.dataNotAvailable,
                data : result
            })
        }
    } catch (err) {
    const error = err as Error;
    console.log(error)
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

async function getClosedCasesList(req: Request, res: Response): Promise<void> {
  const methodName = "Get Closed Cases List";
  try {
    const value = await validateRequest(req, caseClosedListSchema, res,"GET");
     if (!value) {
          errorLog(methodName, "Request body is empty");
          return;
        }
    const response = await childCaseService.getClosedCasesList(value);
    if (response.statusCode === HttpStatus.SUCCESS) {
      successLog(methodName);
      handleSuccessResponse(res, response.data);
      return;
    } else {
      errorLog(methodName, response.errorMessage);
      handleErrorResponse(
        res,
        HttpStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST_MESSAGE,
        response.errorMessage
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
 * Controller function to fetch closing remarks for a specific case.
 *
 * This async function handles HTTP requests to retrieve case closure remarks by:
 * - Validating the presence of a user ID in the request headers
 * - Extracting account and case identifiers from route parameters
 * - Preparing the request payload and delegating data retrieval to the `childCaseService.getCaseClosureRemarks` method
 * - Returning appropriate HTTP responses based on data availability (success or not found)
 *
 * Error handling:
 * - Logs and returns a `BAD_REQUEST` response if required headers are missing or if any runtime error occurs
 *
 * @param {Request} req - Express request object containing headers and route parameters
 * @param {Response} res - Express response object used to send the API response
 * @returns {Promise<void>} - Resolves after sending the HTTP response
 * @throws {Error} - Captures and handles any service or runtime errors
 */
async function fetchCaseClosingRemarks (req : Request, res : Response) {
  const methodName = "fetchCaseClosingRemarks";
  try {
    const userId = req.headers["x-user-id"] as string;
        if (!userId) {
            errorLog(methodName, "User ID is required in headers");
            handleErrorResponse(res, HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST_MESSAGE, "User ID is required in headers");
            return;
        }
        const data = req.body;
        const result = await childCaseService.getCaseClosureRemarks(data);
        if(result?.closing_remarks.length! > 0) {
          return res.status(HttpStatus.SUCCESS).json({
                statusCode : HttpStatus.SUCCESS,
                statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
                statusMessage : STATUS_MESSAGE.caseClosureRemarksSuccess,
                data : result
            })
        } else {
          return res.status(HttpStatus.NOT_FOUND).json({
                statusCode : HttpStatus.NOT_FOUND,
                statusCodeValue : HttpStatus.NOT_FOUND_MESSAGE,
                statusMessage : STATUS_MESSAGE.dataNotAvailable,
                data : result
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
  async function initiateCreateDossierForm (req : Request, res : Response) {
    const methodName = "initiateCreateDossierForm"
    try {
       const userId = req.headers["x-user-id"] as string;
        if (!userId) {
            errorLog(methodName, "User ID is required in headers");
            handleErrorResponse(res, HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST_MESSAGE, "User ID is required in headers");
            return;
        }
        const data = req.body;
        data.userId = userId;
        const result = await childCaseService.initiateCreateDossierForm(data);
        if(result) {
          return res.status(HttpStatus.SUCCESS).send({
            statusCode : HttpStatus.SUCCESS,
            statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
            statusMessage : result
          })
        }
    }catch (err) {
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
async function exportSignOffDetails (req : Request, res : Response) {
  const methodName = "Export Signoff Details"
  try {
    const userId = req.headers["x-user-id"] as string;
        if (!userId) {
            errorLog(methodName, "User ID is required in headers");
            handleErrorResponse(res, HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST_MESSAGE, "User ID is required in headers");
            return;
        }
        const data = req.body;
        const result = await childCaseService.exportCaseClosingRemarks(data);
        if(result) {
           return res.status(HttpStatus.SUCCESS).send({
            statusCode : HttpStatus.SUCCESS,
            statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
            statusMessage : STATUS_MESSAGE.closureRemarksExportedSuccess,
            data : result
          })
        } else {
          return res.status(HttpStatus.NOT_FOUND).send({
            statusCode : HttpStatus.NOT_FOUND,
            statusCodeValue : HttpStatus.NOT_FOUND_MESSAGE,
            statusMessage : STATUS_MESSAGE.dataNotAvailable,
            data : null
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

async function getDossierPackage (req : Request, res : Response) {
  const methodName = "getDossierPackage";
  try {
    const {accountId, caseId} = req.params;
    const data : any = {};
    data.account_rid = accountId;
    data.case_rid = caseId;
    const result = await childCaseService.fetchDossierPackage(data);
    if(result.statusCode === HttpStatus.SUCCESS) {
      return res.status(HttpStatus.SUCCESS).send({
        statusCode : HttpStatus.SUCCESS,
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        statusMessage : STATUS_MESSAGE.dossierPackageFetchedSuccess,
        data : result.data
      })
    } else {
      return res.status(HttpStatus.NOT_FOUND).send({
        statusCode : HttpStatus.NOT_FOUND,
        statusCodeValue : HttpStatus.NOT_FOUND_MESSAGE,
        statusMessage : STATUS_MESSAGE.dataNotAvailable,
        data : null
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
/**
 * Controller function to close a specific case.
 *
 * This async function handles HTTP requests to close a case by:
 * - Validating the presence of a user ID in the request headers
 * - Parsing and normalizing `country_credits` and `state_credits` from the request body
 * - Validating the request payload against the `caseCloseSchema`
 * - Attaching the user identifier to the validated data
 * - Delegating the case closure operation to the `childCaseService.closeCase` method
 * - Returning appropriate HTTP responses based on the operation result (success or not found)
 *
 * Error handling:
 * - Logs a message if the required user ID header is missing
 * - Logs and returns a `BAD_REQUEST` response if validation fails or any runtime error occurs
 *
 * @param {Request} req - Express request object containing headers, body, and uploaded files
 * @param {Response} res - Express response object used to send the API response
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>} - Resolves after sending the HTTP response
 * @throws {Error} - Captures and handles any validation, service, or runtime errors
 */

async function closeCase(req : Request, res : Response) {
  const methodName = "Close Case";
  try {
    const userId = req.headers['x-user-id'];
    if(!userId) {
      addLog(methodName, new Date().toISOString(), STATUS_MESSAGE.userIdMissingInHeader)
    }
    req.body.country_credits = JSON.parse(req.body.country_credits);
    req.body.state_credits = JSON.parse(req.body.state_credits)

    const validData = await validateRequest(req, caseCloseSchema, res);
    validData.user_rid = userId
    const result = await childCaseService.closeCase(validData, req.files as Express.Multer.File[]);
    if(result.statusCode === HttpStatus.SUCCESS) {
      addLog(methodName, new Date().toISOString(), result.statusMessage);
      return res.status(HttpStatus.SUCCESS).json({
        statusCode : HttpStatus.SUCCESS,
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        statusMessage : result.statusMessage
      })
    } else {
      addLog(methodName, new Date().toISOString(), result.statusMessage);
      return res.status(HttpStatus.NOT_FOUND).json({
        statusCode : HttpStatus.NOT_FOUND,
        statusCodeValue : HttpStatus.NOT_FOUND_MESSAGE,
        statusMessage : result.statusMessage
      }) 
    }
  } 
  catch (err) {
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
 * Controller function to retrieve computed values for a specific request.
 *
 * This async function handles HTTP requests to fetch computed data by:
 * - Validating the presence of a user ID in the request headers
 * - Extracting input data from the request body
 * - Delegating the computation logic to the `childCaseService.getComputedValue` method
 * - Returning appropriate HTTP responses based on the service result (success or not found)
 *
 * Response handling:
 * - Returns `SUCCESS` status along with computed data when the operation is successful
 * - Returns `NOT_FOUND` status along with relevant data/message when no matching result is found
 *
 * Error handling:
 * - Logs a message if the required user ID header is missing
 * - Logs and returns a `BAD_REQUEST` response if any runtime or service error occurs
 *
 * @param {Request} req - Express request object containing headers and request body
 * @param {Response} res - Express response object used to send the API response
 * @returns {Promise<void>} - Resolves after sending the HTTP response
 * @throws {Error} - Captures and handles any service or runtime errors
 */

async function getComputedValue(req : Request, res : Response) {
  const methodName = "Get Computed Value"
  try {
    const userId = req.headers['x-user-id'];
    if(!userId) {
      addLog(methodName, new Date().toISOString(), STATUS_MESSAGE.userIdMissingInHeader)
    }
    const data = req.body;
    const result = await childCaseService.getComputedValue(data);
    if(result.statusCode === HttpStatus.SUCCESS) {
      addLog(methodName, new Date().toISOString(), result.statusMessage);
      return res.status(HttpStatus.SUCCESS).json({
        statusCode : HttpStatus.SUCCESS,
        statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
        statusMessage : result.statusMessage,
        data : result.data
      })
    } else {
      addLog(methodName, new Date().toISOString(), result.statusMessage);
      return res.status(HttpStatus.NOT_FOUND).json({
        statusCode : HttpStatus.NOT_FOUND,
        statusCodeValue : HttpStatus.NOT_FOUND_MESSAGE,
        statusMessage : result.statusMessage,
        data : result.data
      }) 
    }
  }
  catch (err) {
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
export default {
    signOffFinancialWorking,
    regionListForFinancialHighlights,
    getClosedCasesList,
    fetchCaseClosingRemarks,
    initiateCreateDossierForm,
    exportSignOffDetails,
    getDossierPackage,
    closeCase,
    getComputedValue
}