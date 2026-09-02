import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { catchAsync } from '../../utils/catchAysnc';
import { sendSuccess } from '../../utils/sendResponse';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/apiError';

const router = Router();
router.use(authenticate());

// Works for any authenticated role — returns base user + whichever profile applies.
router.get(
  '/me',
  catchAsync(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        donorProfile: true,
        requesterProfile: true,
      },
    });
    if (!user) throw ApiError.notFound('User not found');
    sendSuccess(res, {
      statusCode: 200,
      message: 'Current user fetched',
      data: user,
    });
  }),
);

export default router;
