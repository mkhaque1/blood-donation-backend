import { Router } from 'express';
import * as controller from './bloodRequest.controller';
import { authenticate, authorize } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validRequest';
import {
  createBloodRequestSchema,
  listBloodRequestsSchema,
} from './bloodRequest.validation';

const router = Router();
router.use(authenticate());

router.post(
  '/',
  authorize('REQUESTER'),
  validateRequest(createBloodRequestSchema),
  controller.create,
);
router.get('/', validateRequest(listBloodRequestsSchema), controller.list);
router.get('/:id', controller.getById);
router.patch('/:id/verify', authorize('ADMIN'), controller.verify);

export default router;
