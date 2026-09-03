import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth';
import * as controller from './admin.controller';

const router = Router();
router.use(authenticate(), authorize('ADMIN'));

router.get('/users', controller.listUsers);
router.patch('/users/:id/status', controller.updateUserStatus);
router.delete('/users/:id', controller.removeUser);
router.get('/dashboard-stats', controller.dashboardStats);
router.get('/audit-logs', controller.auditLogs);

export default router;
