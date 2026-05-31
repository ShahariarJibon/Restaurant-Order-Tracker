import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getSelectedCurrency, fetchRates, formatPrice } from '../utils/currency';
import {
  DollarSign, ShoppingCart, TrendingUp, Star, Clock, ArrowLeft
} from '../components/Icons';

const RANGES = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: 'custom', label: 'Custom' },
];

function formatHour(h) {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12} ${ampm}`;
}

function LineChart({ data }) {
  if (!data || data.length < 2) return null;
  const w = 320, h = 140, pad = { top: 10, right: 10, bottom: 24, left: 10 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;
  const max = Math.max(...data.map(d => d.revenue), 1);
  const points = data.map((d, i) => {
    const x = pad.left + (i / (data.length - 1)) * chartW;
    const y = pad.top + chartH - (d.revenue / max) * chartH;
    return `${x},${y}`;
  });
  const line = points.join(' ');
  const area = `${pad.left},${pad.top + chartH} ${line} ${pad.left + chartW},${pad.top + chartH}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF8C42" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#FF8C42" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#areaGrad)" />
      <polyline points={line} fill="none" stroke="#FF8C42" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => {
        const x = pad.left + (i / (data.length - 1)) * chartW;
        const y = pad.top + chartH - (d.revenue / max) * chartH;
        if (i === data.length - 1 || i === 0) {
          return <circle key={i} cx={x} cy={y} r="3.5" fill="#FF8C42" stroke="white" strokeWidth="2" />;
        }
        return null;
      })}
      <text x={pad.left} y={pad.top + chartH + 16} fontSize="10" fill="#999">{data[0]?.date?.slice(5) || ''}</text>
      <text x={pad.left + chartW} y={pad.top + chartH + 16} fontSize="10" fill="#999" textAnchor="end">{data[data.length - 1]?.date?.slice(5) || ''}</text>
    </svg>
  );
}

function DetailedReport({ report, onBack, rates, currency }) {
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    axios.get(`/api/orders/admin`).then(res => {
      const dayOrders = res.data.filter(o => {
        const d = new Date(o.created_at + 'Z').toISOString().split('T')[0];
        return d === report.date && o.status !== 'cancelled';
      });
      setOrders(dayOrders);
    }).catch(() => {});
  }, [report.date]);

  const hourCounts = {};
  for (const o of orders) {
    const h = new Date(o.created_at + 'Z').getHours();
    hourCounts[h] = (hourCounts[h] || 0) + 1;
  }
  let peakH = null, peakMax = 0;
  for (const [h, c] of Object.entries(hourCounts)) { if (c > peakMax) { peakMax = c; peakH = Number(h); } }

  const avgValue = orders.length > 0 ? report.revenue / orders.length : 0;

  return (
    <div>
      <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gray-500)', fontSize: 14, marginBottom: 16, fontFamily: 'inherit' }}>
        <ArrowLeft size={18} /> Back to Reports
      </button>
      <h3 style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>{report.date}</h3>
      <p style={{ fontSize: 13, color: 'var(--gray-400)', marginBottom: 20 }}>Top item: {report.topItem}</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 4 }}>Total Sales</div>
          <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--orange)' }}>{rates ? formatPrice(report.revenue, currency, rates) : `$${report.revenue.toFixed(2)}`}</div>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 4 }}>Total Orders</div>
          <div style={{ fontWeight: 800, fontSize: 20 }}>{report.orderCount}</div>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 4 }}>Avg Order Value</div>
          <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--orange)' }}>{rates ? formatPrice(avgValue, currency, rates) : `$${avgValue.toFixed(2)}`}</div>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 4 }}>Peak Hour</div>
          <div style={{ fontWeight: 800, fontSize: 20 }}>{peakH !== null ? formatHour(peakH) : '—'}</div>
        </div>
      </div>

      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Orders</div>
      {orders.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--gray-400)' }}>No orders for this day.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {orders.map(o => (
            <div key={o.id} className="card" style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>#{o.id.slice(0, 6).toUpperCase()}</div>
                <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{o.customer_name || 'Guest'} • {new Date(o.created_at + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <div style={{ fontWeight: 700, color: 'var(--orange)' }}>{rates ? formatPrice(Number(o.total), currency, rates) : `$${Number(o.total).toFixed(2)}`}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminAnalytics() {
  const { restaurant } = useAuth();
  const [range, setRange] = useState('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [data, setData] = useState(null);
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailDate, setDetailDate] = useState(null);
  const currency = getSelectedCurrency();

  useEffect(() => { fetchRates().then(setRates); }, []);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        let params = `range=${range}`;
        if (range === 'custom' && customFrom && customTo) {
          params += `&from=${customFrom}&to=${customTo}`;
        }
        const res = await axios.get(`/api/analytics/data?${params}`);
        setData(res.data);
      } catch {} finally {
        setLoading(false);
      }
    };
    fetch();
  }, [range, customFrom, customTo]);

  if (range === 'custom' && !customFrom) {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    if (!customFrom) setCustomFrom(weekAgo);
    if (!customTo) setCustomTo(today);
  }

  if (detailDate && data) {
    const report = data.dailyReports.find(r => r.date === detailDate);
    if (report) {
      return (
        <div className="tab-content">
          <DetailedReport report={report} onBack={() => setDetailDate(null)} rates={rates} currency={currency} />
        </div>
      );
    }
  }

  const KPI_CARDS = [
    { label: 'Total Revenue', value: data ? (rates ? formatPrice(data.totalRevenue, currency, rates) : `$${data.totalRevenue.toFixed(2)}`) : '—', sub: `${data?.totalOrders || 0} orders`, color: '#FF8C42', Icon: DollarSign },
    { label: 'Total Orders', value: data?.totalOrders || 0, sub: `${data?.itemsSold || 0} items sold`, color: '#6366F1', Icon: ShoppingCart },
    { label: 'Items Sold', value: data?.itemsSold || 0, sub: `Avg $${data?.avgOrderValue?.toFixed(2) || '0.00'} per order`, color: '#F59E0B', Icon: Star },
    { label: 'Growth', value: data ? `${data.growth > 0 ? '+' : ''}${data.growth}%` : '—', sub: data?.growth > 0 ? 'vs previous period' : data?.growth < 0 ? 'vs previous period' : 'No change', color: data?.growth >= 0 ? '#10B981' : '#EF4444', Icon: TrendingUp },
  ];

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2>Analytics</h2>
      </div>

      {/* Range filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto' }}>
        {RANGES.map(r => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={`btn btn-sm ${range === r.key ? 'btn-primary' : 'btn-outline'}`}
            style={range === r.key ? { background: 'var(--orange)', borderColor: 'var(--orange)' } : {}}
          >
            {r.label}
          </button>
        ))}
      </div>
      {range === 'custom' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--gray-200)', fontFamily: 'inherit', fontSize: 13 }} />
          <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--gray-200)', fontFamily: 'inherit', fontSize: 13 }} />
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--gray-400)', textAlign: 'center', padding: 40 }}>Loading analytics...</p>
      ) : data ? (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            {KPI_CARDS.map(card => {
              const CardIcon = card.Icon;
              return (
                <div key={card.label} className="card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${card.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CardIcon size={18} color={card.color} />
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)', fontWeight: 500 }}>{card.label}</div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 22, color: card.color, lineHeight: 1.2 }}>{card.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>{card.sub}</div>
                </div>
              );
            })}
          </div>

          {/* Revenue Trend Chart */}
          <div className="card" style={{ padding: '16px', marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Revenue Trend</div>
            {data.revenueTrend.length < 2 ? (
              <p style={{ fontSize: 13, color: 'var(--gray-400)', textAlign: 'center', padding: 20 }}>Not enough data for chart</p>
            ) : (
              <LineChart data={data.revenueTrend} />
            )}
          </div>

          {/* Best Sellers */}
          <div className="card" style={{ padding: '16px', marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Best Sellers</div>
            {data.bestSellers.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--gray-400)' }}>No data yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.bestSellers.map((item, i) => (
                  <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: i === 0 ? '#FFC107' : i === 1 ? '#E0E0E0' : i === 2 ? '#FFCC80' : '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: i < 3 ? '#333' : '#999', flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{item.sold} sold</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--orange)' }}>{rates ? formatPrice(item.revenue, currency, rates) : `$${item.revenue.toFixed(2)}`}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Smart Insights */}
          {data.insights.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Insights</div>
              {data.insights.map((ins, i) => (
                <div key={i} className="card" style={{
                  padding: '14px 16px', marginBottom: 8,
                  borderLeft: `4px solid ${ins.type === 'positive' ? '#10B981' : ins.type === 'negative' ? '#EF4444' : '#FFC107'}`,
                }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{ins.text}</div>
                </div>
              ))}
            </div>
          )}

          {/* Daily Reports */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Daily Reports</div>
            {data.dailyReports.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--gray-400)' }}>No reports yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.dailyReports.map(r => (
                  <button
                    key={r.date}
                    onClick={() => setDetailDate(r.date)}
                    className="card"
                    style={{
                      padding: '14px 16px', cursor: 'pointer', border: '1px solid var(--gray-100)',
                      textAlign: 'left', fontFamily: 'inherit', width: '100%',
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FFF3E0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Clock size={18} color="#FF8C42" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{r.date}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{r.orderCount} orders • Top: {r.topItem}</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--orange)' }}>{rates ? formatPrice(r.revenue, currency, rates) : `$${r.revenue.toFixed(2)}`}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <p style={{ color: 'var(--gray-400)', textAlign: 'center', padding: 40 }}>No data available</p>
      )}
    </div>
  );
}
