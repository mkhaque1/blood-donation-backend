import { Response } from 'express';

interface SuccessPayload<T> {
  statusCode: number;
  message: string;
  data?: T;
  meta?: Record<string, unknown>;
}

export function sendSuccess<T>(res: Response, payload: SuccessPayload<T>) {
  return res.status(payload.statusCode).json({
    success: true,
    message: payload.message,
    data: payload.data ?? null,
    ...(payload.meta ? { meta: payload.meta } : {}),
  });
}

interface ErrorPayload {
  statusCode: number;
  message: string;
  errors?: unknown[];
}

export function sendError(res: Response, payload: ErrorPayload) {
  return res.status(payload.statusCode).json({
    success: false,
    message: payload.message,
    errors: payload.errors ?? [],
  });
}
