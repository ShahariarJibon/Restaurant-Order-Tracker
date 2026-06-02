import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { queryAll, queryOne, execute } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { staffAuthMiddleware, generateStaffToken } from '../middleware/staffAuth.js';

const router = Router();

// Staff login (public)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const staff = await queryOne('SELECT * FROM staff WHERE email = ?', [email]);
  if (!staff) return res.status(401).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, staff.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  const token = generateStaffToken(staff);
  res.json({ token, staff: { id: staff.id, name: staff.name, email: staff.email, role: staff.role, restaurant_id: staff.restaurant_id } });
});

// Get current staff from token
router.get('/me', staffAuthMiddleware, async (req, res) => {
  const staff = await queryOne('SELECT id, name, email, role, restaurant_id, created_at FROM staff WHERE id = ?', [req.staff.id]);
  if (!staff) return res.status(404).json({ error: 'Staff not found' });
  res.json({ staff });
});

// List staff for a restaurant (admin only)
router.get('/', authMiddleware, async (req, res) => {
  const staff = await queryAll('SELECT id, name, email, role, created_at FROM staff WHERE restaurant_id = ? ORDER BY created_at DESC', [req.restaurant.id]);
  res.json(staff);
});

// Create staff (admin only)
router.post('/', authMiddleware, async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ error: 'Name, email, password, and role required' });
  if (!['chef', 'waiter'].includes(role)) return res.status(400).json({ error: 'Role must be chef or waiter' });
  const existing = await queryOne('SELECT id FROM staff WHERE email = ? AND restaurant_id = ?', [email, req.restaurant.id]);
  if (existing) return res.status(400).json({ error: 'Email already used' });
  const id = uuidv4();
  const hashed = await bcrypt.hash(password, 10);
  await execute('INSERT INTO staff (id, restaurant_id, name, email, password, role) VALUES (?, ?, ?, ?, ?, ?)', [id, req.restaurant.id, name, email, hashed, role]);
  res.json({ id, name, email, role, message: 'Staff created' });
});

// Update staff (admin only)
router.put('/:id', authMiddleware, async (req, res) => {
  const { name, email, password, role } = req.body;
  const staff = await queryOne('SELECT * FROM staff WHERE id = ? AND restaurant_id = ?', [req.params.id, req.restaurant.id]);
  if (!staff) return res.status(404).json({ error: 'Staff not found' });
  if (name) await execute('UPDATE staff SET name = ? WHERE id = ?', [name, req.params.id]);
  if (email) await execute('UPDATE staff SET email = ? WHERE id = ?', [email, req.params.id]);
  if (password) { const hashed = await bcrypt.hash(password, 10); await execute('UPDATE staff SET password = ? WHERE id = ?', [hashed, req.params.id]); }
  if (role) await execute('UPDATE staff SET role = ? WHERE id = ?', [role, req.params.id]);
  res.json({ success: true, message: 'Staff updated' });
});

// Delete staff (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  await execute('DELETE FROM staff WHERE id = ? AND restaurant_id = ?', [req.params.id, req.restaurant.id]);
  res.json({ success: true });
});

// --- Chef endpoints ---

// Get orders for chef display (approved, preparing, cooking, ready)
router.get('/chef-orders', staffAuthMiddleware, async (req, res) => {
  const orders = await queryAll(
    `SELECT o.*, t.table_number FROM orders o
     LEFT JOIN tables_tbl t ON o.table_id = t.id
     WHERE o.restaurant_id = ? AND o.status IN ('approved','preparing','cooking','ready')
     ORDER BY o.created_at ASC`,
    [req.staff.restaurant_id]
  );
  for (const order of orders) {
    order.items = await queryAll('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
  }
  res.json(orders);
});

// Chef updates order status (preparing → cooking → ready)
router.put('/chef-status/:id', staffAuthMiddleware, async (req, res) => {
  const { status } = req.body;
  if (!['preparing', 'cooking', 'ready'].includes(status)) {
    return res.status(400).json({ error: 'Invalid chef status' });
  }
  await execute('UPDATE orders SET status = ? WHERE id = ? AND restaurant_id = ?', [status, req.params.id, req.staff.restaurant_id]);
  res.json({ success: true });
});

// --- Waiter endpoints ---

// Get orders for waiter display (ready, delivered)
router.get('/waiter-orders', staffAuthMiddleware, async (req, res) => {
  const orders = await queryAll(
    `SELECT o.*, t.table_number FROM orders o
     LEFT JOIN tables_tbl t ON o.table_id = t.id
     WHERE o.restaurant_id = ? AND o.status IN ('ready','delivered')
     ORDER BY o.created_at ASC`,
    [req.staff.restaurant_id]
  );
  for (const order of orders) {
    order.items = await queryAll('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
  }
  res.json(orders);
});

// Waiter updates order status (ready → delivered → completed)
router.put('/waiter-status/:id', staffAuthMiddleware, async (req, res) => {
  const { status } = req.body;
  if (!['delivered', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid waiter status' });
  }
  await execute('UPDATE orders SET status = ? WHERE id = ? AND restaurant_id = ?', [status, req.params.id, req.staff.restaurant_id]);
  res.json({ success: true });
});

export default router;
