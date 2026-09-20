import type { VercelRequest, VercelResponse } from '@vercel/node';
import { retrieveCheckoutSession } from '../../../../src/lib/payonify';
import { PayonifyStore } from '../../../../src/lib/payonify-store';

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

    let order = orderId ? PayonifyStore.getOrder(orderId) : undefined;

    if (session.status === 'complete' && order && order.status !== 'paid') {
      PayonifyStore.updateOrderStatus(order.id, 'paid', new Date().toISOString());
      PayonifyStore.upsertSubscription({
        id: `sub_${Date.now()}`,
        userId: order.userId,
        planId: order.planId,
        currency: order.currency,
        amountCents: order.amountCents,
        interval: order.planId.includes('annual') ? 'year' : 'month',
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        nextBillingAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        failureCount: 0,
        createdAt: new Date().toISOString(),
      });
      order = PayonifyStore.getOrder(order.id);
    }

    return res.status(200).json({ session, order });
  } catch (error: any) {
    console.error('Failed to retrieve Payonify session:', error);
    return res.status(error.status || 500).json({
      error: error.message || 'Failed to retrieve session',
      code: error.code,
    });
  }
}
