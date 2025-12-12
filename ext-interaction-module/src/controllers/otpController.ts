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

/**
 * Generates a One-Time Password (OTP) based on the provided request data.
 *
 * This function validates the request body against the expected schema, then calls the
 * interaction service to generate an OTP for the user or use case specified in the request.
 * It handles both success and failure responses and ensures proper logging and error handling.
 *
 * @param {Request} req - The Express request object containing OTP generation parameters in the body.
 * @param {Response} res - The Express response object used to send the generated OTP or error details.
 *
 * @returns {Promise<void>} - A promise that resolves once the OTP generation response has been sent.
 *
 * @throws {Error} - Throws an error if validation fails or if the OTP generation process encounters an issue.
 */
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

/**
 * Verifies a One-Time Password (OTP) based on the provided request data.
 *
 * This function validates the request body using a predefined schema and then invokes
 * the interaction service to verify the submitted OTP. It handles both success and failure
 * scenarios, logging the appropriate messages and sending relevant HTTP responses.
 *
 * @param {Request} req - The Express request object containing the OTP and associated verification data in the body.
 * @param {Response} res - The Express response object used to send back the result of the OTP verification.
 *
 * @returns {Promise<void>} - A promise that resolves once the verification result has been returned.
 *
 * @throws {Error} - Throws an error if validation fails, required fields are missing, or the service operation fails.
 */
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

/**
 * Resends a One-Time Password (OTP) to the user based on the provided request data.
 *
 * This function validates the request body using a predefined schema and then invokes
 * the interaction service to resend the OTP. It handles both success and failure
 * cases by logging messages and sending appropriate HTTP responses.
 *
 * @param {Request} req - The Express request object containing the necessary data to resend the OTP.
 * @param {Response} res - The Express response object used to send back the result of the resend operation.
 *
 * @returns {Promise<void>} - A promise that resolves once the resend operation response is sent.
 *
 * @throws {Error} - Throws an error if validation fails, required fields are missing, or the service operation fails.
 */
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
  resendOtp,
};
