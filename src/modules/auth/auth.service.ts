import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/apiError';
import { signAccessToken, signRefreshToken } from '../../utils/jwt';
import { Role } from '@prisma/client';

interface RegisterInput {
  email: string;
  password: string;
  role: 'DONOR' | 'REQUESTER';
  fullName: string;
  phone: string;
  city: string;
  area: string;
  bloodGroup?: string;
  dateOfBirth?: string;
  weightKg?: number;
  organizationType?: string;
  organizationName?: string;
}

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing)
    throw ApiError.conflict('An account with this email already exists');

  if (
    input.role === 'DONOR' &&
    (!input.bloodGroup || !input.dateOfBirth || !input.weightKg)
  ) {
    throw ApiError.badRequest(
      'bloodGroup, dateOfBirth, and weightKg are required for donors',
    );
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: { email: input.email, passwordHash, role: input.role as Role },
    });

    if (input.role === 'DONOR') {
      await tx.donorProfile.create({
        data: {
          userId: newUser.id,
          fullName: input.fullName,
          phone: input.phone,
          bloodGroup: input.bloodGroup as any,
          dateOfBirth: new Date(input.dateOfBirth as string),
          weightKg: input.weightKg as number,
          city: input.city,
          area: input.area,
        },
      });
    } else {
      await tx.requesterProfile.create({
        data: {
          userId: newUser.id,
          fullName: input.fullName,
          phone: input.phone,
          organizationType: input.organizationType ?? 'INDIVIDUAL',
          organizationName: input.organizationName,
          city: input.city,
          area: input.area,
        },
      });
    }

    return newUser;
  });

  return issueTokenPair(user.id, user.role);
}

async function issueTokenPair(userId: string, role: Role) {
  const accessToken = signAccessToken({ userId, role });
  const refreshToken = signRefreshToken({ userId, role });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: { token: refreshToken, userId, expiresAt },
  });

  return { accessToken, refreshToken, role };
}
