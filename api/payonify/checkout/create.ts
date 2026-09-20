import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createCheckoutSession } from '../../../src/lib/payonify';
import { PayonifyStore } from '../../../src/lib/payonify-store';
import { GDECK_PLANS } from '../../../src/lib/payonify-routes';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { planId = 'pro_monthly', customerEmail, paymentMethodTypes, currency = 'usd' } = req.body || {};

    const plan = GDECK_PLANS[planId as keyof typeof GDECK_PLANS] || GDECK_PLANS.pro_monthly;
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const effectiveEmail = customerEmail || 'tanakaprince49@gmail.com';

    // Derive protocol and host
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'gdeck.org';
    const protocol = (req.headers['x-forwarded-proto'] as string) || (host.includes('localhost') ? 'http' : 'https');
    const origin = `${protocol}://${host}`;

    const successUrl = `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`;
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
          unit_amount: plan.amountCents,
          quantity: 1,
        },
      ],
      currency: plan.currency,
      successUrl,
      cancelUrl,
      customerEmail: effectiveEmail,
      paymentMethodTypes:
        paymentMethodTypes ||
        (plan.currency === 'usd' ? ['card', 'ecocash', 'onemoney'] : ['ecocash', 'onemoney']),
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
      currency: session.amount?.currency || plan.currency,
      amountCents: session.amount?.value || plan.amountCents,
      clientSecret: session.client_secret,
      createdAt: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url,
      orderId,
      amountCents: plan.amountCents,
      currency: plan.currency,
    });
  } catch (error: any) {
    console.error('Payonify Vercel checkout session creation error:', error);
    return res.status(error.status || 500).json({
      error: error.message || 'Failed to create Payonify checkout session',
      code: error.code,
    });
  }
}
