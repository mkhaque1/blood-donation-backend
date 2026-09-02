import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma';
import { catchAsync } from '../../utils/catchAysnc';
import { sendSuccess } from '../../utils/sendResponse';
import { ApiError } from '../../utils/apiError';

export const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const profile = await prisma.donorProfile.findUnique({
    where: { userId: req.user!.userId },
  });
  if (!profile) throw ApiError.notFound('Donor profile not found');
  sendSuccess(res, {
    statusCode: 200,
    message: 'Donor profile fetched',
    data: profile,
  });
});

const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().min(6).optional(),
  city: z.string().min(2).optional(),
  area: z.string().min(2).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  medicalNotes: z.string().optional(),
});

export const updateMyProfile = catchAsync(
  async (req: Request, res: Response) => {
    const data = updateProfileSchema.parse(req.body);
    const updated = await prisma.donorProfile.update({
      where: { userId: req.user!.userId },
      data,
    });
    sendSuccess(res, {
      statusCode: 200,
      message: 'Profile updated',
      data: updated,
    });
  },
);

export const toggleAvailability = catchAsync(
  async (req: Request, res: Response) => {
    const current = await prisma.donorProfile.findUnique({
      where: { userId: req.user!.userId },
    });
    if (!current) throw ApiError.notFound('Donor profile not found');

    const updated = await prisma.donorProfile.update({
      where: { userId: req.user!.userId },
      data: { isAvailable: !current.isAvailable },
    });
    sendSuccess(res, {
      statusCode: 200,
      message: `Availability set to ${updated.isAvailable}`,
      data: updated,
    });
  },
);

export const myDonationHistory = catchAsync(
  async (req: Request, res: Response) => {
    const donations = await prisma.donation.findMany({
      where: { donorId: req.user!.userId },
      include: {
        bloodRequest: {
          select: {
            patientName: true,
            hospitalName: true,
            bloodGroup: true,
            city: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    sendSuccess(res, {
      statusCode: 200,
      message: 'Donation history fetched',
      data: donations,
    });
  },
);
