import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { queryOne, execute } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/submit', authMiddleware, async (req, res) => {
  const { method, trxId, senderNumber, planType } = req.body;
  if (!method || !trxId || !planType) {
    return res.status(400).json({ error: 'Method, transaction ID, and plan type are required' });
  }
  if (!['bkash', 'nagad', 'rocket'].includes(method)) {
    return res.status(400).json({ error: 'Invalid payment method' });
  }
  if (!['monthly', 'yearly'].includes(planType)) {
    return res.status(400).json({ error: 'Invalid plan type' });
  }
  const existing = await queryOne('SELECT id FROM payments WHERE trx_id = ?', [trxId]);
  if (existing) {
    return res.status(400).json({ error: 'This transaction ID has already been used' });
  }
  const amount = planType === 'monthly' ? 499 : 5599;
  const id = uuidv4();
  await execute(
    'INSERT INTO payments (id, restaurant_id, method, trx_id, sender_number, amount, plan_type, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, req.restaurant.id, method, trxId, senderNumber || '', amount, planType, 'pending']
  );
  res.json({ success: true, payment: { id, status: 'pending', amount, planType } });
});

router.get('/status', authMiddleware, async (req, res) => {
  const payment = await queryOne(
    "SELECT * FROM payments WHERE restaurant_id = ? ORDER BY created_at DESC LIMIT 1",
    [req.restaurant.id]
  );
  const plan = await queryOne('SELECT plan, plan_expiry FROM restaurants WHERE id = ?', [req.restaurant.id]);
  res.json({ payment, plan: plan || { plan: 'free', plan_expiry: '' } });
});

export default router;
