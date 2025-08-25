import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/services/stripe';
import { prisma } from '@/lib/prisma';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancellation(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      case 'customer.created': {
        const customer = event.data.object as Stripe.Customer;
        console.log('Customer created:', customer.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  try {
    // Find user by Stripe customer ID
    // Note: We need to add stripeCustomerId field to User model
    const user = await prisma.user.findFirst({
      where: {
        // stripeCustomerId: customerId, // Add this field to schema
      },
    });

    if (!user) {
      console.error('User not found for customer:', customerId);
      return;
    }

    // Update user subscription
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        subscriptionTier: subscription.status === 'active' ? 'premium' : 'free',
        subscriptionEndsAt: new Date(subscription.current_period_end * 1000),
      },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'subscription_updated',
        resource: 'subscription',
        resourceId: subscription.id,
        details: {
          status: subscription.status,
          tier: subscription.status === 'active' ? 'premium' : 'free',
          periodEnd: subscription.current_period_end,
        },
      },
    });

    console.log('Subscription updated for user:', user.id);
  } catch (error) {
    console.error('Error handling subscription change:', error);
  }
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  try {
    const user = await prisma.user.findFirst({
      where: {
        // stripeCustomerId: customerId,
      },
    });

    if (!user) {
      console.error('User not found for customer:', customerId);
      return;
    }

    // Update user subscription to free tier
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: 'canceled',
        subscriptionTier: 'free',
        subscriptionEndsAt: new Date(subscription.current_period_end * 1000),
      },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'subscription_canceled',
        resource: 'subscription',
        resourceId: subscription.id,
        details: {
          canceledAt: subscription.canceled_at,
          periodEnd: subscription.current_period_end,
        },
      },
    });

    console.log('Subscription canceled for user:', user.id);
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  try {
    const user = await prisma.user.findFirst({
      where: {
        // stripeCustomerId: customerId,
      },
    });

    if (!user) {
      console.error('User not found for customer:', customerId);
      return;
    }

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'payment_succeeded',
        resource: 'payment',
        resourceId: invoice.id,
        details: {
          amount: invoice.amount_paid,
          currency: invoice.currency,
          periodStart: invoice.period_start,
          periodEnd: invoice.period_end,
        },
      },
    });

    console.log('Payment succeeded for user:', user.id);
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  try {
    const user = await prisma.user.findFirst({
      where: {
        // stripeCustomerId: customerId,
      },
    });

    if (!user) {
      console.error('User not found for customer:', customerId);
      return;
    }

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'payment_failed',
        resource: 'payment',
        resourceId: invoice.id,
        details: {
          amount: invoice.amount_due,
          currency: invoice.currency,
          attemptCount: invoice.attempt_count,
          nextPaymentAttempt: invoice.next_payment_attempt,
        },
      },
    });

    console.log('Payment failed for user:', user.id);
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}
