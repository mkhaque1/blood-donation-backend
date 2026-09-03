import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { prisma } from './config/prisma';
import {
  notFoundHandler,
  globalErrorHandler,
} from './middlewares/errorHandler';

import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/user/user.routes';
import donorRoutes from './modules/donor/donor.routes';
import bloodRequestRoutes from './modules/bloodRequest/bloodRequest.routes';
import paymentRoutes from './modules/payment/payment.route';
import paymentWebhookRoutes from './modules/payment/payment.webhook.routes';
import adminRoutes from './modules/admin/admin.routes';

const app = express();

// 1. Security headers
app.use(helmet());

// 2. CORS
app.use(cors({ origin: env.clientUrl, credentials: true }));

// 3. Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    errors: [],
  },
});
app.use(globalLimiter);

// 4. Stricter limiter just for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many auth attempts, please try again later.',
    errors: [],
  },
});

app.use('/api/v1/payments/webhook', paymentWebhookRoutes);

//  Body parsers — for every other route.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res
    .status(200)
    .json({ success: true, message: 'OK - API and database are healthy' });
});

// API routes
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/donors', donorRoutes);
app.use('/api/v1/blood-requests', bloodRequestRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/admin', adminRoutes);

// 404 + error handler — always last.
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
