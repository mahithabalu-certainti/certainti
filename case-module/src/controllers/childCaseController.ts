import { Request, Response } from "express";
import Configurations from "../config/config";
import { errorLog, handleErrorResponse, handleSuccessResponse, successLog, validateRequest } from "../utils/helpers";
import { HttpStatus, STATUS_MESSAGE } from "../utils/constants";
import { caseClosedListSchema } from "../lib/joi/schemas/schema";

const services = Configurations.getInstance().getServices();
const childCaseService = services.caseService;

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

async function RegionListForFinancialHighlights (req : Request, res : Response) {
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

export default {
    signOffFinancialWorking,
    RegionListForFinancialHighlights,
    getClosedCasesList,
    fetchCaseClosingRemarks,
    initiateCreateDossierForm,
    exportSignOffDetails
}