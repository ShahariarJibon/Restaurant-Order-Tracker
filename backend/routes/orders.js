import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { queryAll, queryOne, execute } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/', async (req, res) => {
  const { restaurant_id, table_id, customer_name, items } = req.body;
  if (!restaurant_id || !items || items.length === 0) {
    return res.status(400).json({ error: 'Restaurant ID and items are required' });
  }
  const orderId = uuidv4();
  let total = 0;
  const orderItems = [];
  for (const item of items) {
    const itemId = uuidv4();
    const lineTotal = item.quantity * item.price;
    total += lineTotal;
    orderItems.push({ id: itemId, item_name: item.name, quantity: item.quantity, price: item.price });
  }
  await execute('INSERT INTO orders (id, restaurant_id, table_id, customer_name, total) VALUES (?, ?, ?, ?, ?)',
    [orderId, restaurant_id, table_id || null, customer_name || 'Guest', total]);
  for (const oi of orderItems) {
    await execute('INSERT INTO order_items (id, order_id, item_name, quantity, price) VALUES (?, ?, ?, ?, ?)',
      [oi.id, orderId, oi.item_name, oi.quantity, oi.price]);
  }
  res.json({ orderId, total, message: 'Order placed!' });
});

router.get('/admin', authMiddleware, async (req, res) => {
  const orders = await queryAll(
    `SELECT o.*, t.table_number FROM orders o
     LEFT JOIN tables_tbl t ON o.table_id = t.id
     WHERE o.restaurant_id = ? ORDER BY o.created_at DESC`,
    [req.restaurant.id]
  );
  for (const order of orders) {
    order.items = await queryAll('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
  }
  res.json(orders);
});

router.get('/:id', async (req, res) => {
  const order = await queryOne(
    `SELECT o.*, t.table_number, r.currency FROM orders o
     LEFT JOIN tables_tbl t ON o.table_id = t.id
     LEFT JOIN restaurants r ON o.restaurant_id = r.id WHERE o.id = ?`,
    [req.params.id]
  );
  if (!order) return res.status(404).json({ error: 'Order not found' });
  order.items = await queryAll('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
  res.json(order);
});

router.put('/:id/table', async (req, res) => {
  const { table_id } = req.body;
  if (!table_id) return res.status(400).json({ error: 'Table ID is required' });
  await execute('UPDATE orders SET table_id = ? WHERE id = ?', [table_id, req.params.id]);
  const table = await queryOne('SELECT id, table_number FROM tables_tbl WHERE id = ?', [table_id]);
  res.json({ success: true, table_number: table?.table_number || null });
});

router.get('/public/table/:tableId', async (req, res) => {
  const orders = await queryAll(
    `SELECT o.*, t.table_number FROM orders o
     LEFT JOIN tables_tbl t ON o.table_id = t.id
     WHERE o.table_id = ? ORDER BY o.created_at ASC`,
    [req.params.tableId]
  );
  for (const order of orders) {
    order.items = await queryAll('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
  }
  res.json(orders);
});

router.put('/:id/status', authMiddleware, async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'preparing', 'done', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  await execute('UPDATE orders SET status = ? WHERE id = ? AND restaurant_id = ?', [status, req.params.id, req.restaurant.id]);
  res.json({ success: true });
});

router.delete('/:id', authMiddleware, async (req, res) => {
  await execute('DELETE FROM order_items WHERE order_id = ?', [req.params.id]);
  await execute('DELETE FROM orders WHERE id = ? AND restaurant_id = ?', [req.params.id, req.restaurant.id]);
  res.json({ success: true });
});

router.delete('/done/all', authMiddleware, async (req, res) => {
  await execute(
    'DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE restaurant_id = ? AND status = ?)',
    [req.restaurant.id, 'done']
  );
  await execute('DELETE FROM orders WHERE restaurant_id = ? AND status = ?', [req.restaurant.id, 'done']);
  res.json({ success: true });
});

router.get('/stats/dashboard', authMiddleware, async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const totalOrders = await queryOne('SELECT COUNT(*)::int as count FROM orders WHERE restaurant_id = ?', [req.restaurant.id]);
  const todayStats = await queryOne(
    "SELECT COUNT(*)::int as count, COALESCE(SUM(total),0)::float as revenue FROM orders WHERE restaurant_id = ? AND DATE(created_at) = ?",
    [req.restaurant.id, today]
  );
  const pendingOrders = await queryOne("SELECT COUNT(*)::int as count FROM orders WHERE restaurant_id = ? AND status = 'pending'", [req.restaurant.id]);
  const totalRevenue = await queryOne('SELECT COALESCE(SUM(total),0)::float as total FROM orders WHERE restaurant_id = ?', [req.restaurant.id]);
  res.json({
    totalOrders: totalOrders?.count || 0,
    todayOrders: todayStats?.count || 0,
    todayRevenue: todayStats?.revenue || 0,
    pendingOrders: pendingOrders?.count || 0,
    totalRevenue: totalRevenue?.total || 0
  });
});

export default router;
