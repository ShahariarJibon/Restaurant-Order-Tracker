import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { queryOne, execute } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/', async (req, res) => {
  const { restaurant_id, table_id, rating } = req.body;
  if (!restaurant_id || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Restaurant ID and rating (1-5) are required' });
  }
  const id = uuidv4();
  await execute('INSERT INTO ratings (id, restaurant_id, table_id, rating) VALUES (?, ?, ?, ?)',
    [id, restaurant_id, table_id || null, rating]);
  res.json({ success: true });
});

router.get('/average', authMiddleware, async (req, res) => {
  const result = await queryOne('SELECT AVG(rating) as average FROM ratings WHERE restaurant_id = ?', [req.restaurant.id]);
  res.json({ average: result?.average || 0 });
});

export default router;
