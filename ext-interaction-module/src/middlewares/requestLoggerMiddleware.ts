import { Request, Response, NextFunction } from "express";
import configurations from "../config/config";

const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const logger = configurations.getInstance().getLogger();
  const logMessage = {
    method: req.method,
    url: req.originalUrl,
    timestamp: new Date().toISOString(),
  };

  logger.info("Incomming Requests : ", logMessage);
  next();
};

export default requestLogger;
