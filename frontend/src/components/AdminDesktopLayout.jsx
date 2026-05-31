import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getSelectedCurrency, fetchRates, formatPrice } from '../utils/currency';

const NAV = [
  { key: 'home', label: 'Home', icon: '🏠' },
  { key: 'orders', label: 'Orders', icon: '📋' },
  { key: 'menu', label: 'Menu', icon: '🍽️' },
  { key: 'tables', label: 'Tables', icon: '🪑' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
];

function RightPanelOverview({ activeTab }) {
  const [pendingCount, setPendingCount] = useState(0);
  const { restaurant } = useAuth();

  useEffect(() => {
    axios.get('/api/orders/admin').then(r => setPendingCount(r.data.filter(o => o.status === 'pending').length)).catch(() => {});
  }, []);

  const panels = {
    home: {
      icon: '🏠',
      title: 'Dashboard',
      lines: ['Overview of your restaurant', 'Real-time stats & insights'],
    },
    orders: {
      icon: '📋',
      title: 'Order Management',
      lines: [`${pendingCount} pending orders`, 'Click an order to manage'],
    },
    menu: {
      icon: '🍽️',
      title: 'Menu Builder',
      lines: ['Manage items & categories', 'Toggle availability'],
    },
    tables: {
      icon: '🪑',
      title: 'Tables & QR',
      lines: ['Add or remove tables', 'Generate QR codes'],
    },
    settings: {
      icon: '⚙️',
      title: 'Restaurant Settings',
      lines: ['Theme, currency, logo', 'Upgrade to Pro'],
    },
  };

  const p = panels[activeTab] || panels.home;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>{p.icon}</div>
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--gray-900)' }}>{p.title}</h3>
      {p.lines.map((l, i) => (
        <p key={i} style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 4 }}>{l}</p>
      ))}
    </div>
  );
}

export default function AdminDesktopLayout({ activeTab, onTabChange, children }) {
  const { restaurant, logout } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [stats, setStats] = useState(null);
  const [rates, setRates] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const currency = getSelectedCurrency();

  useEffect(() => { fetchRates().then(setRates); }, []);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [o, s] = await Promise.all([
          axios.get('/api/orders/admin'),
          axios.get('/api/orders/stats/dashboard'),
        ]);
        setPendingCount(o.data.filter(o => o.status === 'pending').length);
        setStats(s.data);
      } catch {}
    };
    fetch();
    const interval = setInterval(fetch, 5000);
    return () => clearInterval(interval);
  }, []);

  const logo = restaurant?.logo || localStorage.getItem('restaurant_logo') || '';

  return (
    <div className="desktop-layout">
      {/* SIDEBAR */}
      <aside className="desktop-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            {logo ? (
              <img src={logo} alt="logo" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }} />
            ) : (
              restaurant?.name?.[0]?.toUpperCase() || 'R'
            )}
          </div>
          <div>
            <div className="sidebar-name">{restaurant?.name || 'Restaurant'}</div>
            <div className="sidebar-plan">Free Plan</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(tab => (
            <button
              key={tab.key}
              className={`sidebar-nav-item ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => onTabChange(tab.key)}
            >
              <span className="sidebar-nav-icon">{tab.icon}</span>
              <span className="sidebar-nav-label">{tab.label}</span>
              {tab.key === 'orders' && pendingCount > 0 && (
                <span className="sidebar-badge">{pendingCount}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-nav-item" onClick={logout}>
            <span className="sidebar-nav-icon">🚪</span>
            <span className="sidebar-nav-label">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="desktop-main">
        {/* TOPBAR */}
        <header className="desktop-topbar">
          <div className="topbar-left">
            <h2 className="topbar-title">{NAV.find(t => t.key === activeTab)?.label || 'Dashboard'}</h2>
          </div>
          <div className="topbar-right">
            {stats && (
              <div className="topbar-stats">
                <span className="topbar-stat">
                  💰 {rates ? formatPrice(stats.todayRevenue, currency, rates) : `$${Number(stats.todayRevenue).toFixed(2)}`}
                </span>
                <span className="topbar-stat">📋 {stats.totalOrders}</span>
                <span className="topbar-stat">⏳ {stats.pendingOrders}</span>
              </div>
            )}
            <div className="topbar-profile" onClick={() => setProfileOpen(!profileOpen)}>
              <div className="topbar-avatar">
                {logo ? <img src={logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (restaurant?.name?.[0]?.toUpperCase() || 'R')}
              </div>
              {profileOpen && (
                <div className="topbar-dropdown">
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--gray-100)' }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{restaurant?.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{restaurant?.email}</div>
                  </div>
                  <button onClick={() => { onTabChange('settings'); setProfileOpen(false); }} style={{ width: '100%', padding: '10px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>
                    ⚙️ Settings
                  </button>
                  <button onClick={logout} style={{ width: '100%', padding: '10px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', color: '#EF4444' }}>
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CONTENT + RIGHT PANEL */}
        <div className="desktop-body">
          <main className="desktop-content">{children}</main>
          <aside className="desktop-right">
            <RightPanelOverview activeTab={activeTab} />
          </aside>
        </div>
      </div>
    </div>
  );
}
