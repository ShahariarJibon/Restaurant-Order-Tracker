import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { queryAll, queryOne, execute } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/', async (req, res) => {
  const { restaurant_id, customer_name, message } = req.body;
  if (!restaurant_id || !message) {
    return res.status(400).json({ error: 'restaurant_id and message are required' });
  }
  const id = uuidv4();
  await execute(
    'INSERT INTO feedback (id, restaurant_id, customer_name, message) VALUES (?, ?, ?, ?)',
    [id, restaurant_id, customer_name || 'Anonymous', message]
  );
  res.json({ id, message: 'Feedback submitted' });
});

router.get('/admin', authMiddleware, async (req, res) => {
  const feedback = await queryAll(
    'SELECT * FROM feedback WHERE restaurant_id = ? ORDER BY created_at DESC',
    [req.restaurant.id]
  );
  res.json(feedback);
});

router.delete('/:id', authMiddleware, async (req, res) => {
  await execute('DELETE FROM feedback WHERE id = ? AND restaurant_id = ?', [req.params.id, req.restaurant.id]);
  res.json({ message: 'Deleted' });
});

export default router;
