import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PayonifyStore } from '../../src/lib/payonify-store.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const userEmail = (req.query.email as string) || 'tanakaprince49@gmail.com';
  const orders = PayonifyStore.listOrdersByUser(userEmail);
  const subscription = PayonifyStore.getSubscriptionByUser(userEmail);
  return res.status(200).json({ orders, subscription });
}
