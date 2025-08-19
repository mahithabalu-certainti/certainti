import { Response } from "express";

/**
 * Sends a standardized error response to the client.
 *
 * @param {Response} res - Express Response object.
 * @param {number} statusCode - HTTP status code (e.g., 400, 500).
 * @param {string} statusCodeValue - A string representation of the status code (e.g., "BAD_REQUEST").
 * @param {string} errorMessage - A detailed error message for the client.
 * @returns {Response} - Sends a JSON response containing the status code, status code value, and error message.
 */
function errorResponse(
  res: Response,
  statusCode: number,
  statusCodeValue: string,
  errorMessage: any
): Response {
  return res.status(statusCode).json({
    statusCode: statusCode,
    statusCodeValue: statusCodeValue,
    statusMessage: errorMessage,
  });
}

/**
 * Sends a standardized success response to the client.
 *
 * @param {Response} res - Express Response object.
 * @param {number} statusCode - HTTP status code (e.g., 200, 201).
 * @param {string} statusCodeValue - A string representation of the status code (e.g., "OK").
 * @param {any} data - The data to be sent in the response body.
 * @param {string} [statusMessage] - An optional message to accompany the successful response.
 * @returns {Response} - Sends a JSON response containing the status code, status code value, optional status message, and data.
 */
function successResponse(
  res: Response,
  statusCode: number,
  statusCodeValue: string,
  data: any,
  statusMessage?: string
): Response {
  return res.status(statusCode).json({
    statusCode: statusCode,
    statusCodeValue: statusCodeValue,
    statusMessage: statusMessage || "", // Default to an empty string if no status message is provided
    data: data,
  });
}

export { errorResponse, successResponse };
