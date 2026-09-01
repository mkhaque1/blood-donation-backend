import { Router } from 'express';
import { validateRequest } from '../../middlewares/validrequest';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from './auth.validation';

const router = Router();

router.post('/register', validateRequest(registerSchema), (req, res) => {
  res.json({ received: req.body });
});

export default router;
