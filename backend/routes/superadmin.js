import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { queryAll, queryOne, execute } from '../db.js';

const router = Router();
const SUPER_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || '#jibon2005';
const JWT_SECRET = process.env.JWT_SECRET || 'restaurant-tracker-secret-key-2024';

function superAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'super') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    req.superAdmin = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

router.post('/login', (req, res) => {
  const { password } = req.body;
  if (password !== SUPER_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  const token = jwt.sign({ role: 'super', name: 'Super Admin' }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token });
});

router.get('/stats', superAuth, async (req, res) => {
  const restaurants = await queryAll('SELECT * FROM restaurants ORDER BY created_at DESC');
  const totalRestaurants = restaurants.length;
  const proUsers = restaurants.filter(r => r.plan === 'pro').length;
  const totalOrders = await queryOne('SELECT COUNT(*) as count FROM orders');
  const totalRevenue = await queryOne("SELECT COALESCE(SUM(total),0) as rev FROM orders WHERE status != 'cancelled'");
  const pendingOrders = await queryOne("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'");
  res.json({
    totalRestaurants,
    proUsers,
    totalOrders: totalOrders?.count || 0,
    totalRevenue: totalRevenue?.rev || 0,
    pendingOrders: pendingOrders?.count || 0,
    freeUsers: totalRestaurants - proUsers,
    restaurants
  });
});

router.get('/restaurants', superAuth, async (req, res) => {
  const { search, plan, status } = req.query;
  let sql = 'SELECT * FROM restaurants WHERE 1=1';
  const params = [];
  if (search) { sql += ' AND (name LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (plan) { sql += ' AND plan = ?'; params.push(plan); }
  if (status) { sql += ' AND status = ?'; params.push(status); }
  sql += ' ORDER BY created_at DESC';
  const restaurants = await queryAll(sql, params);
  for (const r of restaurants) {
    const orderCount = await queryOne('SELECT COUNT(*) as count FROM orders WHERE restaurant_id = ?', [r.id]);
    r.totalOrders = orderCount?.count || 0;
  }
  res.json(restaurants);
});

router.put('/restaurants/:id/plan', superAuth, async (req, res) => {
  const { plan } = req.body;
  if (!['free', 'pro'].includes(plan)) return res.status(400).json({ error: 'Invalid plan' });
  await execute('UPDATE restaurants SET plan = ? WHERE id = ?', [plan, req.params.id]);
  res.json({ success: true });
});

router.put('/restaurants/:id/status', superAuth, async (req, res) => {
  const { status } = req.body;
  if (!['active', 'suspended'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  await execute('UPDATE restaurants SET status = ? WHERE id = ?', [status, req.params.id]);
  res.json({ success: true });
});

router.delete('/restaurants/:id', superAuth, async (req, res) => {
  await execute('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE restaurant_id = ?)', [req.params.id]);
  await execute('DELETE FROM orders WHERE restaurant_id = ?', [req.params.id]);
  await execute('DELETE FROM menu_items WHERE restaurant_id = ?', [req.params.id]);
  await execute('DELETE FROM categories WHERE restaurant_id = ?', [req.params.id]);
  await execute('DELETE FROM tables_tbl WHERE restaurant_id = ?', [req.params.id]);
  await execute('DELETE FROM ratings WHERE restaurant_id = ?', [req.params.id]);
  await execute('DELETE FROM restaurants WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

router.get('/restaurants/:id', superAuth, async (req, res) => {
  const restaurant = await queryOne('SELECT * FROM restaurants WHERE id = ?', [req.params.id]);
  if (!restaurant) return res.status(404).json({ error: 'Not found' });
  const orders = await queryAll("SELECT * FROM orders WHERE restaurant_id = ? ORDER BY created_at DESC LIMIT 20", [req.params.id]);
  const totalRevenue = await queryOne("SELECT COALESCE(SUM(total),0) as rev FROM orders WHERE restaurant_id = ? AND status != 'cancelled'", [req.params.id]);
  const avgRating = await queryOne("SELECT COALESCE(AVG(rating),0) as avg FROM ratings WHERE restaurant_id = ?", [req.params.id]);
  res.json({ ...restaurant, totalRevenue: totalRevenue?.rev || 0, avgRating: avgRating?.avg || 0, orders });
});

export default router;
