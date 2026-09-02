import { Router } from 'express';
import * as controller from './donor.controller';
import { authenticate, authorize } from '../../middlewares/auth';

const router = Router();
router.use(authenticate());

router.get('/me', authorize('DONOR'), controller.getMyProfile);
router.patch('/me', authorize('DONOR'), controller.updateMyProfile);
router.patch(
  '/me/availability',
  authorize('DONOR'),
  controller.toggleAvailability,
);
router.get('/me/donations', authorize('DONOR'), controller.myDonationHistory);

export default router;
