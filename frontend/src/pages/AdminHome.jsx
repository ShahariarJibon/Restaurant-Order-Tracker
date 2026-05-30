import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function AdminHome() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const { restaurant } = useAuth();

  useEffect(() => {
    axios.get('/api/orders/stats/dashboard').then(r => setStats(r.data));
    axios.get('/api/orders/admin').then(r => setRecentOrders(r.data.slice(0, 3)));
  }, []);

  return (
    <div className="tab-content">
      <div className="tab-header">
        <div>
          <h2>Hi, {restaurant?.name?.split(' ')[0] || 'there'} 👋</h2>
          <p>Here's your daily overview</p>
        </div>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <h3>Today's Orders</h3>
            <div className="stat-value orange">{stats.todayOrders}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <h3>Today's Revenue</h3>
            <div className="stat-value orange">${stats.todayRevenue?.toFixed(2)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <h3>Pending</h3>
            <div className="stat-value yellow">{stats.pendingOrders}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <h3>Total Orders</h3>
            <div className="stat-value" style={{ color: 'var(--gray-900)' }}>{stats.totalOrders}</div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Recent Orders</h3>
        {recentOrders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No orders yet</h3>
            <p>Orders appear here when customers place them</p>
          </div>
        ) : (
          <div className="order-list">
            {recentOrders.map(order => (
              <div key={order.id} className="order-card">
                <div className="order-card-top">
                  <div>
                    <div className="order-card-customer">{order.customer_name}</div>
                    <div className="order-card-table">Table {order.table_number || '—'} • {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <span className={`badge badge-${order.status}`}>{order.status}</span>
                </div>
                <div className="order-card-bottom">
                  <div className="order-card-total">${parseFloat(order.total).toFixed(2)}</div>
                  <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>#{order.id.slice(0, 6)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
