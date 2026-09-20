import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPayonifyEnv } from '../../src/lib/payonify-env';
import { GDECK_PLANS } from '../../src/lib/payonify-routes';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const env = getPayonifyEnv();
    res.status(200).json({
      publishableKey: env.publishableKey,
      mode: env.mode,
      currencies: ['usd', 'zwg'],
      plans: Object.values(GDECK_PLANS),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
