export interface OrderRecord {
  id: string;
  userId: string;
  planId: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'expired' | 'cancelled';
  amountCents: number;
  currency: 'usd' | 'zwg';
  sessionId?: string;
  checkoutUrl?: string;
  createdAt: string;
  paidAt?: string;
  metadata?: Record<string, string>;
}

export interface CheckoutSessionRecord {
  id: string; // cs_...
  orderId: string;
  userId: string;
  status: string;
  url: string;
  currency: string;
  amountCents: number;
  clientSecret?: string;
  createdAt: string;
}

export interface PaymentRecord {
  id: string; // ch_... or cs_...
  orderId: string;
  userId: string;
  eventId?: string;
  amountCents: number;
  currency: string;
  status: string;
  providerStatus: string;
  paymentMethod?: string; // ecocash | onemoney | card
  providerReference?: string;
  failureCode?: string;
  failureReason?: string;
  createdAt: string;
}

export interface WebhookEventRecord {
  id: string; // evt_... primary key for idempotency
  type: string;
  livemode: boolean | string;
  payload: any;
  receivedAt: string;
  processedAt: string;
}

export interface SubscriptionRecord {
  id: string;
  userId: string;
  planId: string;
  currency: 'usd' | 'zwg';
  amountCents: number;
  interval: 'month' | 'year';
  status: 'active' | 'past_due' | 'canceled';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextBillingAt: string;
  failureCount: number;
  createdAt: string;
  canceledAt?: string;
}

// In-Memory Data Store with LocalStorage hydration where available
const ordersMap = new Map<string, OrderRecord>();
const sessionsMap = new Map<string, CheckoutSessionRecord>();
const paymentsMap = new Map<string, PaymentRecord>();
const webhookEventsMap = new Map<string, WebhookEventRecord>();
const subscriptionsMap = new Map<string, SubscriptionRecord>();

export const PayonifyStore = {
  // Orders
  createOrder: (order: OrderRecord) => {
    ordersMap.set(order.id, order);
    return order;
  },
  getOrder: (orderId: string) => ordersMap.get(orderId),
  updateOrderStatus: (orderId: string, status: OrderRecord['status'], paidAt?: string) => {
    const order = ordersMap.get(orderId);
    if (order) {
      order.status = status;
      if (paidAt) order.paidAt = paidAt;
      ordersMap.set(orderId, order);
    }
    return order;
  },
  listOrdersByUser: (userId: string) => {
    return Array.from(ordersMap.values()).filter((o) => o.userId === userId);
  },

  // Sessions
  createSession: (session: CheckoutSessionRecord) => {
    sessionsMap.set(session.id, session);
    return session;
  },
  getSession: (sessionId: string) => sessionsMap.get(sessionId),
  getSessionByOrderId: (orderId: string) => {
    return Array.from(sessionsMap.values()).find((s) => s.orderId === orderId);
  },

  // Payments
  recordPayment: (payment: PaymentRecord) => {
    paymentsMap.set(payment.id, payment);
    return payment;
  },
  listPayments: () => Array.from(paymentsMap.values()),

  // Webhook Idempotency Guard (dedupe by event.id)
  hasWebhookEvent: (eventId: string) => webhookEventsMap.has(eventId),
  recordWebhookEvent: (record: WebhookEventRecord) => {
    webhookEventsMap.set(record.id, record);
    return record;
  },

  // Subscriptions — one active row per userId (renewals replace, they don't stack rows)
  upsertSubscription: (sub: SubscriptionRecord) => {
    // Drop any prior active subscription for this user so getSubscriptionByUser stays unique.
    for (const [id, existing] of subscriptionsMap.entries()) {
      if (existing.userId === sub.userId && existing.status === 'active' && id !== sub.id) {
        subscriptionsMap.set(id, {
          ...existing,
          status: 'canceled',
          canceledAt: new Date().toISOString(),
        });
      }
    }
    // Stable id per user keeps renewals updating one record instead of leaking rows.
    const stableId = sub.id?.startsWith('sub_user_')
      ? sub.id
      : `sub_user_${sub.userId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64)}`;
    const finalSub: SubscriptionRecord = { ...sub, id: stableId };
    subscriptionsMap.set(stableId, finalSub);
    return finalSub;
  },
  getSubscriptionByUser: (userId: string) => {
    const actives = Array.from(subscriptionsMap.values()).filter(
      (s) => s.userId === userId && s.status === 'active'
    );
    if (actives.length === 0) return undefined;
    // Prefer the furthest period end if multiples somehow remain.
    return actives.sort(
      (a, b) => Date.parse(b.currentPeriodEnd) - Date.parse(a.currentPeriodEnd)
    )[0];
  },
  listSubscriptions: () => Array.from(subscriptionsMap.values()),
};
