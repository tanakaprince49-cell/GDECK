export interface PayonifyEnv {
  mode: 'test' | 'live';
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  /** False when PAYONIFY_WEBHOOK_SECRET is unset (default test value in place). */
  webhookSecretConfigured: boolean;
  baseUrl: string;
}

export const DEFAULT_WEBHOOK_SECRET = 'whsec_test_mock_secret';

// Fallback test keys so local dev works without a .env. Used ONLY when mode is
// 'test'; live mode always requires PAYONIFY_PK_LIVE / PAYONIFY_SK_LIVE.
const DEFAULT_TEST_PK = 'pk_test_qqOiwGQJnK5K8FTHI3020IG8cvTAxKwt2v8ktuNdTNS8z209WVoBKKO0n3Rl7Gr3dDqwpmag2M9ALJiIsCA00lu9hwWeq7nrqN4';
const DEFAULT_TEST_SK = 'sk_test_CZSlpcVct0gYH16lIyIuuSu75BFr109DEPdLALsI2kJDtqDFwZGl3W0JFMr0LqqVJ46ePk7oUoneX14znvaKew';

export function getPayonifyEnv(): PayonifyEnv {
  const mode = (process.env.PAYONIFY_MODE || 'test') as 'test' | 'live';

  const publishableKey =
    mode === 'live'
      ? process.env.PAYONIFY_PK_LIVE || process.env.PAYONIFY_PK || ''
      : process.env.PAYONIFY_PK_TEST || process.env.PAYONIFY_PK || DEFAULT_TEST_PK;

  const secretKey =
    mode === 'live'
      ? process.env.PAYONIFY_SK_LIVE || process.env.PAYONIFY_SK || ''
      : process.env.PAYONIFY_SK_TEST || process.env.PAYONIFY_SK || DEFAULT_TEST_SK;

  const webhookSecret = process.env.PAYONIFY_WEBHOOK_SECRET || DEFAULT_WEBHOOK_SECRET;
  const baseUrl = (process.env.PAYONIFY_BASE_URL || 'https://api.payonify.com').replace(/\/+$/, '');

  if (!publishableKey) {
    throw new Error(`Payonify Publishable Key is missing for mode: ${mode}`);
  }
  if (!secretKey) {
    throw new Error(`Payonify Secret Key is missing for mode: ${mode}`);
  }

  // Cross-mode guards. Both directions are dangerous and must fail loudly at request
  // time, never silently:
  //  - live mode + test key  => real customers would be sandboxed (payments never settle)
  //  - test mode + live key  => a dev box would move real money
  if (mode === 'live' && secretKey.startsWith('sk_test_')) {
    throw new Error(
      'Payonify mode mismatch: PAYONIFY_MODE=live but the configured secret key is a test key (sk_test_...). Set PAYONIFY_SK_LIVE.'
    );
  }
  if (mode === 'test' && secretKey.startsWith('sk_live_')) {
    throw new Error(
      'Payonify mode mismatch: PAYONIFY_MODE=test but the configured secret key is a LIVE key (sk_live_...). Refusing to risk real charges in a test environment. Set PAYONIFY_MODE=live.'
    );
  }

  return {
    mode,
    publishableKey,
    secretKey,
    webhookSecret,
    webhookSecretConfigured: webhookSecret !== DEFAULT_WEBHOOK_SECRET,
    baseUrl,
  };
}
