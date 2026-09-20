import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyWebhookSignature } from '../../src/lib/payonify';
import { PayonifyStore } from '../../src/lib/payonify-store';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const signatureHeader = (req.headers['payonify-signature'] as string) || '';
  let rawBody = '';

  if (typeof req.body === 'string') {
    rawBody = req.body;
  } else if (Buffer.isBuffer(req.body)) {
    rawBody = req.body.toString('utf8');
  } else {
    rawBody = JSON.stringify(req.body);
  }

  let event: any;
  try {
    event = verifyWebhookSignature(rawBody, signatureHeader || null);
  } catch (err: any) {
    console.error('Payonify webhook signature error:', err.message);
    return res.status(400).send(`Invalid signature: ${err.message}`);
  }

  // Idempotency check: event.id
  if (PayonifyStore.hasWebhookEvent(event.id)) {
    console.log(`[Payonify Webhook] Deduplicated already processed event: ${event.id}`);
    return res.status(200).json({ status: 'ok', deduped: true });
  }

  // Record raw event
  PayonifyStore.recordWebhookEvent({
    id: event.id,
    type: event.type,
    livemode: event.livemode,
    payload: event,
    receivedAt: new Date().toISOString(),
    processedAt: new Date().toISOString(),
  });

  try {
    const dataObj = event.data?.object || {};
    const orderId = dataObj.metadata?.order_id || dataObj.client_reference_id;

    switch (event.type) {
      case 'checkout.succeeded':
      case 'charge.succeeded':
      case 'checkout.session.completed': {
        if (orderId) {
          const order = PayonifyStore.updateOrderStatus(orderId, 'paid', new Date().toISOString());
          const userId = order?.userId || dataObj.customer_email || 'tanakaprince49@gmail.com';
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

          PayonifyStore.upsertSubscription({
            id: `sub_${Date.now()}`,
            userId,
            planId: order?.planId || 'pro_monthly',
            currency: (order?.currency || 'usd') as 'usd' | 'zwg',
            amountCents: order?.amountCents || 1200,
            interval: order?.planId?.includes('annual') ? 'year' : 'month',
            status: 'active',
            currentPeriodStart: new Date().toISOString(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            nextBillingAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            failureCount: 0,
            createdAt: new Date().toISOString(),
          });
        }
        break;
      }

      case 'checkout.failed':
      case 'charge.failed':
      case 'checkout.session.failed': {
        if (orderId) {
          PayonifyStore.updateOrderStatus(orderId, 'failed');
        }
        break;
      }

      case 'refund.succeeded': {
        if (orderId) {
          PayonifyStore.updateOrderStatus(orderId, 'refunded');
        }
        break;
      }
    }

    return res.status(200).json({ received: true, eventId: event.id });
  } catch (err: any) {
    console.error('Error handling webhook event:', err);
    return res.status(200).json({ received: true, error: err.message });
  }
}
