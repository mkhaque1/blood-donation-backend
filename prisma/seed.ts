import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  // --- Demo Admin ---
  const adminEmail = process.env.ADMIN_SEED_EMAIL ?? 'admin@blooddonation.test';
  const adminPassword = process.env.ADMIN_SEED_PASSWORD ?? 'ChangeMe123!';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({
      data: { email: adminEmail, passwordHash, role: 'ADMIN' },
    });
    console.log(`✅ Admin created: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log('Admin already exists, skipping.');
  }

  // --- Demo Donor (compatible with O_POS requests, Dhaka) ---
  const donorEmail = 'seed.donor@test.com';
  const existingDonor = await prisma.user.findUnique({
    where: { email: donorEmail },
  });
  if (!existingDonor) {
    const passwordHash = await bcrypt.hash('DonorPass123', 12);
    const donorUser = await prisma.user.create({
      data: { email: donorEmail, passwordHash, role: 'DONOR' },
    });
    await prisma.donorProfile.create({
      data: {
        userId: donorUser.id,
        fullName: 'Seed Donor',
        phone: '01700000001',
        bloodGroup: 'O_POS',
        dateOfBirth: new Date('1998-01-01'),
        weightKg: 68,
        city: 'Dhaka',
        area: 'Mirpur',
        isAvailable: true,
      },
    });
    console.log(`✅ Donor created: ${donorEmail} / DonorPass123`);
  } else {
    console.log('Seed donor already exists, skipping.');
  }

  // --- Demo Requester ---
  const requesterEmail = 'seed.requester@test.com';
  const existingRequester = await prisma.user.findUnique({
    where: { email: requesterEmail },
  });
  if (!existingRequester) {
    const passwordHash = await bcrypt.hash('RequesterPass123', 12);
    const requesterUser = await prisma.user.create({
      data: { email: requesterEmail, passwordHash, role: 'REQUESTER' },
    });
    await prisma.requesterProfile.create({
      data: {
        userId: requesterUser.id,
        fullName: 'Seed Requester',
        phone: '01700000002',
        organizationType: 'HOSPITAL',
        organizationName: 'City Hospital',
        city: 'Dhaka',
        area: 'Mirpur',
      },
    });
    console.log(`✅ Requester created: ${requesterEmail} / RequesterPass123`);
  } else {
    console.log('Seed requester already exists, skipping.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
