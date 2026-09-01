import { Router } from 'express';
import * as authController from './auth.controller';
import { validateRequest } from '../../middlewares/validrequest';
import { registerSchema } from './auth.validation';

const router = Router();

router.post(
  '/register',
  validateRequest(registerSchema),
  authController.register,
);

export default router;
