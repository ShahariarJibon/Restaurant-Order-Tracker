import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { queryAll, queryOne, execute } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/', (req, res) => {
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
  execute('INSERT INTO orders (id, restaurant_id, table_id, customer_name, total) VALUES (?, ?, ?, ?, ?)',
    [orderId, restaurant_id, table_id || null, customer_name || 'Guest', total]);
  for (const oi of orderItems) {
    execute('INSERT INTO order_items (id, order_id, item_name, quantity, price) VALUES (?, ?, ?, ?, ?)',
      [oi.id, orderId, oi.item_name, oi.quantity, oi.price]);
  }
  res.json({ orderId, total, message: 'Order placed!' });
});

router.get('/admin', authMiddleware, (req, res) => {
  const orders = queryAll(
    `SELECT o.*, t.table_number FROM orders o
     LEFT JOIN tables_tbl t ON o.table_id = t.id
     WHERE o.restaurant_id = ? ORDER BY o.created_at DESC`,
    [req.restaurant.id]
  );
  for (const order of orders) {
    order.items = queryAll('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
  }
  res.json(orders);
});

router.get('/:id', (req, res) => {
  const order = queryOne(
    `SELECT o.*, t.table_number FROM orders o
     LEFT JOIN tables_tbl t ON o.table_id = t.id WHERE o.id = ?`,
    [req.params.id]
  );
  if (!order) return res.status(404).json({ error: 'Order not found' });
  order.items = queryAll('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
  res.json(order);
});

router.put('/:id/status', authMiddleware, (req, res) => {
  const { status } = req.body;
  if (!['pending', 'preparing', 'done'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  execute('UPDATE orders SET status = ? WHERE id = ? AND restaurant_id = ?', [status, req.params.id, req.restaurant.id]);
  res.json({ success: true });
});

router.get('/stats/dashboard', authMiddleware, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const totalOrders = queryOne('SELECT COUNT(*) as count FROM orders WHERE restaurant_id = ?', [req.restaurant.id]);
  const todayStats = queryOne(
    "SELECT COUNT(*) as count, COALESCE(SUM(total),0) as revenue FROM orders WHERE restaurant_id = ? AND date(created_at) = ?",
    [req.restaurant.id, today]
  );
  const pendingOrders = queryOne("SELECT COUNT(*) as count FROM orders WHERE restaurant_id = ? AND status = 'pending'", [req.restaurant.id]);
  const totalRevenue = queryOne('SELECT COALESCE(SUM(total),0) as total FROM orders WHERE restaurant_id = ?', [req.restaurant.id]);
  res.json({
    totalOrders: totalOrders?.count || 0,
    todayOrders: todayStats?.count || 0,
    todayRevenue: todayStats?.revenue || 0,
    pendingOrders: pendingOrders?.count || 0,
    totalRevenue: totalRevenue?.total || 0
  });
});

export default router;
