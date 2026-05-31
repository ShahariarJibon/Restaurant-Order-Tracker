import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import ExcelJS from 'exceljs';
import { queryAll, queryOne, execute } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

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

router.get('/export/excel', authMiddleware, async (req, res) => {
  const orders = await queryAll(
    `SELECT o.*, t.table_number FROM orders o
     LEFT JOIN tables_tbl t ON o.table_id = t.id
     WHERE o.restaurant_id = ? ORDER BY o.created_at ASC`,
    [req.restaurant.id]
  );
  for (const order of orders) {
    order.items = await queryAll('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = 'OrderTracker';
  const ws = wb.addWorksheet('Order History');

  ws.columns = [
    { header: 'Date & Time', key: 'datetime', width: 22 },
    { header: 'Order Items', key: 'items', width: 40 },
    { header: 'Price', key: 'price', width: 12 },
    { header: 'Customer', key: 'customer', width: 18 },
    { header: 'Order ID', key: 'orderId', width: 14 },
    { header: 'Table', key: 'table', width: 10 },
  ];

  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8C42' } };
  headerRow.alignment = { horizontal: 'center' };

  let rowIdx = 2;
  const grouped = {};
  for (const order of orders) {
    const dateKey = new Date(order.created_at + 'Z').toLocaleDateString('en-CA');
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(order);
  }

  const dateKeys = Object.keys(grouped).sort();
  for (let di = 0; di < dateKeys.length; di++) {
    const dateKey = dateKeys[di];
    const dayOrders = grouped[dateKey];

    ws.getCell(`A${rowIdx}`).value = dateKey;
    ws.getCell(`A${rowIdx}`).font = { bold: true, size: 13, color: { argb: 'FF8C42' } };
    ws.getCell(`A${rowIdx}`).alignment = { vertical: 'middle' };
    ws.mergeCells(`A${rowIdx}:F${rowIdx}`);
    ws.getRow(rowIdx).height = 28;
    rowIdx++;

    for (const order of dayOrders) {
      const dt = new Date(order.created_at + 'Z').toLocaleString('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: true,
        month: 'short', day: 'numeric'
      });
      const itemsStr = order.items.map(i => `${i.item_name} ×${i.quantity}`).join(', ');
      const shortId = `#${order.id.slice(0, 6).toUpperCase()}`;

      ws.getCell(`A${rowIdx}`).value = dt;
      ws.getCell(`B${rowIdx}`).value = itemsStr;
      ws.getCell(`C${rowIdx}`).value = Number(order.total).toFixed(2);
      ws.getCell(`D${rowIdx}`).value = order.customer_name || 'Guest';
      ws.getCell(`E${rowIdx}`).value = shortId;
      ws.getCell(`F${rowIdx}`).value = order.table_number || '—';
      ws.getRow(rowIdx).height = 22;
      rowIdx++;
    }

    const dayTotalOrders = dayOrders.length;
    const dayRevenue = dayOrders.reduce((sum, o) => sum + Number(o.total), 0);

    ws.getCell(`A${rowIdx}`).value = `Day Summary`;
    ws.getCell(`B${rowIdx}`).value = `Total Orders: ${dayTotalOrders}`;
    ws.getCell(`C${rowIdx}`).value = dayRevenue.toFixed(2);
    ws.getRow(rowIdx).font = { bold: true, italic: true, color: { argb: 'FF8C42' } };
    ws.getRow(rowIdx).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E0' } };
    rowIdx++;

    if (di < dateKeys.length - 1) {
      ws.getRow(rowIdx).height = 8;
      rowIdx++;
    }
  }

  ws.getRow(rowIdx).height = 8;
  rowIdx += 2;

  const grandTotalOrders = orders.length;
  const grandRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
  ws.getCell(`A${rowIdx}`).value = 'GRAND TOTAL';
  ws.getCell(`B${rowIdx}`).value = `Total Orders: ${grandTotalOrders}`;
  ws.getCell(`C${rowIdx}`).value = grandRevenue.toFixed(2);
  ws.getRow(rowIdx).font = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } };
  ws.getRow(rowIdx).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8C42' } };
  ws.getRow(rowIdx).height = 30;

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=order-history-${new Date().toISOString().split('T')[0]}.xlsx`);
  await wb.xlsx.write(res);
  res.end();
});

router.get('/stats/dashboard', authMiddleware, async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const totalOrders = await queryOne('SELECT COUNT(*) as count FROM orders WHERE restaurant_id = ?', [req.restaurant.id]);
  const todayStats = await queryOne(
    "SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as revenue FROM orders WHERE restaurant_id = ? AND DATE(created_at) = ?",
    [req.restaurant.id, today]
  );
  const pendingOrders = await queryOne("SELECT COUNT(*) as count FROM orders WHERE restaurant_id = ? AND status = 'pending'", [req.restaurant.id]);
  const totalRevenue = await queryOne('SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE restaurant_id = ?', [req.restaurant.id]);
  const avgRating = await queryOne('SELECT AVG(rating) as average FROM ratings WHERE restaurant_id = ?', [req.restaurant.id]);
  const doneRevenue = await queryOne("SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE restaurant_id = ? AND status = 'done'", [req.restaurant.id]);
  res.json({
    totalOrders: toNumber(totalOrders?.count),
    todayOrders: toNumber(todayStats?.count),
    todayRevenue: toNumber(todayStats?.revenue),
    pendingOrders: toNumber(pendingOrders?.count),
    totalRevenue: toNumber(totalRevenue?.total),
    doneRevenue: toNumber(doneRevenue?.total),
    averageRating: toNumber(avgRating?.average)
  });
});

export default router;
