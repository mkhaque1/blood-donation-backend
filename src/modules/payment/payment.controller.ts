import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAysnc';
import { sendSuccess } from '../../utils/sendResponse';
import * as service from './payment.service';

export const initiatePriorityFee = catchAsync(
  async (req: Request, res: Response) => {
    const result = await service.initiatePriorityFeePayment(
      req.user!.userId,
      req.body.bloodRequestId,
    );
    sendSuccess(res, {
      statusCode: 201,
      message: 'Payment initiated',
      data: result,
    });
  },
);

export const getStatus = catchAsync(async (req: Request, res: Response) => {
  const payment = await service.getPaymentStatus(
    req.params.id as string,
    req.user!.userId,
  );
  sendSuccess(res, {
    statusCode: 200,
    message: 'Payment status fetched',
    data: payment,
  });
});
