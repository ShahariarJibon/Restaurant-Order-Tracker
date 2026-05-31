import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getSelectedCurrency, fetchRates, formatPrice } from '../utils/currency';
import { DollarSign, ClipboardList, Hourglass, Star } from '../components/Icons';

const CARD_STYLES = [
  { color: '#FF8C42', Icon: DollarSign, label: "Today's Revenue", key: 'todayRevenue', format: 'price' },
  { color: '#6366F1', Icon: ClipboardList, label: 'Total Orders', key: 'totalOrders', format: 'number' },
  { color: '#F59E0B', Icon: Hourglass, label: 'Pending Orders', key: 'pendingOrders', format: 'number' },
  { color: '#10B981', Icon: Star, label: 'Average Rating', key: 'averageRating', format: 'rating' },
];

export default function AdminHome({ onGoToSettings }) {
  const [stats, setStats] = useState(null);
  const [rates, setRates] = useState(null);
  const { restaurant } = useAuth();
  const currency = getSelectedCurrency();
  const logo = restaurant?.logo || localStorage.getItem('restaurant_logo') || '';

  useEffect(() => { fetchRates().then(setRates); }, []);

  useEffect(() => {
    const fetchStats = () => axios.get('/api/orders/stats/dashboard').then(r => setStats(r.data));
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const getValue = (card) => {
    if (!stats) return 0;
    const raw = stats[card.key] ?? 0;
    if (card.format === 'price') {
      return rates ? formatPrice(raw, currency, rates) : `$${Number(raw).toFixed(2)}`;
    }
    if (card.format === 'rating') {
      return Number(raw) > 0 ? `${Number(raw).toFixed(1)} ★` : '0 ★';
    }
    return raw;
  };

  return (
    <div className="tab-content" style={{ padding: '20px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <button
          onClick={onGoToSettings}
          style={{
            width: 52, height: 52, borderRadius: '50%', border: '3px solid var(--orange)',
            background: 'var(--orange-light)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 24, fontWeight: 700, color: 'var(--orange)',
            cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit', overflow: 'hidden', padding: 0,
            boxShadow: '0 2px 12px rgba(255,140,66,0.25)'
          }}
        >
          {logo ? <img src={logo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (restaurant?.name?.[0]?.toUpperCase() || 'R')}
        </button>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2 }}>Welcome back, {restaurant?.name?.split(' ')[0] || 'there'}</h2>
          <p style={{ fontSize: 14, color: 'var(--gray-500)', marginTop: 2 }}>Here's your daily overview</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {CARD_STYLES.map(card => {
          const CardIcon = card.Icon;
          return (
            <div
              key={card.key}
              style={{
                background: 'var(--white)',
                borderRadius: 16,
                padding: '24px 28px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                border: '1px solid var(--gray-100)',
              }}
            >
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: `${card.color}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <CardIcon size={28} color={card.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: card.color, marginBottom: 6 }}>
                  {card.label}
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--gray-900)', lineHeight: 1.2 }}>
                  {getValue(card)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
