import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { queryAll, queryOne, execute } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
  const items = await queryAll(
    'SELECT * FROM inventory_items WHERE restaurant_id = ? ORDER BY created_at DESC',
    [req.restaurant.id]
  );
  res.json(items);
});

router.post('/', authMiddleware, async (req, res) => {
  const { name, quantity, unit } = req.body;
  if (!name) return res.status(400).json({ error: 'Item name is required' });
  const id = uuidv4();
  await execute(
    'INSERT INTO inventory_items (id, restaurant_id, name, quantity, unit, status) VALUES (?, ?, ?, ?, ?, ?)',
    [id, req.restaurant.id, name, quantity || 0, unit || 'kg', (quantity || 0) > 0 ? 'available' : 'unavailable']
  );
  const item = await queryOne('SELECT * FROM inventory_items WHERE id = ?', [id]);
  res.json(item);
});

router.put('/:id', authMiddleware, async (req, res) => {
  const { name, unit } = req.body;
  const existing = await queryOne('SELECT * FROM inventory_items WHERE id = ? AND restaurant_id = ?', [req.params.id, req.restaurant.id]);
  if (!existing) return res.status(404).json({ error: 'Item not found' });
  if (name) await execute('UPDATE inventory_items SET name = ? WHERE id = ?', [name, req.params.id]);
  if (unit) await execute('UPDATE inventory_items SET unit = ? WHERE id = ?', [unit, req.params.id]);
  const item = await queryOne('SELECT * FROM inventory_items WHERE id = ?', [req.params.id]);
  res.json(item);
});

router.put('/:id/quantity', authMiddleware, async (req, res) => {
  const { delta } = req.body;
  if (typeof delta !== 'number') return res.status(400).json({ error: 'Delta (number) required' });
  const existing = await queryOne('SELECT * FROM inventory_items WHERE id = ? AND restaurant_id = ?', [req.params.id, req.restaurant.id]);
  if (!existing) return res.status(404).json({ error: 'Item not found' });
  const newQuantity = Math.max(0, (existing.quantity || 0) + delta);
  const newStatus = newQuantity > 0 ? 'available' : 'unavailable';
  await execute('UPDATE inventory_items SET quantity = ?, status = ? WHERE id = ?', [newQuantity, newStatus, req.params.id]);
  const item = await queryOne('SELECT * FROM inventory_items WHERE id = ?', [req.params.id]);
  res.json(item);
});

router.put('/:id/toggle', authMiddleware, async (req, res) => {
  const existing = await queryOne('SELECT * FROM inventory_items WHERE id = ? AND restaurant_id = ?', [req.params.id, req.restaurant.id]);
  if (!existing) return res.status(404).json({ error: 'Item not found' });
  const newStatus = existing.status === 'available' ? 'unavailable' : 'available';
  await execute('UPDATE inventory_items SET status = ? WHERE id = ?', [newStatus, req.params.id]);
  const item = await queryOne('SELECT * FROM inventory_items WHERE id = ?', [req.params.id]);
  res.json(item);
});

router.delete('/:id', authMiddleware, async (req, res) => {
  await execute('DELETE FROM inventory_items WHERE id = ? AND restaurant_id = ?', [req.params.id, req.restaurant.id]);
  res.json({ success: true });
});

export default router;
