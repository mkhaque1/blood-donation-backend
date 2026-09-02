import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAysnc';
import { sendSuccess } from '../../utils/sendResponse';
import * as service from './bloodRequest.service';

export const create = catchAsync(async (req: Request, res: Response) => {
  const request = await service.createBloodRequest(req.user!.userId, req.body);
  sendSuccess(res, {
    statusCode: 201,
    message: 'Blood request created, pending verification',
    data: request,
  });
});

export const list = catchAsync(async (req: Request, res: Response) => {
  const { items, meta } = await service.listBloodRequests(req.query as any);
  sendSuccess(res, {
    statusCode: 200,
    message: 'Blood requests fetched',
    data: items,
    meta,
  });
});

export const getById = catchAsync(async (req: Request, res: Response) => {
  const request = await service.getBloodRequestById(req.params.id as string);
  sendSuccess(res, {
    statusCode: 200,
    message: 'Blood request fetched',
    data: request,
  });
});
