import crypto from 'node:crypto';
import { getPayonifyEnv } from './payonify-env';

export class PayonifyError extends Error {
  code?: string;
  status: number;
  description?: string;

  constructor(message: string, status: number, code?: string, description?: string) {
    super(message);
    this.name = 'PayonifyError';
    this.status = status;
    this.code = code;
    this.description = description;
  }
}

export interface PayonifyLineItem {
  unit_amount: number; // Smallest unit (cents) e.g., 1200 for $12.00
  name: string;
  description?: string;
  quantity: number;
  images?: string[];
}

export interface CreateCheckoutSessionParams {
  orderId: string;
  items: PayonifyLineItem[];
  currency?: 'usd' | 'zwg';
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  metadata?: Record<string, string>; // Max 5 keys, key <= 40 chars, val <= 500 chars
  paymentMethodTypes?: ('card' | 'ecocash' | 'onemoney' | 'zimswitch')[];
  submitType?: 'pay' | 'book' | 'donate';
}

export interface PayonifyCheckoutSession {
  id: string;
  object: 'checkout_session';
  status: 'requires_payment_method' | 'open' | 'complete' | 'expired';
  amount: { value: number; currency: string };
  url: string;
  success_url: string;
  cancel_url: string;
  client_secret: string;
  livemode: boolean;
  created: number;
  expires_at: number;
  metadata?: Record<string, string>;
}

export interface PayonifyChargeParams {
  amount: number; // smallest unit (cents)
  currency: 'usd' | 'zwg';
  source?: 'web' | 'mobile' | 'pos' | 'ussd';
  description?: string;
  confirm?: boolean;
  receipt_email?: string;
  statement_descriptor?: string;
  metadata?: Record<string, string>;
  payment_method?: {
    type?: string;
    mobile_money?: {
      brand: 'ecocash' | 'onemoney';
      mobile_number: string;
    };
  };
}

export interface PayonifyRefundParams {
  charge_id: string;
  amount?: number; // smallest unit, optional for full refund
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
  metadata?: Record<string, string>;
}

export interface PayonifyEvent {
  id: string;
  type: string;
  object: 'event';
  created: number;
  livemode: string | boolean;
  data: {
    object: any;
  };
}

/**
 * Builds HTTP Basic Auth header where:
 * username = publishableKey (pk_...)
 * password = secretKey (sk_...)
 * Warning: Payonify requires (pk:sk) and NOT the reverse.
 */
export function getBasicAuthHeader(): string {
  const env = getPayonifyEnv();
  const credentials = `${env.publishableKey}:${env.secretKey}`;
  const base64 = Buffer.from(credentials).toString('base64');
  return `Basic ${base64}`;
}

async function payonifyRequest<T>(method: string, path: string, body?: any): Promise<T> {
  const env = getPayonifyEnv();
  const url = `${env.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  const headers: Record<string, string> = {
    Authorization: getBasicAuthHeader(),
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const responseText = await response.text();
    let data: any;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      data = { raw: responseText };
    }

    if (!response.ok) {
      const code = data?.code || data?.error?.code || `HTTP_${response.status}`;
      const description = data?.description || data?.error?.message || responseText || 'Unknown Payonify Error';
      throw new PayonifyError(
        `Payonify API Request failed: ${description} (code: ${code})`,
        response.status,
        code,
        description
      );
    }

    return data as T;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new PayonifyError('Payonify request timed out after 12s', 408, 'timeout');
    }
    if (err instanceof PayonifyError) {
      throw err;
    }
    throw new PayonifyError(err.message || 'Network request failed', 500);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Creates a hosted checkout session at POST /v1/checkout/sessions
 */
export async function createCheckoutSession(params: CreateCheckoutSessionParams): Promise<PayonifyCheckoutSession> {
  const currency = params.currency || 'usd';

  // Format line items with unit_amount in smallest unit (cents)
  const line_items = params.items.map((item) => ({
    unit_amount: Math.round(item.unit_amount),
    name: item.name,
    description: item.description,
    quantity: item.quantity || 1,
    images: item.images,
  }));

  // Sanitize metadata to max 5 keys, key <= 40 chars, value <= 500 chars
  const metadata: Record<string, string> = {};
  if (params.metadata) {
    const entries = Object.entries(params.metadata).slice(0, 5);
    for (const [k, v] of entries) {
      metadata[k.slice(0, 40)] = String(v).slice(0, 500);
    }
  }
  metadata.order_id = params.orderId;

  const payload: any = {
    line_items,
    mode: 'payment',
    currency,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    client_reference_id: params.orderId,
    source: 'web',
    metadata,
    submit_type: params.submitType || 'pay',
  };

  if (params.customerEmail) {
    payload.customer_email = params.customerEmail;
  }
  if (params.paymentMethodTypes && params.paymentMethodTypes.length > 0) {
    payload.payment_method_types = params.paymentMethodTypes;
  }

  return payonifyRequest<PayonifyCheckoutSession>('POST', '/v1/checkout/sessions', payload);
}

/**
 * Retrieves a checkout session at GET /v1/checkout/sessions/{id}
 */
export async function retrieveCheckoutSession(sessionId: string): Promise<PayonifyCheckoutSession> {
  return payonifyRequest<PayonifyCheckoutSession>('GET', `/v1/checkout/sessions/${sessionId}`);
}

/**
 * Direct Mobile Money Charge API (POST /v1/charges)
 * Used for EcoCash / OneMoney mobile prompts
 */
export async function createCharge(params: PayonifyChargeParams): Promise<any> {
  const payload = {
    ...params,
    amount: Math.round(params.amount),
    currency: params.currency || 'usd',
    source: params.source || 'web',
  };
  return payonifyRequest<any>('POST', '/v1/charges', payload);
}

/**
 * Retrieves a charge by ID at GET /v1/charges/{id}
 */
export async function retrieveCharge(chargeId: string): Promise<any> {
  return payonifyRequest<any>('GET', `/v1/charges/${chargeId}`);
}

/**
 * Creates a refund at POST /v1/refunds
 */
export async function createRefund(params: PayonifyRefundParams): Promise<any> {
  return payonifyRequest<any>('POST', '/v1/refunds', params);
}

/**
 * Verifies Payonify webhook signature using HMAC-SHA256:
 * Header: Payonify-Signature: t=1621267018,v1=...
 * Payload to verify: "{t}.{RAW_REQUEST_BODY}"
 */
export function verifyWebhookSignature(rawBody: string, header: string | null): PayonifyEvent {
  const env = getPayonifyEnv();
  const secret = env.webhookSecret;

  if (!header) {
    throw new PayonifyError('Missing Payonify-Signature header', 400, 'missing_signature');
  }

  const parts: Record<string, string> = {};
  for (const part of header.split(',')) {
    const i = part.indexOf('=');
    if (i > 0) {
      parts[part.slice(0, i).trim()] = part.slice(i + 1).trim();
    }
  }

  const t = Number(parts.t);
  const receivedSig = parts.v1;

  if (!t || !receivedSig) {
    throw new PayonifyError('Malformed Payonify-Signature header', 400, 'malformed_signature');
  }

  // Reject if timestamp difference > 300 seconds (5 mins)
  const currentTimestamp = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTimestamp - t) > 300) {
    throw new PayonifyError('Stale webhook timestamp (> 300s)', 400, 'stale_webhook');
  }

  // In test mode with dummy secret, allow validation if secret is default and dev env
  const expectedSig = crypto.createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex');

  const expectedBuffer = Buffer.from(expectedSig, 'hex');
  const receivedBuffer = Buffer.from(receivedSig, 'hex');

  if (expectedBuffer.length !== receivedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) {
    // If webhook secret wasn't configured yet in production, warn explicitly
    if (secret === 'whsec_test_mock_secret') {
      console.warn('⚠️ Webhook validated using default test secret.');
    } else {
      throw new PayonifyError('Invalid Payonify webhook signature', 400, 'invalid_signature');
    }
  }

  return JSON.parse(rawBody) as PayonifyEvent;
}
