import type { VercelRequest, VercelResponse } from '@vercel/node';
import { retrieveCheckoutSession, isCheckoutSessionPaid, livemodeMatches } from '../../../../src/lib/payonify.js';
import { PayonifyStore } from '../../../../src/lib/payonify-store.js';
import { computePeriodEndIso, intervalForPlanId } from '../../../../src/lib/billing-period.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;
  const sessionId = Array.isArray(id) ? id[0] : id;

  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  try {
    const session = await retrieveCheckoutSession(sessionId);
    const storedSession = PayonifyStore.getSession(sessionId);
    const orderId = session.metadata?.order_id || storedSession?.orderId;

    // Never fulfil an order from an object created in the other Payonify environment
    // (a sandbox session must not activate a live subscription, and vice versa).
    if (!livemodeMatches(session)) {
      console.error(`Refusing to fulfil: session ${sessionId} livemode=${session.livemode} does not match app mode`);
      return res.status(409).json({ error: 'Payment session environment mismatch', code: 'livemode_mismatch' });
    }

    let order = orderId ? PayonifyStore.getOrder(orderId) : undefined;

    // Provision on Payonify's paid signal only
    if (isCheckoutSessionPaid(session) && order && order.status !== 'paid') {
      PayonifyStore.updateOrderStatus(order.id, 'paid', new Date().toISOString());
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

    return res.status(200).json({ session, order, subscription });
  } catch (error: any) {
    console.error('Failed to retrieve Payonify session:', error);
    return res.status(error.status || 500).json({
      error: error.message || 'Failed to retrieve session',
      code: error.code,
    });
  }
}
