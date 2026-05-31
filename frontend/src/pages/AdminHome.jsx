import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getSelectedCurrency, fetchRates, formatPrice } from '../utils/currency';

export default function AdminHome({ onGoToSettings }) {
  const [stats, setStats] = useState(null);
  const [rates, setRates] = useState(null);
  const { restaurant } = useAuth();
  const currency = getSelectedCurrency();
  const logo = restaurant?.logo || localStorage.getItem('restaurant_logo') || '';

  useEffect(() => { fetchRates().then(setRates); }, []);

  useEffect(() => {
    axios.get('/api/orders/stats/dashboard').then(r => setStats(r.data));
  }, []);

  const avgRating = stats?.averageRating || 0;

  return (
    <div className="tab-content">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <button
          onClick={onGoToSettings}
          style={{
            width: 48, height: 48, borderRadius: '50%', border: '2px solid var(--orange)',
            background: 'var(--orange-light)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 22, fontWeight: 700, color: 'var(--orange)',
            cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit', overflow: 'hidden', padding: 0
          }}
        >
          {logo ? <img src={logo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (restaurant?.name?.[0]?.toUpperCase() || 'R')}
        </button>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2 }}>Hi, {restaurant?.name?.split(' ')[0] || 'there'} 👋</h2>
          <p style={{ fontSize: 14, color: 'var(--gray-500)', marginTop: 2 }}>Here's your daily overview</p>
        </div>
      </div>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="stat-card" style={{ margin: 0 }}>
            <div className="stat-icon">💰</div>
            <h3>Today's Revenue</h3>
            <div className="stat-value orange">{rates ? formatPrice(stats.todayRevenue, currency, rates) : `$${stats.todayRevenue?.toFixed(2)}`}</div>
          </div>
          <div className="stat-card" style={{ margin: 0 }}>
            <div className="stat-icon">📊</div>
            <h3>Total Orders</h3>
            <div className="stat-value" style={{ color: 'var(--gray-900)' }}>{stats.totalOrders}</div>
          </div>
          <div className="stat-card" style={{ margin: 0 }}>
            <div className="stat-icon">⏳</div>
            <h3>Pending</h3>
            <div className="stat-value yellow">{stats.pendingOrders}</div>
          </div>
          <div className="stat-card" style={{ margin: 0 }}>
            <div className="stat-icon">⭐</div>
            <h3>Avg Rating</h3>
            <div className="stat-value orange">
              {avgRating > 0 ? `${avgRating.toFixed(1)} ★` : '—'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
