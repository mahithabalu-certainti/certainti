import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import configurations from "../config/config";

interface CustomRequest extends Request {
  requestId?: string;
}

/**
 * Middleware function that logs a unique request ID for each incoming request.
 * It generates a new `requestId` for each request, attaches it to the response headers, 
 * and ensures that the response data includes the `requestId` as well.
 * 
 * @param {CustomRequest} req - The Express request object, extended with a `requestId` property.
 * @param {Response} res - The Express response object, which will have the `requestId` set in the headers and response body.
 * @param {NextFunction} next - The Express next function, used to pass control to the next middleware or route handler.
 * 
 * @returns {void} - This function does not return any value, it simply modifies the request/response objects and passes control to the next middleware.
 */
const requestLogger = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): void => {
  req.requestId = uuidv4();
  res.setHeader("X-Request-ID", req.requestId);

  const originalJson = res.json;

  res.json = function (data: any): Response {
    if (typeof data === "object" && data !== null) {
      data.requestId = req.requestId;
    }
    return originalJson.call(this, data);
  };

  const logger = configurations.getInstance().getLogger();

  const logMessage = {
    method: req.method,
    url: req.originalUrl,
    timestamp: new Date().toISOString(),
  };

  logger.info("Incoming request:", logMessage);
  
  next();
};

export default requestLogger;
