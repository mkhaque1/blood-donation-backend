import { Router } from 'express';
import * as controller from './bloodRequest.controller';
import { authenticate, authorize } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validRequest';
import {
  createBloodRequestSchema,
  listBloodRequestsSchema,
  updateStatusSchema,
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
router.get('/search', controller.search);
router.get('/:id', controller.getById);
router.get('/:id/matches', authorize('ADMIN', 'REQUESTER'), controller.matches);
router.patch('/:id/verify', authorize('ADMIN'), controller.verify);
router.post('/:id/accept', authorize('DONOR'), controller.accept);
router.patch(
  '/:id/status',
  authorize('ADMIN', 'REQUESTER'),
  validateRequest(updateStatusSchema),
  controller.updateStatus,
);
router.delete('/:id', authorize('ADMIN', 'REQUESTER'), controller.remove);

export default router;
