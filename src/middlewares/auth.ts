import { NextFunction, Request, Response } from 'express';
import { Role } from '@prisma/client';
import { ApiError } from '../utils/apiError';
import { verifyAccessToken } from '../utils/jwt';
import { prisma } from '../config/prisma';

// Augment Express's Request type so req.user is typed everywhere.
declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; role: Role };
    }
  }
}

export function authenticate() {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const header = req.headers.authorization; // "Bearer <token>"
      if (!header || !header.startsWith('Bearer ')) {
        throw ApiError.unauthorized('Access token is required');
      }
      const token = header.split(' ')[1];
      const payload = verifyAccessToken(token);

      // Re-check the user still exists and is active — a valid token doesn't
      // guarantee the account wasn't deactivated or soft-deleted since it was issued.
      const user = await prisma.user.findFirst({
        where: { id: payload.userId, isActive: true, deletedAt: null },
        select: { id: true, role: true },
      });
      if (!user) throw ApiError.unauthorized('Invalid or expired session');

      req.user = { userId: user.id, role: user.role };
      next();
    } catch {
      next(ApiError.unauthorized('Invalid or expired access token'));
    }
  };
}

// Usage: authorize("ADMIN", "REQUESTER")
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden('You do not have permission to perform this action'),
      );
    }
    next();
  };
}
