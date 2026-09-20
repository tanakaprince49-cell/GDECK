export interface PayonifyEnv {
  mode: 'test' | 'live';
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  baseUrl: string;
}

export function getPayonifyEnv(): PayonifyEnv {
  const mode = (process.env.PAYONIFY_MODE || 'test') as 'test' | 'live';
  
  // Default test keys provided by user as fallbacks if env vars are unset
  const defaultPkTest = 'pk_test_qqOiwGQJnK5K8FTHI3020IG8cvTAxKwt2v8ktuNdTNS8z209WVoBKKO0n3Rl7Gr3dDqwpmag2M9ALJiIsCA00lu9hwWeq7nrqN4';
  const defaultSkTest = 'sk_test_CZSlpcVct0gYH16lIyIuuSu75BFr109DEPdLALsI2kJDtqDFwZGl3W0JFMr0LqqVJ46ePk7oUoneX14znvaKew';

  const publishableKey =
    mode === 'live'
      ? process.env.PAYONIFY_PK_LIVE || process.env.PAYONIFY_PK || ''
      : process.env.PAYONIFY_PK_TEST || process.env.PAYONIFY_PK || defaultPkTest;

  const secretKey =
    mode === 'live'
      ? process.env.PAYONIFY_SK_LIVE || process.env.PAYONIFY_SK || ''
      : process.env.PAYONIFY_SK_TEST || process.env.PAYONIFY_SK || defaultSkTest;

  const webhookSecret = process.env.PAYONIFY_WEBHOOK_SECRET || 'whsec_test_mock_secret';
  const baseUrl = (process.env.PAYONIFY_BASE_URL || 'https://api.payonify.com').replace(/\/+$/, '');

  if (!publishableKey) {
    throw new Error(`Payonify Publishable Key is missing for mode: ${mode}`);
  }
  if (!secretKey) {
    throw new Error(`Payonify Secret Key is missing for mode: ${mode}`);
  }

  return {
    mode,
    publishableKey,
    secretKey,
    webhookSecret,
    baseUrl,
  };
}
