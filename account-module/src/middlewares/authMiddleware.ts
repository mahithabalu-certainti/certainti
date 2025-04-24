import { Request, Response, NextFunction } from "express";
import { HttpStatus } from "../utils/constant";
import {initSequelize} from "../config/maindbDataSource";

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

const checkUserStatusMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
      const userId = req.headers['x-user-id'] as string;
      console.log("Request Headers: ", req.headers);

      if (!userId) {
          res.status(HttpStatus.BAD_REQUEST).json({
              error: HttpStatus.BAD_REQUEST_MESSAGE,
              message: 'User ID is required in headers'
          });
          return;
      }
      
      const sequelize = await initSequelize()
      // Use raw query instead of Sequelize model
      const users = await sequelize.query(
          `SELECT status, rid, email FROM public."user" WHERE rid = :userId LIMIT 1`,
          {
              replacements: { userId },
              type: 'SELECT'
          }
      );
      
      // Get the first user from the array
      const user = users[0];
      
      if (typeof user === 'object' && user !== null && 'status' in user && (user as { status: string }).status !== 'active') {
          res.status(HttpStatus.FORBIDDEN).json({
              error: HttpStatus.FORBIDDEN_MESSAGE,
              message: 'User account is inactive. Please contact administrator.'
          });
          return;
      }
      
      next();
  } catch (error) {
      console.error('Error checking user status:', error);
      res.status(HttpStatus.FAILED).json({
          error: HttpStatus.FAILED_MESSAGE,
          message: 'Failed to verify user status'
      });
  }
}

export { authMiddleware, checkUserStatusMiddleware};
