import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Bot, TrendingUp, Clock, AlertTriangle, DollarSign, ShoppingCart,
  BarChart3, Shield, ChefHat, Sparkles,
  RefreshCw, ThumbsUp, ThumbsDown, Hourglass
} from '../components/Icons';

export default function AdminAI() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
    const interval = setInterval(fetchInsights, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchInsights = async () => {
    try {
      const res = await axios.get('/api/ai/insights');
      setData(res.data);
    } catch (e) {
      console.error('AI insights error:', e);
    } finally {
      setLoading(false);
    }
  };

  const s = (v, d = '—') => v ?? d;

  if (loading) {
    return (
      <div style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--orange)' }} />
      </div>
    );
  }

  const d = data || {};

  const card = { background: 'var(--card-bg, white)', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 };
  const label = { fontSize: 11, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em' };
  const value = { fontSize: 22, fontWeight: 700, color: 'var(--text, #1F2937)' };
  const chip = (bg, fg) => ({ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: bg, color: fg });

  const AlertsBanner = ({ alerts }) => {
    if (!alerts || alerts.length === 0) return null;
    return (
      <div style={{ background: 'linear-gradient(135deg, #FEF2F2, #FFE4E6)', border: '1px solid #FECACA', borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <AlertTriangle size={18} color="#DC2626" />
          <span style={{ fontWeight: 700, color: '#991B1B', fontSize: 15 }}>Crisis Alerts</span>
        </div>
        {alerts.map((a, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', color: a.severity === 'critical' ? '#DC2626' : '#92400E', fontSize: 13 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: a.severity === 'critical' ? '#DC2626' : a.severity === 'warning' ? '#F59E0B' : '#3B82F6', flexShrink: 0 }} />
            {a.message}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Bot size={22} color="var(--orange)" />
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>AI Insights</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--gray-400)' }}>
          <RefreshCw size={12} /> Updates every 15s
        </div>
      </div>

      <AlertsBanner alerts={d.crisisDetection?.alerts} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>

        {/* ─── BUSINESS HEALTH ───── */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <BarChart3 size={16} color="var(--orange)" />
            <span style={label}>Business Health</span>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { label: 'Orders', val: `${d.healthSnapshot?.todayOrders ?? '—'}`, sub: `yesterday ${d.healthSnapshot?.yesterdayOrders ?? 0}` },
              { label: 'Revenue', val: `৳${d.healthSnapshot?.todayRevenue ?? 0}`, sub: d.healthSnapshot?.revenueTrend === 'up' ? '↑ Increasing' : d.healthSnapshot?.revenueTrend === 'down' ? '↓ Decreasing' : '→ Stable' },
              { label: 'Flow', val: d.healthSnapshot?.customerFlow ?? '—' },
              { label: 'Kitchen', val: d.healthSnapshot?.kitchenPerformance ?? '—' },
              { label: 'Payments', val: d.healthSnapshot?.paymentStatus ?? '—' },
            ].map((item, i) => (
              <div key={i} style={{ flex: '1 0 80px' }}>
                <div style={{ fontSize: 10, color: 'var(--gray-400)', fontWeight: 600 }}>{item.label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1F2937' }}>{item.val}</div>
                {item.sub && <div style={{ fontSize: 10, color: 'var(--gray-400)' }}>{item.sub}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* ─── RUSH HOUR ───── */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Clock size={16} color="var(--orange)" />
            <span style={label}>Rush Hour Predictor</span>
          </div>
          {d.rushHours?.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {d.rushHours.slice(0, 8).map((r, i) => (
                <span key={i} style={{
                  ...chip(
                    r.count > 10 ? '#FEF3C7' : '#F3F4F6',
                    r.count > 10 ? '#92400E' : '#6B7280'
                  ),
                  fontSize: 12, padding: '4px 10px'
                }}>
                  {String(r.hour).padStart(2, '0')}:00 ({r.count})
                </span>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>Not enough data yet</div>
          )}
        </div>

        {/* ─── ORDER PRIORITY ───── */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Hourglass size={16} color="var(--orange)" />
            <span style={label}>Order Priority</span>
          </div>
          {d.orderPriority?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {d.orderPriority.slice(0, 5).map((o, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #F3F4F6', fontSize: 12 }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ color: o.waitMinutes > 15 ? '#DC2626' : o.waitMinutes > 5 ? '#D97706' : '#6B7280', fontWeight: 700 }}>
                      #{o.id?.slice(-4)}
                    </span>
                    <span style={{ color: 'var(--gray-500)' }}>T{o.table}</span>
                  </div>
                  <span style={{ fontWeight: 600, color: o.waitMinutes > 15 ? '#DC2626' : '#6B7280' }}>
                    {Math.round(o.waitMinutes || 0)}min
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>No pending orders</div>
          )}
        </div>

        {/* ─── DAILY PROFIT ───── */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <DollarSign size={16} color="var(--orange)" />
            <span style={label}>Daily Profit Estimator</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={value}>৳{d.dailyProfit?.estimatedProfit?.toLocaleString() ?? 0}</div>
            <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
              Revenue: ৳{d.dailyProfit?.revenue?.toLocaleString() ?? 0} &middot; Cost: ৳{d.dailyProfit?.estimatedCost?.toLocaleString() ?? 0}
            </div>
            <div style={{ fontSize: 12, color: d.dailyProfit?.unpaidPct > 0 ? '#D97706' : '#059669' }}>
              {d.dailyProfit?.unpaidPct > 0 ? `⚠ ${d.dailyProfit.unpaidPct}% orders unpaid` : '✅ All payments settled'}
            </div>
          </div>
        </div>

        {/* ─── MENU PERFORMANCE ───── */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <BarChart3 size={16} color="var(--orange)" />
            <span style={label}>Menu Performance</span>
          </div>
          {d.menuPerformance?.bestSellers?.length > 0 ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <ThumbsUp size={12} color="#059669" />
                <span style={{ fontSize: 11, fontWeight: 600, color: '#059669' }}>TOP SELLERS</span>
              </div>
              {d.menuPerformance.bestSellers.slice(0, 3).map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '2px 0' }}>
                  <span>{item.item_name}</span>
                  <span style={{ fontWeight: 600 }}>×{item.sold}</span>
                </div>
              ))}
              {d.menuPerformance?.worstSellers?.length > 0 && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, marginBottom: 4 }}>
                    <ThumbsDown size={12} color="#DC2626" />
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#DC2626' }}>LOWEST SELLERS</span>
                  </div>
                  {d.menuPerformance.worstSellers.slice(0, 2).map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '2px 0' }}>
                      <span>{item.item_name}</span>
                      <span style={{ fontWeight: 600 }}>×{item.sold}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>Not enough data</div>
          )}
        </div>

        {/* ─── INVENTORY RUNAOUT ───── */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <ShoppingCart size={16} color="var(--orange)" />
            <span style={label}>Inventory Runout Predictor</span>
          </div>
          {d.inventoryRunout?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {d.inventoryRunout.filter(i => i.daysRemaining !== null).sort((a, b) => (a.daysRemaining || 999) - (b.daysRemaining || 999)).slice(0, 5).map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, padding: '4px 0', borderBottom: '1px solid #F3F4F6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: item.daysRemaining < 3 ? '#DC2626' : item.daysRemaining < 7 ? '#D97706' : '#059669', flexShrink: 0 }} />
                    <span>{item.name}</span>
                  </div>
                  <span style={{ fontWeight: 600, color: item.daysRemaining < 3 ? '#DC2626' : 'inherit' }}>
                    {item.daysRemaining}d
                  </span>
                </div>
              ))}
              {d.inventoryRunout.filter(i => i.daysRemaining === null).length > 0 && (
                <div style={{ fontSize: 10, color: 'var(--gray-400)', marginTop: 4 }}>
                  {d.inventoryRunout.filter(i => i.daysRemaining === null).length} item(s) need more data
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>No inventory items</div>
          )}
        </div>

        {/* ─── WASTE DETECTION ───── */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <TrashIcon size={16} color="var(--orange)" />
            <span style={label}>Waste Detector</span>
          </div>
          {d.wasteDetection?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {d.wasteDetection.slice(0, 5).map((item, i) => (
                <div key={i} style={{ fontSize: 12, padding: '4px 0', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{item.name}</span>
                    <span style={{ color: 'var(--gray-400)', marginLeft: 4 }}>({item.quantity}{item.unit})</span>
                  </div>
                  <span style={chip(
                    item.wasteRisk === 'high' ? '#FEE2E2' : '#FEF3C7',
                    item.wasteRisk === 'high' ? '#991B1B' : '#92400E'
                  )}>
                    {item.wasteRisk === 'high' ? 'High risk' : 'Medium'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>No waste concerns</div>
          )}
        </div>

        {/* ─── FRAUD DETECTION ───── */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Shield size={16} color="var(--orange)" />
            <span style={label}>Fraud Detector</span>
          </div>
          {d.fraudDetection?.duplicateTrx?.length > 0 || d.fraudDetection?.amountMismatch?.length > 0 ? (
            <div>
              {d.fraudDetection.duplicateTrx?.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#DC2626', marginBottom: 4 }}>
                    ⚠ {d.fraudDetection.duplicateTrx.length} duplicate TRX
                  </div>
                  {d.fraudDetection.duplicateTrx.slice(0, 3).map((item, i) => (
                    <div key={i} style={{ fontSize: 11, padding: '2px 0', color: 'var(--gray-500)' }}>
                      {item.trx_id} (×{item.count})
                    </div>
                  ))}
                </div>
              )}
              {d.fraudDetection.amountMismatch?.length > 0 && (
                <div style={{ fontSize: 11, fontWeight: 600, color: '#DC2626' }}>
                  ⚠ {d.fraudDetection.amountMismatch.length} amount mismatch(es)
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>
              <Shield size={14} style={{ marginRight: 4, verticalAlign: 'middle', color: '#059669' }} />
              No issues detected
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function TrashIcon({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}
