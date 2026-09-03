import Stripe from 'stripe';
import { prisma } from '../../config/prisma';
import { stripe } from '../../config/stripe';
import { env } from '../../config/env';
import { ApiError } from '../../utils/apiError';

// Requester pays a small fee to mark their blood request as priority.
export async function initiatePriorityFeePayment(
  userId: string,
  bloodRequestId: string,
) {
  const request = await prisma.bloodRequest.findFirst({
    where: { id: bloodRequestId, deletedAt: null },
  });
  if (!request) throw ApiError.notFound('Blood request not found');
  if (request.createdById !== userId)
    throw ApiError.forbidden('You do not own this request');

  const amountCents = env.stripe.priorityFeeCents;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: 'usd',
    metadata: { userId, bloodRequestId, purpose: 'PRIORITY_REQUEST_FEE' },
    automatic_payment_methods: { enabled: true },
  });

  const payment = await prisma.payment.create({
    data: {
      userId,
      bloodRequestId,
      provider: 'stripe',
      providerRef: paymentIntent.id,
      purpose: 'PRIORITY_REQUEST_FEE',
      amountCents,
      status: 'PENDING',
    },
  });

  return { clientSecret: paymentIntent.client_secret, paymentId: payment.id };
}

export async function getPaymentStatus(id: string, userId: string) {
  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment) throw ApiError.notFound('Payment not found');
  if (payment.userId !== userId) throw ApiError.forbidden('Not your payment');
  return payment;
}
