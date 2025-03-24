import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

interface CustomRequest extends Request {
  requestId?: string;
}

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

  next();
};

export default requestLogger;
