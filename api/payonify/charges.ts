import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createCharge } from '../../src/lib/payonify';
import { PayonifyStore } from '../../src/lib/payonify-store';
import { GDECK_PLANS } from '../../src/lib/payonify-routes';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    const {
      mobileNumber,
      network = 'ecocash',
      planId = 'pro_monthly',
      currency = 'usd',
      customerEmail,
    } = req.body || {};

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
      confirm: true,
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

    return res.status(200).json({
      success: true,
      orderId,
      charge: chargeResult,
      message: `Payment request dispatched to ${mobileNumber} on ${network.toUpperCase()}. Please check your phone to approve the PIN prompt.`,
    });
  } catch (error: any) {
    console.error('Direct Mobile Money Charge failed:', error);
    return res.status(error.status || 500).json({
      error: error.message || 'Direct charge failed',
      code: error.code,
      description: error.description,
    });
  }
}
