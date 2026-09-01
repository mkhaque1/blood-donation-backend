import express from 'express';
import { prisma } from './config/prisma';

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

export default app;
