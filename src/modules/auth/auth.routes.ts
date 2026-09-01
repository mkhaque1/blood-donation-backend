import { Router } from 'express';

const router = Router();

router.post('/register', (req, res) => {
  res.json({ message: 'Register endpoint', success: true });
});

export default router;
