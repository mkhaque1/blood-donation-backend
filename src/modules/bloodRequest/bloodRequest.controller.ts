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

export const verify = catchAsync(async (req: Request, res: Response) => {
  const request = await service.verifyBloodRequest(
    req.params.id as string,
    req.user!.userId,
  );
  sendSuccess(res, {
    statusCode: 200,
    message: 'Request verified and moved to matching',
    data: request,
  });
});

export const matches = catchAsync(async (req: Request, res: Response) => {
  const donors = await service.findMatchingDonors(req.params.id as string);
  sendSuccess(res, {
    statusCode: 200,
    message: 'Compatible donors found',
    data: donors,
  });
});

export const accept = catchAsync(async (req: Request, res: Response) => {
  const donation = await service.acceptBloodRequest(
    req.params.id as string,
    req.user!.userId,
  );
  sendSuccess(res, {
    statusCode: 201,
    message: 'You have pledged to donate. Thank you!',
    data: donation,
  });
});

export const search = catchAsync(async (req: Request, res: Response) => {
  const results = await service.searchBloodRequests(String(req.query.q ?? ''));
  sendSuccess(res, {
    statusCode: 200,
    message: 'Search results',
    data: results,
  });
});

export const updateStatus = catchAsync(async (req: Request, res: Response) => {
  const request = await service.updateBloodRequestStatus(
    req.params.id as string,
    req.body.status,
    req.user!.userId,
  );
  sendSuccess(res, {
    statusCode: 200,
    message: 'Request status updated',
    data: request,
  });
});

export const remove = catchAsync(async (req: Request, res: Response) => {
  await service.softDeleteBloodRequest(req.params.id as string);
  sendSuccess(res, { statusCode: 200, message: 'Request cancelled' });
});
