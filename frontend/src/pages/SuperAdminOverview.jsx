import { useState, useEffect } from 'react';
import axios from 'axios';
import { Store, Crown, ShoppingCart, DollarSign, Clock, TrendingUp } from '../components/Icons';

export default function SuperAdminOverview() {
  const [stats, setStats] = useState(null);
  const token = localStorage.getItem('super_token');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get('/api/super-admin/stats', { headers: { Authorization: `Bearer ${token}` } });
        setStats(res.data);
      } catch {}
    };
    load();
  }, []);

  if (!stats) return <div className="super-loading">Loading...</div>;

  const cards = [
    { Icon: Store, label: 'Total Restaurants', value: stats.totalRestaurants, color: '#FF8C42' },
    { Icon: Crown, label: 'Pro Users', value: stats.proUsers, color: '#FFC107' },
    { Icon: DollarSign, label: 'Revenue', value: `$${Number(stats.totalRevenue).toFixed(0)}`, color: '#22C55E' },
    { Icon: ShoppingCart, label: 'Total Orders', value: stats.totalOrders, color: '#3B82F6' },
    { Icon: Clock, label: 'Pending', value: stats.pendingOrders, color: '#EF4444' },
    { Icon: TrendingUp, label: 'Free Users', value: stats.freeUsers, color: '#8B5CF6' },
  ];

  return (
    <div className="super-page">
      <div className="super-page-header">
        <h1>Overview</h1>
        <p>Real-time platform summary</p>
      </div>

      <div className="super-stats-grid">
        {cards.map(({ Icon, label, value, color }) => (
          <div key={label} className="super-stat-card">
            <div className="super-stat-icon" style={{ background: `${color}15`, color }}>
              <Icon size={20} />
            </div>
            <div className="super-stat-info">
              <div className="super-stat-label">{label}</div>
              <div className="super-stat-value">{value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="super-section-title">Recent Restaurants</div>
      <div className="super-table-wrap">
        <table className="super-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {stats.restaurants.slice(0, 10).map(r => (
              <tr key={r.id}>
                <td className="super-td-name">{r.name}</td>
                <td className="super-td-muted">{r.email}</td>
                <td><span className={`super-badge ${r.plan === 'pro' ? 'pro' : 'free'}`}>{r.plan || 'free'}</span></td>
                <td><span className={`super-badge ${r.status === 'suspended' ? 'suspended' : 'active'}`}>{r.status || 'active'}</span></td>
                <td className="super-td-muted">{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
