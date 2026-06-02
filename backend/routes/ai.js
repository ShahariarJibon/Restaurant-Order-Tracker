import { Router } from 'express';
import { queryAll, queryOne, isUsingPg } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

router.get('/insights', authMiddleware, async (req, res) => {
  const isPG = isUsingPg();
  const rid = req.restaurant.id;
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const datePart = isPG ? 'created_at::DATE' : 'DATE(created_at)';
  const hoursAgo = (col, ago) => isPG
    ? `${col} < NOW() - INTERVAL '${ago} minutes'`
    : `${col} < datetime('now', '-${ago} minutes')`;
  const daysAgo = (col, days) => isPG
    ? `${col} >= NOW() - INTERVAL '${days} days'`
    : `${col} >= datetime('now', '-${days} days')`;
  const extractHour = isPG
    ? "EXTRACT(HOUR FROM created_at)::INTEGER"
    : "CAST(strftime('%H', created_at) AS INTEGER)";
  const waitMin = isPG
    ? "EXTRACT(EPOCH FROM (NOW() - o.created_at)) / 60"
    : "(julianday('now') - julianday(o.created_at)) * 1440";
  const groupConcat = (col) => isPG ? `string_agg(${col}, ',')` : `GROUP_CONCAT(${col})`;

  // ─── RUSH HOUR ──────────────────────────────────────
  const ordersByHour = await queryAll(
    `SELECT ${extractHour} as hour, COUNT(*) as count
     FROM orders WHERE restaurant_id = ? AND ${daysAgo('created_at', 14)}
     GROUP BY hour ORDER BY count DESC`,
    [rid]
  );

  // ─── MENU PERFORMANCE ───────────────────────────────
  const bestSellers = await queryAll(
    `SELECT oi.item_name, SUM(oi.quantity) as sold, SUM(oi.quantity * oi.price) as revenue
     FROM order_items oi JOIN orders o ON oi.order_id = o.id
     WHERE o.restaurant_id = ? AND o.status NOT IN ('cancelled','payment_failed')
     GROUP BY oi.item_name ORDER BY sold DESC LIMIT 10`,
    [rid]
  );

  const worstSellers = await queryAll(
    `SELECT oi.item_name, SUM(oi.quantity) as sold, SUM(oi.quantity * oi.price) as revenue
     FROM order_items oi JOIN orders o ON oi.order_id = o.id
     WHERE o.restaurant_id = ? AND o.status NOT IN ('cancelled','payment_failed')
     GROUP BY oi.item_name ORDER BY sold ASC LIMIT 5`,
    [rid]
  );

  // ─── INVENTORY ──────────────────────────────────────
  const inventory = await queryAll(
    'SELECT * FROM inventory_items WHERE restaurant_id = ? ORDER BY name',
    [rid]
  );

  const allOrderItems = await queryAll(
    `SELECT oi.item_name, SUM(oi.quantity) as total_qty
     FROM order_items oi JOIN orders o ON oi.order_id = o.id
     WHERE o.restaurant_id = ? AND ${daysAgo('o.created_at', 14)}
     GROUP BY oi.item_name`,
    [rid]
  );

  const inventoryRunout = inventory.map(item => {
    const matched = allOrderItems.find(oi =>
      oi.item_name.toLowerCase().includes(item.name.toLowerCase()) ||
      item.name.toLowerCase().includes(oi.item_name.toLowerCase())
    );
    const dailyUsage = matched ? (toNumber(matched.total_qty) / 14) : 0;
    const daysRemaining = dailyUsage > 0 ? Math.round(toNumber(item.quantity) / dailyUsage * 10) / 10 : null;
    return {
      id: item.id, name: item.name, quantity: toNumber(item.quantity), unit: item.unit,
      dailyUsage: Math.round(dailyUsage * 10) / 10, daysRemaining, status: item.status,
    };
  });

  const wasteDetection = inventory
    .filter(item => toNumber(item.quantity) > 5)
    .map(item => {
      const matched = allOrderItems.find(oi =>
        oi.item_name.toLowerCase().includes(item.name.toLowerCase()) ||
        item.name.toLowerCase().includes(oi.item_name.toLowerCase())
      );
      const totalSold = matched ? toNumber(matched.total_qty) : 0;
      return {
        id: item.id, name: item.name, quantity: toNumber(item.quantity), unit: item.unit,
        totalSold14Days: totalSold,
        wasteRisk: totalSold < 2 && toNumber(item.quantity) > 5 ? 'high' : totalSold < 5 ? 'medium' : 'low',
      };
    })
    .filter(item => item.wasteRisk !== 'low');

  // ─── ORDER PRIORITY ─────────────────────────────────
  const urgentOrders = await queryAll(
    `SELECT o.id, o.table_id, o.customer_name, o.status, o.total, o.created_at,
            t.table_number, ${waitMin} as wait_minutes
     FROM orders o LEFT JOIN tables_tbl t ON o.table_id = t.id
     WHERE o.restaurant_id = ? AND o.status IN ('pending','approved','waiting_verification')
     ORDER BY o.created_at ASC`,
    [rid]
  );

  // ─── FRAUD ──────────────────────────────────────────
  const duplicateTrx = await queryAll(
    `SELECT trx_id, COUNT(*) as count, ${groupConcat('id')} as order_ids, ${groupConcat('total')} as amounts
     FROM orders WHERE restaurant_id = ? AND trx_id != '' AND trx_id IS NOT NULL
     GROUP BY trx_id HAVING count > 1`,
    [rid]
  );

  const amountMismatch = await queryAll(
    `SELECT o.id, o.trx_id, o.total, p.amount as paid_amount, p.method
     FROM payments p JOIN orders o ON o.trx_id = p.trx_id
     WHERE o.restaurant_id = ? AND o.trx_id != '' AND ABS(o.total - p.amount) > 10`,
    [rid]
  );

  // ─── HEALTH ─────────────────────────────────────────
  const todayStats = await queryOne(
    `SELECT COUNT(*) as orders, COALESCE(SUM(total),0) as revenue FROM orders WHERE restaurant_id = ? AND ${datePart} = ?`,
    [rid, today]
  );
  const yesterdayStats = await queryOne(
    `SELECT COUNT(*) as orders, COALESCE(SUM(total),0) as revenue FROM orders WHERE restaurant_id = ? AND ${datePart} = ?`,
    [rid, yesterday]
  );

  const revenueTrend = toNumber(todayStats?.revenue) > toNumber(yesterdayStats?.revenue) ? 'up' :
    toNumber(todayStats?.revenue) < toNumber(yesterdayStats?.revenue) ? 'down' : 'stable';
  const customerFlow = toNumber(todayStats?.orders) > 20 ? 'busy' :
    toNumber(todayStats?.orders) > 5 ? 'normal' : 'slow';

  const waitingOrders = await queryOne(
    "SELECT COUNT(*) as count FROM orders WHERE restaurant_id = ? AND (status = 'pending' OR status = 'approved')",
    [rid]
  );
  const kitchenPerformance = toNumber(waitingOrders?.count) > 5 ? 'delayed' :
    toNumber(waitingOrders?.count) > 2 ? 'moderate' : 'good';

  const paymentIssues = await queryOne(
    "SELECT COUNT(*) as count FROM orders WHERE restaurant_id = ? AND status = 'waiting_verification'",
    [rid]
  );
  const paymentStatus = toNumber(paymentIssues?.count) > 3 ? 'issues' :
    toNumber(paymentIssues?.count) > 0 ? 'pending' : 'smooth';

  // ─── PROFIT ─────────────────────────────────────────
  const profitData = await queryOne(
    `SELECT COUNT(*) as totalOrders, COALESCE(SUM(total),0) as totalRevenue,
            COALESCE(SUM(CASE WHEN status IN ('completed','done','delivered') THEN total ELSE 0 END),0) as completedRevenue,
            COALESCE(SUM(CASE WHEN payment_status = 'pending' OR status = 'waiting_verification' THEN total ELSE 0 END),0) as pendingAmount
     FROM orders WHERE restaurant_id = ? AND ${datePart} = ?`,
    [rid, today]
  );

  const revenue = toNumber(profitData?.totalRevenue);
  const estimatedCost = revenue * 0.6;
  const estimatedProfit = revenue - estimatedCost;
  const pendingAmount = toNumber(profitData?.pendingAmount);
  const unpaidPct = revenue > 0 ? Math.round((pendingAmount / revenue) * 100) : 0;

  // ─── CRISIS ─────────────────────────────────────────
  const pendingKitchen = await queryOne(
    "SELECT COUNT(*) as count FROM orders WHERE restaurant_id = ? AND status IN ('pending','approved')",
    [rid]
  );
  const cookingOrders = await queryOne(
    "SELECT COUNT(*) as count FROM orders WHERE restaurant_id = ? AND status IN ('preparing','cooking')",
    [rid]
  );
  const oldPending = await queryOne(
    `SELECT COUNT(*) as count FROM orders WHERE restaurant_id = ?
     AND status IN ('pending','approved') AND ${hoursAgo('created_at', 30)}`,
    [rid]
  );
  const inventoryShortage = inventory.filter(i => toNumber(i.quantity) <= 2 && i.status === 'available');

  const alerts = [];
  if (toNumber(pendingKitchen?.count) > 5) alerts.push({ severity: 'critical', message: `Kitchen backlog: ${pendingKitchen?.count} orders waiting` });
  if (toNumber(oldPending?.count) > 0) alerts.push({ severity: 'warning', message: `${oldPending?.count} order(s) waiting over 30min` });
  if (toNumber(paymentIssues?.count) > 3) alerts.push({ severity: 'warning', message: `${paymentIssues?.count} payments need verification` });
  if (inventoryShortage.length > 0) alerts.push({ severity: 'info', message: `Low stock: ${inventoryShortage.map(i => i.name).join(', ')}` });

  res.json({
    rushHours: ordersByHour.map(r => ({ hour: r.hour, count: toNumber(r.count) })),
    menuPerformance: { bestSellers, worstSellers },
    inventoryRunout,
    wasteDetection,
    orderPriority: urgentOrders.map(o => ({
      id: o.id, table: o.table_number || '—', customer: o.customer_name || 'Guest',
      status: o.status, total: toNumber(o.total),
      waitMinutes: Math.round(toNumber(o.wait_minutes)),
      created_at: o.created_at,
    })),
    fraudDetection: {
      duplicateTrx: duplicateTrx.map(d => ({
        trx_id: d.trx_id, count: toNumber(d.count),
        orderIds: (d.order_ids || '').split(','),
      })),
      amountMismatch: amountMismatch.map(m => ({
        orderId: m.id, trx_id: m.trx_id, orderTotal: toNumber(m.total),
        paidAmount: toNumber(m.paid_amount), method: m.method,
      })),
    },
    healthSnapshot: {
      revenueTrend, customerFlow, kitchenPerformance, paymentStatus,
      todayOrders: toNumber(todayStats?.orders),
      todayRevenue: toNumber(todayStats?.revenue),
      yesterdayOrders: toNumber(yesterdayStats?.orders),
      yesterdayRevenue: toNumber(yesterdayStats?.revenue),
    },
    dailyProfit: {
      totalOrders: toNumber(profitData?.totalOrders), revenue,
      estimatedCost: Math.round(estimatedCost),
      estimatedProfit: Math.round(estimatedProfit),
      pendingAmount, unpaidPct,
    },
    crisisDetection: { alerts, backlog: toNumber(pendingKitchen?.count), cooking: toNumber(cookingOrders?.count) },
  });
});

export default router;
