import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAysnc';
import { sendSuccess } from '../../utils/sendResponse';
import * as authService from './auth.service';

export const register = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.registerUser(req.body);
  sendSuccess(res, {
    statusCode: 201,
    message: 'Registration successful',
    data: result,
  });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await authService.loginUser(email, password);
  sendSuccess(res, {
    statusCode: 200,
    message: 'Login successful',
    data: result,
  });
});

export const refresh = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.refreshAccessToken(req.body.refreshToken);
  sendSuccess(res, {
    statusCode: 200,
    message: 'Token refreshed',
    data: result,
  });
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  await authService.logoutUser(req.body.refreshToken);
  sendSuccess(res, { statusCode: 200, message: 'Logged out successfully' });
});
