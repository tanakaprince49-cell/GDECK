import type { VercelRequest, VercelResponse } from '@vercel/node';
import { retrieveCharge, isChargePaid, isChargeFailed, livemodeMatches } from '../../../src/lib/payonify.js';
import { PayonifyStore } from '../../../src/lib/payonify-store.js';

/**
 * GET /api/payonify/charge-status/:chargeId
 *
 * Single source of truth for "has the customer actually approved the USSD prompt?".
 * Payonify returns a freshly created charge as status 'requires_authorization' with
 * paid: false, so the client must poll this endpoint instead of treating a successful
 * POST /charges as a completed payment.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { id } = req.query;
  const chargeId = Array.isArray(id) ? id[0] : id;

  if (!chargeId) {
    return res.status(400).json({ error: 'Charge ID is required' });
  }

  try {
    const charge = await retrieveCharge(chargeId);

    // A charge from the other Payonify environment must never drive fulfilment here.
    if (!livemodeMatches(charge)) {
      console.error(`Refusing to fulfil: charge ${chargeId} livemode=${charge?.livemode} does not match app mode`);
      return res.status(409).json({ error: 'Charge environment mismatch', code: 'livemode_mismatch' });
    }

    const paid = isChargePaid(charge);
    const failed = isChargeFailed(charge);

    const orderId: string | undefined = charge?.metadata?.order_id;
    let order = orderId ? PayonifyStore.getOrder(orderId) : undefined;

    if (paid && order && order.status !== 'paid') {
      order = PayonifyStore.updateOrderStatus(order.id, 'paid', new Date().toISOString());
      PayonifyStore.upsertSubscription({
        id: `sub_${Date.now()}`,
        userId: order!.userId,
        planId: order!.planId,
        currency: order!.currency,
        amountCents: order!.amountCents,
        interval: order!.planId.includes('annual') ? 'year' : 'month',
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        nextBillingAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        failureCount: 0,
        createdAt: new Date().toISOString(),
      });
      order = PayonifyStore.getOrder(order.id);
    } else if (failed && order && order.status === 'pending') {
      order = PayonifyStore.updateOrderStatus(order.id, 'failed');
    }

    return res.status(200).json({
      chargeId,
      status: charge?.status ?? 'unknown',
      paid,
      failed,
      failureCode: charge?.failure_code ?? null,
      failureMessage: charge?.failure_message ?? null,
      order,
      /** Poll guidance for the client; terminal states need no further polling. */
      polling: {
        stop: paid || failed,
        nextIntervalMs: paid || failed ? 0 : 4000,
      },
    });
  } catch (error: any) {
    console.error('Failed to retrieve Payonify charge:', error);
    return res.status(error.status || 500).json({
      error: error.message || 'Failed to retrieve charge status',
      code: error.code,
    });
  }
}
