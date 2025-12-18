import { Request, Response } from "express";
import Configurations from "../config/config";
import { errorLog, handleErrorResponse } from "../utils/helpers";
import { HttpStatus } from "../utils/constants";

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

export default {
    signOffFinancialWorking
}