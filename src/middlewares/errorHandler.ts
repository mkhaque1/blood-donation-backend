import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/apiError';
import { sendError } from '../utils/sendResponse';
import { env } from '../config/env';

export function notFoundHandler(req: Request, res: Response) {
  sendError(res, {
    statusCode: 404,
    message: `Route not found: ${req.originalUrl}`,
  });
}

export function globalErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ApiError) {
    return sendError(res, {
      statusCode: err.statusCode,
      message: err.message,
      errors: err.errors,
    });
  }

  console.error('[UNHANDLED ERROR]', err);
  return sendError(res, {
    statusCode: 500,
    message:
      env.nodeEnv === 'development' && err instanceof Error
        ? err.message
        : 'Internal server error',
  });
}
