import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  typescript: true,
});

// Premium subscription price in NZD cents (4.99 NZD = 499 cents)
export const PREMIUM_PRICE_NZD = 499;

export class StripeService {
  /**
   * Create a customer in Stripe
   */
  static async createCustomer(email: string, name?: string): Promise<Stripe.Customer> {
    return await stripe.customers.create({
      email,
      name,
      metadata: {
        source: 'pocketsmith-competitor',
      },
    });
  }

  /**
   * Create a subscription checkout session
   */
  static async createCheckoutSession(
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<Stripe.Checkout.Session> {
    return await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      metadata: {
        source: 'pocketsmith-competitor',
      },
    });
  }

  /**
   * Create a customer portal session
   */
  static async createPortalSession(
    customerId: string,
    returnUrl: string
  ): Promise<Stripe.BillingPortal.Session> {
    return await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  /**
   * Get subscription by ID
   */
  static async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return await stripe.subscriptions.retrieve(subscriptionId);
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return await stripe.subscriptions.cancel(subscriptionId);
  }

  /**
   * Update subscription
   */
  static async updateSubscription(
    subscriptionId: string,
    params: Stripe.SubscriptionUpdateParams
  ): Promise<Stripe.Subscription> {
    return await stripe.subscriptions.update(subscriptionId, params);
  }

  /**
   * Get customer by ID
   */
  static async getCustomer(customerId: string): Promise<Stripe.Customer> {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) {
      throw new Error('Customer has been deleted');
    }
    return customer as Stripe.Customer;
  }

  /**
   * Create or retrieve a price for the premium subscription
   */
  static async createPremiumPrice(): Promise<Stripe.Price> {
    // First, try to find existing price
    const prices = await stripe.prices.list({
      product: 'premium-subscription',
      active: true,
      limit: 1,
    });

    if (prices.data.length > 0) {
      return prices.data[0];
    }

    // Create product if it doesn't exist
    let product: Stripe.Product;
    try {
      product = await stripe.products.retrieve('premium-subscription');
    } catch (error) {
      product = await stripe.products.create({
        id: 'premium-subscription',
        name: 'Premium Subscription',
        description: 'Premium features including multiple bank connections and advanced reports',
        metadata: {
          source: 'pocketsmith-competitor',
        },
      });
    }

    // Create price
    return await stripe.prices.create({
      product: product.id,
      unit_amount: PREMIUM_PRICE_NZD,
      currency: 'nzd',
      recurring: {
        interval: 'month',
      },
      metadata: {
        source: 'pocketsmith-competitor',
      },
    });
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(
    payload: string | Buffer,
    signature: string,
    secret: string
  ): Stripe.Event {
    return stripe.webhooks.constructEvent(payload, signature, secret);
  }

  /**
   * Handle subscription status changes
   */
  static async handleSubscriptionChange(subscription: Stripe.Subscription): Promise<void> {
    const customerId = subscription.customer as string;
    
    // Find user by Stripe customer ID
    // This would typically involve updating the user's subscription status in your database
    console.log('Subscription changed:', {
      subscriptionId: subscription.id,
      customerId,
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end,
    });
  }

  /**
   * Handle payment failures
   */
  static async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const customerId = invoice.customer as string;
    
    console.log('Payment failed:', {
      invoiceId: invoice.id,
      customerId,
      amountDue: invoice.amount_due,
      attemptCount: invoice.attempt_count,
    });
  }
}

export default StripeService;
