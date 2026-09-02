import express from 'express';
import { prisma } from './config/prisma';
import authRoutes from './modules/auth/auth.routes';
import {
  globalErrorHandler,
  notFoundHandler,
} from './middlewares/errorHandler';
import { authenticate, authorize } from './middlewares/auth';
import userRoutes from './modules/user/user.routes';
import donorRoutes from './modules/donor/donor.routes';
import bloodRequestRoutes from './modules/bloodRequest/bloodRequest.routes';

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
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/donors', donorRoutes);
app.use('/api/v1/blood-requests', bloodRequestRoutes);

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
