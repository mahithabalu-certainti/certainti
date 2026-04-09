import { Request, Response, NextFunction } from 'express';
import { logMessage } from '../utils/logger';

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      status: 'FAILED',
      message: 'Authorization token is required',
    });
    return;
  }

  // Pass user identity headers downstream for services that need them
  const userId = req.headers['x-user-id'] || req.headers['x-azure-id'];
  if (!userId) {
    logMessage('authMiddleware: No user identity header provided (x-user-id or x-azure-id)');
  }

  next();
}
