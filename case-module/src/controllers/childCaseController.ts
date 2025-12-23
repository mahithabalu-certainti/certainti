import { Request, Response } from "express";
import Configurations from "../config/config";
import { errorLog, handleErrorResponse } from "../utils/helpers";
import { HttpStatus, STATUS_MESSAGE } from "../utils/constants";

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
        const result = await childCaseService.signOffFinancialWorking(data);
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
            return res.status(HttpStatus.NOT_FOUND).json({
                statusCode : HttpStatus.NOT_FOUND,
                statusCodeValue : HttpStatus.NOT_FOUND_MESSAGE,
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

export default {
    signOffFinancialWorking,
    RegionListForFinancialHighlights
}