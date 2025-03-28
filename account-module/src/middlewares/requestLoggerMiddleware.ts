import { Request, Response, NextFunction } from "express";
import configurations from "../config/config";

/**
 * Middleware to log every incoming request
 */
const requestLogger = (req: Request, res: Response, next: NextFunction) => {
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
