import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodType } from 'zod';
import { sendError } from '../utils/sendResponse';

export function validateRequest(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      return sendError(res, {
        statusCode: 400,
        message: 'Validation failed',
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    next();
  };
}
