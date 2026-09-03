import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth';
import * as controller from './payment.controller';

const router = Router();

router.post(
  '/initiate/priority-fee',
  authenticate(),
  authorize('REQUESTER'),
  controller.initiatePriorityFee,
);
router.get('/:id', authenticate(), controller.getStatus);

export default router;
