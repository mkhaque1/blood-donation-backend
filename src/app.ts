import express from 'express';
import { prisma } from './config/prisma';
import authRoutes from './modules/auth/auth.routes';
import {
  globalErrorHandler,
  notFoundHandler,
} from './middlewares/errorHandler';
import { authenticate, authorize } from './middlewares/auth';

const app = express();

app.use(express.json());

app.get('/', (_req, res) => {
  res.status(200).json({ success: true, message: 'Blood Donation API' });
});

app.get('/health', async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res
    .status(200)
    .json({ success: true, message: 'OK - API and database are healthy' });
});

// Routes

app.use('/api/v1/auth', authRoutes);

// temporary test route
app.get(
  '/api/v1/test/admin-only',
  authenticate(),
  authorize('ADMIN'),
  (req, res) => {
    res.json({ success: true, message: 'You are an admin', data: req.user });
  },
);

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
