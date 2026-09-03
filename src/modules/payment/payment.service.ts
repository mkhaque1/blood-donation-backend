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

// Called from the raw webhook route — verifies the signature, updates DB status.
export async function handleStripeWebhook(rawBody: Buffer, signature: string) {
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      env.stripe.webhookSecret,
    );
  } catch {
    throw ApiError.badRequest('Invalid webhook signature');
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const intent = event.data.object as Stripe.PaymentIntent;
      await prisma.payment.updateMany({
        where: { providerRef: intent.id },
        data: { status: 'SUCCEEDED' },
      });
      // If this was a priority-request fee, flag the linked request as priority.
      if (
        intent.metadata?.purpose === 'PRIORITY_REQUEST_FEE' &&
        intent.metadata.bloodRequestId
      ) {
        await prisma.bloodRequest.update({
          where: { id: intent.metadata.bloodRequestId },
          data: { isPriority: true },
        });
      }
      break;
    }
    case 'payment_intent.payment_failed': {
      const intent = event.data.object as Stripe.PaymentIntent;
      await prisma.payment.updateMany({
        where: { providerRef: intent.id },
        data: { status: 'FAILED' },
      });
      break;
    }
    default:
      break; // ignore event types we don't care about
  }

  return { received: true };
}
