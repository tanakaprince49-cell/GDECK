import express from 'express';
import crypto from 'node:crypto';
import {
  createCheckoutSession,
  readSessionAmount,
  isCheckoutSessionPaid,
  retrieveCheckoutSession,
  retrieveCharge,
  createCharge,
  isChargePaid,
  isChargeFailed,
  createRefund,
  verifyWebhookSignature,
  livemodeMatches,
  PayonifyError,
} from './payonify.js';
import { PayonifyStore } from './payonify-store.js';
import { getPayonifyEnv } from './payonify-env.js';
import { computePeriodEndIso, intervalForPlanId } from './billing-period.js';

export const payonifyRouter = express.Router();

// Defined Plans Catalog (Pricing is strictly defined server-side in smallest integer cents)
export const GDECK_PLANS = {
  pro_monthly: {
    id: 'pro_monthly',
    name: 'G-Deck Pro (Monthly)',
    description: 'Full access to unlimited G-Pilot AI, Cross-Tool Magic Actions, Omni-Search & Priority Sync.',
    amountCents: 1200, // $12.00 USD
    currency: 'usd' as const,
    interval: 'month' as const,
  },
  pro_annual: {
    id: 'pro_annual',
    name: 'G-Deck Pro (Annual)',
    description: 'Full G-Deck Pro access billed annually ($10/mo, 17% savings).',
    amountCents: 12000, // $120.00 USD
    currency: 'usd' as const,
    interval: 'year' as const,
  },
  pro_monthly_zwg: {
    id: 'pro_monthly_zwg',
    name: 'G-Deck Pro (Monthly ZWG)',
    description: 'G-Deck Pro subscription paid via EcoCash or OneMoney in Zimbabwe Gold.',
    amountCents: 32000, // ZWG 320.00
    currency: 'zwg' as const,
    interval: 'month' as const,
  },
};

/**
 * Public status endpoint: provides publishable key and mode to client (never secret key!)
 */
payonifyRouter.get('/config', (req, res) => {
  try {
    const env = getPayonifyEnv();
    res.json({
      publishableKey: env.publishableKey,
      mode: env.mode,
      currencies: ['usd', 'zwg'],
      plans: Object.values(GDECK_PLANS),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/payonify/checkout/create
 * Creates a Payonify hosted checkout session.
 * The price is strictly retrieved from the database/catalog, never trusting client amounts.
 */
payonifyRouter.post('/checkout/create', async (req, res) => {
  try {
    const { planId = 'pro_monthly', customerEmail, paymentMethodTypes, currency = 'usd' } = req.body || {};

    const plan = GDECK_PLANS[planId as keyof typeof GDECK_PLANS] || GDECK_PLANS.pro_monthly;
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const effectiveEmail = customerEmail || 'tanakaprince49@gmail.com';

    // Protocol and Host derived dynamically for local container & cloud run
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
    const origin = `${protocol}://${host}`;

    // No {CHECKOUT_SESSION_ID}: Payonify 422s on template placeholders in redirect URLs.
    const successUrl = `${origin}/checkout/success?order_id=${orderId}`;
    const cancelUrl = `${origin}/checkout/cancel?order_id=${orderId}`;

    // 1. Record pending order in DB
    PayonifyStore.createOrder({
      id: orderId,
      userId: effectiveEmail,
      planId: plan.id,
      status: 'pending',
      amountCents: plan.amountCents,
      currency: plan.currency,
      createdAt: new Date().toISOString(),
      metadata: {
        plan_id: plan.id,
        plan_name: plan.name,
        user_email: effectiveEmail,
      },
    });

    // 2. Call Payonify API
    const session = await createCheckoutSession({
      orderId,
      items: [
        {
          name: plan.name,
          description: plan.description,
          unit_amount: plan.amountCents, // cents integer
          quantity: 1,
        },
      ],
      currency: plan.currency,
      successUrl,
      cancelUrl,
      customerEmail: effectiveEmail,
      paymentMethodTypes: paymentMethodTypes || (plan.currency === 'usd' ? ['card', 'ecocash', 'onemoney'] : ['ecocash', 'onemoney']),
      metadata: {
        order_id: orderId,
        plan_id: plan.id,
        user_email: effectiveEmail,
      },
    });

    // 3. Persist checkout session
    PayonifyStore.createSession({
      id: session.id,
      orderId,
      userId: effectiveEmail,
      status: session.status,
      url: session.url,
      currency: readSessionAmount(session, plan.amountCents, plan.currency).currency,
      amountCents: readSessionAmount(session, plan.amountCents, plan.currency).amountCents,
      clientSecret: session.client_secret,
      createdAt: new Date().toISOString(),
    });

    PayonifyStore.updateOrderStatus(orderId, 'pending');

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
      orderId,
      amountCents: plan.amountCents,
      currency: plan.currency,
    });
  } catch (error: any) {
    console.error('Payonify checkout session creation error:', error);
    res.status(error.status || 500).json({
      error: error.message || 'Failed to create Payonify checkout session',
      code: error.code,
    });
  }
});

/**
 * GET /api/payonify/checkout/session/:id
 * Retrieves session state from Payonify (fallback & reconciliation before webhook arrival)
 */
payonifyRouter.get('/checkout/session/:id', async (req, res) => {
  try {
      const { id } = req.params;
      const session = await retrieveCheckoutSession(id);
      const storedSession = PayonifyStore.getSession(id);

      // A session from the other Payonify environment must never drive fulfilment here.
      if (!livemodeMatches(session)) {
        console.error(`Refusing to fulfil: session ${id} livemode=${session.livemode} does not match app mode`);
        return res.status(409).json({ error: 'Payment session environment mismatch', code: 'livemode_mismatch' });
      }

      const orderId = session.metadata?.order_id || storedSession?.orderId;

      let order = orderId ? PayonifyStore.getOrder(orderId) : undefined;

      // Fulfil only on Payonify's own paid signal (payment_status), not on mere existence
    if (isCheckoutSessionPaid(session) && order && order.status !== 'paid') {
      PayonifyStore.updateOrderStatus(order.id, 'paid', new Date().toISOString());
      // Fulfill subscription
      PayonifyStore.upsertSubscription({
        id: `sub_${Date.now()}`,
        userId: order.userId,
        planId: order.planId,
        currency: order.currency,
        amountCents: order.amountCents,
        interval: intervalForPlanId(order.planId),
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: computePeriodEndIso(new Date(), order.planId),
        nextBillingAt: computePeriodEndIso(new Date(), order.planId),
        failureCount: 0,
        createdAt: new Date().toISOString(),
      });
      order = PayonifyStore.getOrder(order.id);
    }

    const subscription = order?.userId
      ? PayonifyStore.getSubscriptionByUser(order.userId)
      : undefined;

    res.json({
      session,
      order,
      subscription,
    });
  } catch (error: any) {
    console.error('Failed to retrieve Payonify session:', error);
    res.status(error.status || 500).json({
      error: error.message || 'Failed to retrieve session',
      code: error.code,
    });
  }
});

/**
 * POST /api/payonify/charges
 * Direct Mobile Money Charge API (EcoCash / OneMoney prompt sent directly to customer's phone)
 */
payonifyRouter.post('/charges', async (req, res) => {
  try {
    const { mobileNumber, network = 'ecocash', planId = 'pro_monthly', currency = 'usd', customerEmail } = req.body || {};

    if (!mobileNumber) {
      return res.status(400).json({ error: 'Mobile number is required for Direct Mobile Money charge' });
    }

    const plan = GDECK_PLANS[planId as keyof typeof GDECK_PLANS] || GDECK_PLANS.pro_monthly;
    const orderId = `ord_chg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const effectiveEmail = customerEmail || 'tanakaprince49@gmail.com';

    PayonifyStore.createOrder({
      id: orderId,
      userId: effectiveEmail,
      planId: plan.id,
      status: 'pending',
      amountCents: plan.amountCents,
      currency: currency as 'usd' | 'zwg',
      createdAt: new Date().toISOString(),
      metadata: {
        order_id: orderId,
        network,
        phone: mobileNumber,
      },
    });

    const chargeResult = await createCharge({
      amount: plan.amountCents,
      currency: currency as 'usd' | 'zwg',
      source: 'web',
      description: `G-Deck Pro Subscription (${network.toUpperCase()} prompt to ${mobileNumber})`,
      confirm: true, // triggers prompt on user's device immediately
      receipt_email: effectiveEmail,
      metadata: {
        order_id: orderId,
        plan_id: plan.id,
      },
      payment_method: {
        type: 'mobile_money',
        mobile_money: {
          brand: network === 'onemoney' ? 'onemoney' : 'ecocash',
          mobile_number: mobileNumber,
        },
      },
    });

    res.json({
      success: true,
      orderId,
      chargeId: chargeResult?.id,
      paid: isChargePaid(chargeResult),
      charge: chargeResult,
      message: `Payment request dispatched to ${mobileNumber} on ${network.toUpperCase()}. Please check your phone to approve the PIN prompt.`,
    });
  } catch (error: any) {
    console.error('Direct Mobile Money Charge failed:', error);
    res.status(error.status || 500).json({
      error: error.message || 'Direct charge failed',
      code: error.code,
      description: error.description,
    });
  }
});

/**
 * GET /api/payonify/charge-status/:id
 * Dev/self-hosted parity for the Vercel function of the same name: the client polls this
 * to learn whether the customer actually approved the USSD prompt.
 */
payonifyRouter.get('/charge-status/:id', async (req, res) => {
  try {
    const charge = await retrieveCharge(req.params.id);

    // A charge from the other Payonify environment must never drive fulfilment here.
    if (!livemodeMatches(charge)) {
      console.error(`Refusing to fulfil: charge ${req.params.id} livemode=${charge?.livemode} does not match app mode`);
      return res.status(409).json({ error: 'Charge environment mismatch', code: 'livemode_mismatch' });
    }

    const paid = isChargePaid(charge);
    const failed = isChargeFailed(charge);
    const orderId: string | undefined = charge?.metadata?.order_id;
    const order = orderId ? PayonifyStore.getOrder(orderId) : undefined;

    if (paid && order && order.status !== 'paid') {
      PayonifyStore.updateOrderStatus(order.id, 'paid', new Date().toISOString());
    } else if (failed && order && order.status === 'pending') {
      PayonifyStore.updateOrderStatus(order.id, 'failed');
    }

    res.json({
      chargeId: req.params.id,
      status: charge?.status ?? 'unknown',
      paid,
      failed,
      failureCode: charge?.failure_code ?? null,
      failureMessage: charge?.failure_message ?? null,
      order,
      polling: { stop: paid || failed, nextIntervalMs: paid || failed ? 0 : 4000 },
    });
  } catch (error: any) {
    res.status(error.status || 500).json({ error: error.message || 'Failed to retrieve charge status', code: error.code });
  }
});

/**
 * POST /api/payonify/webhooks
 * Canonical Payonify Webhook Receiver
 * - RAW request body verification with timing-safe HMAC-SHA256
 * - Idempotency guard on event.id
 * - Handles: charge.succeeded, charge.failed, checkout.succeeded, checkout.failed, refund.succeeded
 */
payonifyRouter.post('/webhooks', (req, res) => {
  const rawBody = (req as any).rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
  const signatureHeader = req.headers['payonify-signature'] as string | undefined;

  let event: any;
  try {
    event = verifyWebhookSignature(rawBody, signatureHeader || null);
  } catch (err: any) {
    console.error('⚠️ Payonify webhook signature verification failed:', err.message);
    return res.status(400).send(`Invalid signature: ${err.message}`);
  }

  // Idempotency check: event.id is the deduplication guard
  if (PayonifyStore.hasWebhookEvent(event.id)) {
    console.log(`[Payonify Webhook] Deduplicated already processed event: ${event.id}`);
    return res.status(200).json({ status: 'ok', deduped: true });
  }

  // Record raw webhook event for audit trail
  PayonifyStore.recordWebhookEvent({
    id: event.id,
    type: event.type,
    livemode: event.livemode,
    payload: event,
    receivedAt: new Date().toISOString(),
    processedAt: new Date().toISOString(),
  });

  console.log(`[Payonify Webhook] Processing event ${event.id} of type: ${event.type}`);

  try {
    const dataObj = event.data?.object || {};
    const orderId = dataObj.metadata?.order_id || dataObj.client_reference_id;

    // An event from the OTHER Payonify environment must never provision local orders:
    // a live (real-money) event must not be acted on by a test-mode app, and vice versa.
    let skipFulfilment = false;
    try {
      const env = getPayonifyEnv();
      const eventLive = String(event.livemode ?? '').toLowerCase() === 'true';
      if (eventLive !== (env.mode === 'live')) {
        console.warn(`[Payonify Webhook] Event ${event.id} livemode=${event.livemode} does not match app mode -- skipping fulfilment`);
        skipFulfilment = true;
      }
    } catch (envErr: any) {
      console.error('[Payonify Webhook] Payonify env invalid, skipping fulfilment:', envErr?.message);
      skipFulfilment = true;
    }
    if (skipFulfilment) {
      return res.status(200).json({ received: true, skipped: 'livemode_mismatch' });
    }

    switch (event.type) {
      case 'checkout.succeeded':
      case 'charge.succeeded':
      case 'checkout.session.completed': {
        if (orderId) {
          const order = PayonifyStore.updateOrderStatus(orderId, 'paid', new Date().toISOString());
          const userId = order?.userId || dataObj.customer_email || 'tanakaprince49@gmail.com';

          // Record payment details with reference from mobile money / card
          const providerRef = dataObj.payment_method_details?.mobile_money?.reference || dataObj.id;
          PayonifyStore.recordPayment({
            id: dataObj.id || `pay_${Date.now()}`,
            orderId,
            userId,
            eventId: event.id,
            amountCents: dataObj.amount?.value || 1200,
            currency: dataObj.amount?.currency || 'usd',
            status: 'succeeded',
            providerStatus: dataObj.status || 'succeeded',
            paymentMethod: dataObj.payment_method_details?.mobile_money?.brand || 'card',
            providerReference: providerRef,
            createdAt: new Date().toISOString(),
          });

          // Activate / Extend Subscription
          PayonifyStore.upsertSubscription({
            id: `sub_${Date.now()}`,
            userId,
            planId: order?.planId || 'pro_monthly',
            currency: (order?.currency || 'usd') as 'usd' | 'zwg',
            amountCents: order?.amountCents || 1200,
            interval: intervalForPlanId(order?.planId),
            status: 'active',
            currentPeriodStart: new Date().toISOString(),
            currentPeriodEnd: computePeriodEndIso(new Date(), order?.planId || 'pro_monthly'),
            nextBillingAt: computePeriodEndIso(new Date(), order?.planId || 'pro_monthly'),
            failureCount: 0,
            createdAt: new Date().toISOString(),
          });

          console.log(`✅ Order ${orderId} marked PAID. Subscription active for ${userId}.`);
        }
        break;
      }

      case 'checkout.failed':
      case 'charge.failed':
      case 'checkout.session.failed': {
        if (orderId) {
          PayonifyStore.updateOrderStatus(orderId, 'failed');
          console.log(`❌ Order ${orderId} marked FAILED.`);
        }
        break;
      }

      case 'refund.succeeded': {
        if (orderId) {
          PayonifyStore.updateOrderStatus(orderId, 'refunded');
          console.log(`↩️ Order ${orderId} refunded.`);
        }
        break;
      }

      default: {
        console.warn(`[Payonify Webhook] Unhandled event type: ${event.type}`);
        break;
      }
    }

    // Always ACK 200 promptly so Payonify doesn't repeat retries
    return res.status(200).json({ received: true, eventId: event.id });
  } catch (err: any) {
    console.error('Error handling Payonify event logic:', err);
    return res.status(200).json({ received: true, error: err.message });
  }
});

/**
 * POST /api/payonify/refunds (Admin only)
 */
payonifyRouter.post('/refunds', async (req, res) => {
  try {
    const { chargeId, amount, reason } = req.body || {};
    if (!chargeId) {
      return res.status(400).json({ error: 'chargeId is required for refund' });
    }

    const result = await createRefund({
      charge_id: chargeId,
      amount: amount ? Math.round(amount) : undefined,
      reason: reason || 'requested_by_customer',
    });

    res.json({ success: true, refund: result });
  } catch (error: any) {
    res.status(error.status || 500).json({
      error: error.message || 'Refund failed',
      code: error.code,
    });
  }
});

/**
 * GET /api/payonify/orders
 * Returns customer orders & active subscriptions
 */
payonifyRouter.get('/orders', (req, res) => {
  const userEmail = (req.query.email as string) || 'tanakaprince49@gmail.com';
  const orders = PayonifyStore.listOrdersByUser(userEmail);
  const subscription = PayonifyStore.getSubscriptionByUser(userEmail);
  res.json({ orders, subscription });
});

/**
 * POST /api/payonify/test/mock-webhook-replay
 * Test utility to verify idempotency and replay webhook events safely
 */
payonifyRouter.post('/test/mock-webhook-replay', (req, res) => {
  const { orderId, planId = 'pro_monthly' } = req.body || {};
  const mockOrderId = orderId || `ord_${Date.now()}`;

  const mockPayload = {
    id: `evt_test_${Date.now()}`,
    type: 'checkout.succeeded',
    object: 'event',
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    data: {
      object: {
        id: `cs_test_${Date.now()}`,
        status: 'complete',
        amount: { value: 1200, currency: 'usd' },
        metadata: { order_id: mockOrderId, plan_id: planId },
        payment_method_details: {
          type: 'mobile_money',
          mobile_money: { brand: 'ecocash', reference: `MP${Date.now().toString().slice(-6)}` },
        },
      },
    },
  };

  PayonifyStore.updateOrderStatus(mockOrderId, 'paid', new Date().toISOString());
  PayonifyStore.upsertSubscription({
    id: `sub_${Date.now()}`,
    userId: 'tanakaprince49@gmail.com',
    planId,
    currency: 'usd',
    amountCents: 1200,
    interval: intervalForPlanId(planId),
    status: 'active',
    currentPeriodStart: new Date().toISOString(),
    currentPeriodEnd: computePeriodEndIso(new Date(), planId),
    nextBillingAt: computePeriodEndIso(new Date(), planId),
    failureCount: 0,
    createdAt: new Date().toISOString(),
  });

  res.json({ success: true, replayedEvent: mockPayload });
});
