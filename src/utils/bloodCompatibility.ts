import { BloodGroup } from '@prisma/client';

// Which donor blood groups CAN donate to a given recipient group.
const COMPATIBILITY_MAP: Record<BloodGroup, BloodGroup[]> = {
  O_NEG: ['O_NEG'],
  O_POS: ['O_NEG', 'O_POS'],
  A_NEG: ['O_NEG', 'A_NEG'],
  A_POS: ['O_NEG', 'O_POS', 'A_NEG', 'A_POS'],
  B_NEG: ['O_NEG', 'B_NEG'],
  B_POS: ['O_NEG', 'O_POS', 'B_NEG', 'B_POS'],
  AB_NEG: ['O_NEG', 'A_NEG', 'B_NEG', 'AB_NEG'],
  AB_POS: [
    'O_NEG',
    'O_POS',
    'A_NEG',
    'A_POS',
    'B_NEG',
    'B_POS',
    'AB_NEG',
    'AB_POS',
  ],
};

export function getCompatibleDonorGroups(
  recipientGroup: BloodGroup,
): BloodGroup[] {
  return COMPATIBILITY_MAP[recipientGroup];
}

export function isDonorEligible(params: {
  dateOfBirth: Date;
  weightKg: number;
  lastDonationDate: Date | null;
}): { eligible: boolean; reason?: string } {
  const ageYears =
    (Date.now() - params.dateOfBirth.getTime()) /
    (1000 * 60 * 60 * 24 * 365.25);

  if (ageYears < 18 || ageYears > 60) {
    return {
      eligible: false,
      reason: 'Donor must be between 18 and 60 years old',
    };
  }
  if (params.weightKg < 50) {
    return { eligible: false, reason: 'Donor must weigh at least 50kg' };
  }
  if (params.lastDonationDate) {
    const daysSince =
      (Date.now() - params.lastDonationDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 90) {
      return {
        eligible: false,
        reason: `Donor must wait ${Math.ceil(90 - daysSince)} more day(s) since last donation`,
      };
    }
  }
  return { eligible: true };
}
