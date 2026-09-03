import { Router, raw } from 'express';
import * as controller from './payment.controller';

const router = Router();

router.post('/', raw({ type: 'application/json' }), controller.webhook);

export default router;
