import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { queryAll, queryOne, execute } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/categories', authMiddleware, (req, res) => {
  const categories = queryAll('SELECT * FROM categories WHERE restaurant_id = ? ORDER BY sort_order', [req.restaurant.id]);
  res.json(categories);
});

router.post('/categories', authMiddleware, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const id = uuidv4();
  execute('INSERT INTO categories (id, restaurant_id, name) VALUES (?, ?, ?)', [id, req.restaurant.id, name]);
  res.json({ id, name });
});

router.delete('/categories/:id', authMiddleware, (req, res) => {
  execute('DELETE FROM categories WHERE id = ? AND restaurant_id = ?', [req.params.id, req.restaurant.id]);
  res.json({ success: true });
});

router.get('/items', authMiddleware, (req, res) => {
  const items = queryAll(
    `SELECT m.*, c.name as category_name FROM menu_items m
     LEFT JOIN categories c ON m.category_id = c.id
     WHERE m.restaurant_id = ? ORDER BY m.created_at DESC`,
    [req.restaurant.id]
  );
  res.json(items);
});

router.get('/public/:restaurantId', (req, res) => {
  const restaurant = queryOne('SELECT id, name FROM restaurants WHERE id = ?', [req.params.restaurantId]);
  const categories = queryAll('SELECT * FROM categories WHERE restaurant_id = ? ORDER BY sort_order', [req.params.restaurantId]);
  const items = queryAll('SELECT * FROM menu_items WHERE restaurant_id = ? AND available = 1', [req.params.restaurantId]);
  res.json({ restaurant, categories, items });
});

router.post('/items', authMiddleware, (req, res) => {
  const { name, price, description, category_id, image } = req.body;
  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Name and price are required' });
  }
  const id = uuidv4();
  execute(
    'INSERT INTO menu_items (id, restaurant_id, category_id, name, price, description, image) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, req.restaurant.id, category_id || null, name, parseFloat(price), description || '', image || '']
  );
  res.json({ id, name, price, description, category_id, image });
});

router.put('/items/:id', authMiddleware, (req, res) => {
  const { name, price, description, category_id, image, available } = req.body;
  execute(
    'UPDATE menu_items SET name=?, price=?, description=?, category_id=?, image=?, available=? WHERE id=? AND restaurant_id=?',
    [name, price, description, category_id || null, image, available !== undefined ? (available ? 1 : 0) : 1, req.params.id, req.restaurant.id]
  );
  res.json({ success: true });
});

router.delete('/items/:id', authMiddleware, (req, res) => {
  execute('DELETE FROM menu_items WHERE id = ? AND restaurant_id = ?', [req.params.id, req.restaurant.id]);
  res.json({ success: true });
});

export default router;
