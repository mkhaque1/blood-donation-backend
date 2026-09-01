import { z } from 'zod';

const bloodGroupEnum = z.enum([
  'A_POS',
  'A_NEG',
  'B_POS',
  'B_NEG',
  'AB_POS',
  'AB_NEG',
  'O_POS',
  'O_NEG',
]);

export const registerSchema = z.object({
  body: z.object({
    email: z.email(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['DONOR', 'REQUESTER']),
    fullName: z.string().min(2),
    phone: z.string().min(6),
    city: z.string().min(2),
    area: z.string().min(2),
    bloodGroup: bloodGroupEnum.optional(),
    dateOfBirth: z.iso.datetime().optional(),
    weightKg: z.number().positive().optional(),
    organizationType: z.enum(['INDIVIDUAL', 'HOSPITAL']).optional(),
    organizationName: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.email(),
    password: z.string().min(1),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1),
  }),
});
