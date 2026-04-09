import { Response } from 'express';

export function sendSuccess(res: Response, data: any, message = 'Success', statusCode = 200): void {
  res.status(statusCode).json({
    status: 'SUCCESS',
    message,
    data,
  });
}

export function sendError(res: Response, message: string, statusCode = 500, error?: any): void {
  res.status(statusCode).json({
    status: 'FAILED',
    message,
    error: error?.message || error || undefined,
  });
}
