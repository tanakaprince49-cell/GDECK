# Payonify Payment Gateway & Checkout Integration

Production-ready integration of **Payonify** for **G-Deck** supporting:
- **Hosted Checkout Sessions** (Credit/Debit Card via Visa/Mastercard, EcoCash, OneMoney)
- **Direct Mobile Money USSD Prompts** (Charge API to customer phones via EcoCash & OneMoney)
- **Multi-Currency**: USD ($) and Zimbabwe Gold (ZWG)
- **Canonical Webhooks**: HMAC-SHA256 timing-safe verification, event idempotency (`event.id`), and automatic subscription provisioning
- **Subscriptions Engine**: Managed recurrent billing model on top of Payonify

---

## 1. Credentials Configuration

Your Payonify credentials can be set in `.env` or container environment variables:

```bash
# Mode: test or live
PAYONIFY_MODE=test

# Test Credentials
PAYONIFY_PK_TEST=pk_test_qqOiwGQJnK5K8FTHI3020IG8cvTAxKwt2v8ktuNdTNS8z209WVoBKKO0n3Rl7Gr3dDqwpmag2M9ALJiIsCA00lu9hwWeq7nrqN4
PAYONIFY_SK_TEST=sk_test_CZSlpcVct0gYH16lIyIuuSu75BFr109DEPdLALsI2kJDtqDFwZGl3W0JFMr0LqqVJ46ePk7oUoneX14znvaKew

# Webhook Secret (obtained from Payonify Dashboard -> Webhooks)
PAYONIFY_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Base URL (defaults to https://api.payonify.com)
PAYONIFY_BASE_URL=https://api.payonify.com
```

*Note: In test mode, fallback keys are bundled so the checkout flow works out-of-the-box.*

---

## 2. Webhook Endpoint Registration in Payonify Dashboard

1. Log into your **Payonify Dashboard**: https://dashboard.payonify.co.zw/
2. Navigate to **Developers -> Webhooks** -> **Add Endpoint**.
3. Set your Webhook URL:
   ```
   https://<your-domain>/api/payonify/webhooks
   ```
4. Copy the signing secret (`whsec_...`) and paste it as `PAYONIFY_WEBHOOK_SECRET`.
5. Supported canonical events handled:
   - `checkout.succeeded` / `charge.succeeded` -> Marks order `paid` and grants Pro subscription.
   - `checkout.failed` / `charge.failed` -> Updates order status to `failed`.
   - `refund.succeeded` -> Marks order and subscription `refunded`.

---

## 3. Sandboxed Test Numbers (Zimbabwe EcoCash & OneMoney)

When testing in test mode (`PAYONIFY_MODE=test`), use these sandbox numbers:

| Network | Test Phone Number | Expected Behavior |
|---|---|---|
| **EcoCash** | `771111111` | Instant Success (~8s prompt) |
| **EcoCash** | `771111112` | Delayed Success (~30s) |
| **EcoCash** | `771111113` | Failed (~8s) |
| **EcoCash** | `771111114` | Timeout (never completes) |
| **OneMoney** | `713111111` | Instant Success (~8s prompt) |
| **OneMoney** | `713111112` | Delayed Success (~30s) |
| **OneMoney** | `713111113` | Failed (~8s) |

---

## 4. Architecture & Key Endpoints

- **`POST /api/payonify/checkout/create`**: Creates hosted checkout session with unit amounts strictly in cents (smallest unit integer).
- **`GET /api/payonify/checkout/session/:id`**: Reconciles session state before or during user return.
- **`POST /api/payonify/charges`**: Sends direct USSD mobile money prompt via Charge API.
- **`POST /api/payonify/webhooks`**: Timing-safe HMAC-SHA256 signature verification over the raw request body with idempotency check on `event.id`.
- **`POST /api/payonify/refunds`**: Admin-initiated refunds against charges.
- **`POST /api/payonify/test/mock-webhook-replay`**: Developer utility to test idempotent replaying of webhook events.

---

## 5. Production Go-Live Checklist

- [ ] Set `PAYONIFY_MODE=live`
- [ ] Provide `PAYONIFY_PK_LIVE` (`pk_live_...`) and `PAYONIFY_SK_LIVE` (`sk_live_...`)
- [ ] Register HTTPS production webhook URL on Payonify Dashboard and set `PAYONIFY_WEBHOOK_SECRET`
- [ ] Verify test transactions and confirm EcoCash / OneMoney settlement in dashboard
