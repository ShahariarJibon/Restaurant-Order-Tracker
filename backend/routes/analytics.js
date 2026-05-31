import { Router } from 'express';
import { queryAll, queryOne } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/data', authMiddleware, async (req, res) => {
  const { range, from, to } = req.query;
  const restaurantId = req.restaurant.id;

  const now = new Date();
  let startDate, prevStartDate, endDate;

  if (range === '7d') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    prevStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    endDate = now;
  } else if (range === '30d') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    prevStartDate = new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    endDate = now;
  } else if (range === 'custom' && from && to) {
    startDate = new Date(from);
    const span = new Date(to).getTime() - startDate.getTime();
    prevStartDate = new Date(startDate.getTime() - span);
    endDate = new Date(to);
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    prevStartDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
    endDate = now;
  }

  const allOrders = await queryAll(
    `SELECT o.* FROM orders o WHERE o.restaurant_id = ? AND o.status != 'cancelled' ORDER BY o.created_at ASC`,
    [restaurantId]
  );

  function inRange(d, s, e) {
    const t = new Date(d).getTime();
    return t >= s.getTime() && t <= e.getTime();
  }

  const currentOrders = allOrders.filter(o => inRange(o.created_at, startDate, endDate));
  const prevOrders = allOrders.filter(o => inRange(o.created_at, prevStartDate, startDate));

  const totalRevenue = currentOrders.reduce((s, o) => s + Number(o.total), 0);
  const totalOrders = currentOrders.length;
  const prevRevenue = prevOrders.reduce((s, o) => s + Number(o.total), 0);
  const growth = prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : totalRevenue > 0 ? 100 : 0;

  let itemsSold = 0;
  const itemCounts = {};
  for (const order of currentOrders) {
    const items = await queryAll('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    for (const item of items) {
      itemsSold += item.quantity;
      const key = item.item_name;
      if (!itemCounts[key]) itemCounts[key] = { sold: 0, revenue: 0 };
      itemCounts[key].sold += item.quantity;
      itemCounts[key].revenue += item.price * item.quantity;
    }
  }

  const bestSellers = Object.entries(itemCounts)
    .map(([name, data]) => ({ name, sold: data.sold, revenue: data.revenue }))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 10);

  // Revenue trend (daily)
  const dailyMap = {};
  for (const order of currentOrders) {
    const dateKey = new Date(order.created_at + 'Z').toISOString().split('T')[0];
    if (!dailyMap[dateKey]) dailyMap[dateKey] = 0;
    dailyMap[dateKey] += Number(order.total);
  }
  const revenueTrend = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, revenue]) => ({ date, revenue }));

  // Daily reports
  const dayData = {};
  for (const order of currentOrders) {
    const dateKey = new Date(order.created_at + 'Z').toISOString().split('T')[0];
    if (!dayData[dateKey]) dayData[dateKey] = { orders: [], revenue: 0 };
    dayData[dateKey].orders.push(order);
    dayData[dateKey].revenue += Number(order.total);
  }
  for (const key of Object.keys(dayData)) {
    const items = await Promise.all(
      dayData[key].orders.map(o => queryAll('SELECT * FROM order_items WHERE order_id = ?', [o.id]))
    );
    const flat = items.flat();
    const topMap = {};
    for (const i of flat) {
      topMap[i.item_name] = (topMap[i.item_name] || 0) + i.quantity;
    }
    dayData[key].topItem = Object.entries(topMap).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
  }
  const dailyReports = Object.entries(dayData)
    .map(([date, d]) => ({ date, orderCount: d.orders.length, revenue: d.revenue, topItem: d.topItem }))
    .sort((a, b) => b.date.localeCompare(a.date));

  // Peak hour
  const hourCounts = {};
  for (const order of currentOrders) {
    const h = new Date(order.created_at + 'Z').getHours();
    hourCounts[h] = (hourCounts[h] || 0) + 1;
  }
  let peakHour = null;
  let maxCount = 0;
  for (const [h, c] of Object.entries(hourCounts)) {
    if (c > maxCount) { maxCount = c; peakHour = Number(h); }
  }

  const avgOrderValue = totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0;

  // Insights
  const insights = [];
  if (growth > 0) insights.push({ type: 'positive', text: `Sales increased ${growth}% compared to previous period` });
  else if (growth < 0) insights.push({ type: 'negative', text: `Sales dropped ${Math.abs(growth)}% compared to previous period` });
  if (bestSellers.length > 0) insights.push({ type: 'info', text: `${bestSellers[0].name} is your top item (${bestSellers[0].sold} sold)` });
  if (peakHour !== null) {
    const ampm = peakHour >= 12 ? 'PM' : 'AM';
    const h12 = peakHour % 12 || 12;
    insights.push({ type: 'info', text: `Most orders come at ${h12} ${ampm}` });
  }
  if (insights.length === 0) insights.push({ type: 'info', text: 'Not enough data for insights yet. Keep taking orders!' });

  // Previous period best seller
  const prevCounts = {};
  for (const order of prevOrders) {
    const items = await queryAll('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    for (const item of items) prevCounts[item.item_name] = (prevCounts[item.item_name] || 0) + item.quantity;
  }
  const prevBestSeller = Object.entries(prevCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  res.json({
    totalRevenue, totalOrders, itemsSold, growth,
    revenueTrend, bestSellers, dailyReports, avgOrderValue, peakHour, insights, prevBestSeller,
  });
});

export default router;
