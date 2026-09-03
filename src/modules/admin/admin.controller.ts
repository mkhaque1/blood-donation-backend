import { Request, Response } from 'express';
import { z } from 'zod';
import { catchAsync } from '../../utils/catchAysnc';
import { sendSuccess } from '../../utils/sendResponse';
import { prisma } from '../../config/prisma';

export const listUsers = catchAsync(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));
  const role = req.query.role as string | undefined;

  const where = { deletedAt: null, ...(role ? { role: role as any } : {}) };

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  sendSuccess(res, {
    statusCode: 200,
    message: 'Users fetched',
    data: items,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

const statusSchema = z.object({ isActive: z.boolean() });

export const updateUserStatus = catchAsync(
  async (req: Request, res: Response) => {
    const { isActive } = statusSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.params.id as string },
      data: { isActive },
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user!.userId,
        action: 'USER_STATUS_CHANGED',
        targetType: 'User',
        targetId: user.id,
        metadata: { isActive },
      },
    });

    sendSuccess(res, {
      statusCode: 200,
      message: 'User status updated',
      data: user,
    });
  },
);

export const removeUser = catchAsync(async (req: Request, res: Response) => {
  await prisma.user.update({
    where: { id: req.params.id as string },
    data: { deletedAt: new Date(), isActive: false },
  });
  sendSuccess(res, { statusCode: 200, message: 'User removed' });
});

export const dashboardStats = catchAsync(
  async (_req: Request, res: Response) => {
    const [
      totalDonors,
      totalRequesters,
      pendingRequests,
      completedRequests,
      totalDonations,
      revenueAgg,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'DONOR', deletedAt: null } }),
      prisma.user.count({ where: { role: 'REQUESTER', deletedAt: null } }),
      prisma.bloodRequest.count({
        where: {
          status: { in: ['PENDING_VERIFICATION', 'VERIFIED', 'MATCHING'] },
        },
      }),
      prisma.bloodRequest.count({ where: { status: 'COMPLETED' } }),
      prisma.donation.count({ where: { status: 'COMPLETED' } }),
      prisma.payment.aggregate({
        where: { status: 'SUCCEEDED' },
        _sum: { amountCents: true },
      }),
    ]);

    sendSuccess(res, {
      statusCode: 200,
      message: 'Dashboard stats fetched',
      data: {
        totalDonors,
        totalRequesters,
        pendingRequests,
        completedRequests,
        totalDonations,
        totalRevenueCents: revenueAgg._sum.amountCents ?? 0,
      },
    });
  },
);

export const auditLogs = catchAsync(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { actor: { select: { email: true, role: true } } },
    }),
    prisma.auditLog.count(),
  ]);

  sendSuccess(res, {
    statusCode: 200,
    message: 'Audit logs fetched',
    data: items,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});
