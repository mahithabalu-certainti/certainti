import { Request, Response, NextFunction } from "express";
import { HttpStatus } from "../utils/constant";

/**
 * Middleware to authenticate the request by checking the 'Authorization' header.
 * If the token is missing or invalid, it returns a 401 Unauthorized response.
 *
 * @param {Request} req - The Express Request object.
 * @param {Response} res - The Express Response object.
 * @param {NextFunction} next - The next middleware function to be called if the token is valid.
 */
const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(HttpStatus.UNAUTHORIZED).json({
      error: HttpStatus.UNAUTHORIZED_MESSAGE,
      message: "Invalid token",
    });
    return;
  }

  next();
};

export default authMiddleware;
