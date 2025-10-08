import { Request, Response } from "express";
import { HttpStatus } from "../utils/constants";
import {
  errorLog,
  handleErrorResponse,
  handleSuccessResponse,
  logMessage,
  successLog,
  validateRequest,
} from "../utils/helpers";
import configurations from "../config/config";
import { generateOtpSchema, verifyOtpSchema } from "../lib/joi/schemas/schema";

const services = configurations.getInstance().getServices();
const interactionService = services.otpService;

async function generateOtp(req: Request, res: Response): Promise<void> {
  const methodName = "Generate OTP";
  try {
    const value = await validateRequest(req, generateOtpSchema, res);

    if (!value) {
      return;
    }
    logMessage(`[${methodName}] Request received, ${JSON.stringify(req.body)}`);
    const response = await interactionService.generateOtp(value);
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

async function verifyOtp(req: Request, res: Response): Promise<void> {
  const methodName = "Verify OTP";
  try {
    const value = await validateRequest(req, verifyOtpSchema, res);

    if (!value) {
      return;
    }
    logMessage(`[${methodName}] Request received, ${JSON.stringify(req.body)}`);
    const response = await interactionService.verifyOtp(value);
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

async function resendOtp(req: Request, res: Response): Promise<void> {
  const methodName = "Resend OTP";
  try {
    const value = await validateRequest(req, generateOtpSchema, res);

    if (!value) {
      return;
    }
    logMessage(`[${methodName}] Request received, ${JSON.stringify(req.body)}`);
    const response = await interactionService.resendOtp(value);
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

export default {
  generateOtp,
  verifyOtp,
  resendOtp
};
