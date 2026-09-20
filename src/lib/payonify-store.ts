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

  // Subscriptions
  upsertSubscription: (sub: SubscriptionRecord) => {
    subscriptionsMap.set(sub.id, sub);
    return sub;
  },
  getSubscriptionByUser: (userId: string) => {
    return Array.from(subscriptionsMap.values()).find((s) => s.userId === userId && s.status === 'active');
  },
  listSubscriptions: () => Array.from(subscriptionsMap.values()),
};
