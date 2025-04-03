import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import configurations from "../config/config";
const logger = configurations.getInstance().getLogger();

interface CustomRequest extends Request {
  requestId?: string;
}

/**
 * Middleware to log every incoming request
 */
const requestLogger = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  req.requestId = uuidv4();
  res.setHeader("X-Request-ID", req.requestId);

  const originalJson = res.json;

  res.json = function (data: any): Response {
    if (typeof data === "object" && data !== null) {
      data.requestId = req.requestId;
    }
    return originalJson.call(this, data);
  };

  const logMessage = {
    method: req.method,
    url: req.originalUrl,
    timestamp: new Date().toISOString(),
  };

  logger.info("Incoming request:", logMessage);

  next();
};

export default requestLogger;
