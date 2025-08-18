import { Request, Response } from "express";
import { HttpStatus } from "../utils/constants";
import {
  errorLog,
  handleErrorResponse,
  handleSuccessResponse,
  successLog,
  validateRequest,
} from "../utils/helpers";
import configurations from "../config/config";
import { createOtpSchema } from "../lib/joi/schemas/schema";

const services = configurations.getInstance().getServices();
const interactionService = services.otpService;

async function generateOtp(req: Request, res: Response): Promise<void> {
  const methodName = "Generate OTP";
  try {
    const value = await validateRequest(req, createOtpSchema, res);

    if (!value) {
      return;
    }
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

export default {
  generateOtp,
};
