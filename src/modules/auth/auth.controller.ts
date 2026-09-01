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
