import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/apiError';
import { BloodGroup, RequestStatus, UrgencyLevel } from '@prisma/client';

interface CreateRequestInput {
  patientName: string;
  bloodGroup: BloodGroup;
  unitsNeeded: number;
  urgency: UrgencyLevel;
  hospitalName: string;
  city: string;
  area: string;
  latitude?: number;
  longitude?: number;
  neededBy: string;
  notes?: string;
}

export async function createBloodRequest(
  createdById: string,
  input: CreateRequestInput,
) {
  const request = await prisma.bloodRequest.create({
    data: { ...input, neededBy: new Date(input.neededBy), createdById },
  });

  await prisma.auditLog.create({
    data: {
      actorId: createdById,
      action: 'REQUEST_CREATED',
      targetType: 'BloodRequest',
      targetId: request.id,
      bloodRequestId: request.id,
    },
  });

  return request;
}

interface ListParams {
  page?: string;
  limit?: string;
  status?: string;
  bloodGroup?: BloodGroup;
  city?: string;
  urgency?: UrgencyLevel;
  sortBy?: 'createdAt' | 'neededBy';
  sortOrder?: 'asc' | 'desc';
}

export async function listBloodRequests(params: ListParams) {
  const page = Math.max(1, Number(params.page ?? 1));
  const limit = Math.min(50, Math.max(1, Number(params.limit ?? 10)));

  const where = {
    deletedAt: null,
    ...(params.status ? { status: params.status as RequestStatus } : {}),
    ...(params.bloodGroup ? { bloodGroup: params.bloodGroup } : {}),
    ...(params.city
      ? { city: { equals: params.city, mode: 'insensitive' as const } }
      : {}),
    ...(params.urgency ? { urgency: params.urgency } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.bloodRequest.findMany({
      where,
      orderBy: { [params.sortBy ?? 'createdAt']: params.sortOrder ?? 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.bloodRequest.count({ where }),
  ]);

  return {
    items,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getBloodRequestById(id: string) {
  const request = await prisma.bloodRequest.findFirst({
    where: { id, deletedAt: null },
  });
  if (!request) throw ApiError.notFound('Blood request not found');
  return request;
}
