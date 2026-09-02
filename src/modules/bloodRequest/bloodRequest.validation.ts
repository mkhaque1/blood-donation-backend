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

export const createBloodRequestSchema = z.object({
  body: z.object({
    patientName: z.string().min(2),
    bloodGroup: bloodGroupEnum,
    unitsNeeded: z.number().int().positive(),
    urgency: z.enum(['NORMAL', 'URGENT', 'CRITICAL']).default('NORMAL'),
    hospitalName: z.string().min(2),
    city: z.string().min(2),
    area: z.string().min(2),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    neededBy: z.iso.datetime(),
    notes: z.string().optional(),
  }),
});

export const listBloodRequestsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z.string().optional(),
    bloodGroup: bloodGroupEnum.optional(),
    city: z.string().optional(),
    urgency: z.enum(['NORMAL', 'URGENT', 'CRITICAL']).optional(),
    sortBy: z.enum(['createdAt', 'neededBy']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

export const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum([
      'PENDING_VERIFICATION',
      'VERIFIED',
      'MATCHING',
      'DONOR_ASSIGNED',
      'COMPLETED',
      'CANCELLED',
      'EXPIRED',
    ]),
  }),
  params: z.object({ id: z.uuid() }),
});
