import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getSelectedCurrency, fetchRates, formatPrice } from '../utils/currency';
import {
  LayoutDashboard, ClipboardList, UtensilsCrossed, QrCode, Settings,
  Hourglass, LogOut, ScrollText, TrendingUp, BarChart3,
  CreditCard, Bell, Users, Package, Gift, FileText, Bot, MessageSquare,
} from './Icons';

const NAV = [
  { key: 'home', label: 'Home', Icon: LayoutDashboard },
  { key: 'orders', label: 'Orders', Icon: ClipboardList },
  { key: 'menu', label: 'Menu', Icon: UtensilsCrossed },
  { key: 'tables', label: 'Tables', Icon: QrCode },
  { key: 'settings', label: 'Settings', Icon: Settings },
];

const PANEL_DEFS = {
  home: { Icon: LayoutDashboard, title: 'Dashboard', lines: ['Overview of your restaurant', 'Real-time stats & insights'] },
  orders: { Icon: ClipboardList, title: 'Order Management', lines: ['Manage incoming orders', 'Track order status'] },
  menu: { Icon: UtensilsCrossed, title: 'Menu Builder', lines: ['Manage items & categories', 'Toggle availability'] },
  tables: { Icon: QrCode, title: 'Tables & QR', lines: ['Add or remove tables', 'Generate QR codes'] },
  history: { Icon: ScrollText, title: 'Order History', lines: ['View past orders', 'Export to Excel'] },
  analytics: { Icon: BarChart3, title: 'Analytics', lines: ['Revenue trends & KPIs', 'Best sellers & insights'] },
  payments: { Icon: CreditCard, title: 'Payments', lines: ['bKash, Nagad, card payments', 'Coming soon'] },
  notifications: { Icon: MessageSquare, title: 'Feedback', lines: ['Customer reviews & comments', 'Read customer feedback'] },
  staff: { Icon: Users, title: 'Staff Management', lines: ['Multiple accounts with roles', 'Coming soon'] },
  inventory: { Icon: Package, title: 'Inventory', lines: ['Track ingredients & stock', 'Coming soon'] },
  loyalty: { Icon: Gift, title: 'Loyalty Program', lines: ['Points, coupons, promos', 'Coming soon'] },
  billing: { Icon: FileText, title: 'Billing & Reports', lines: ['Invoices, tax reports, export', 'Coming soon'] },
  ai: { Icon: Bot, title: 'AI Features', lines: ['Smart suggestions & predictions', 'Coming soon'] },
  settings: { Icon: Settings, title: 'Restaurant Settings', lines: ['Theme, currency, logo', 'Upgrade to Pro'] },
};

function RightPanelOverview({ activeTab }) {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    axios.get('/api/orders/admin').then(r => setPendingCount(r.data.filter(o => o.status === 'pending' || o.status === 'waiting_verification').length)).catch(() => {});
  }, []);

  const panels = {
    ...PANEL_DEFS,
    orders: { Icon: ClipboardList, title: 'Order Management', lines: [`${pendingCount} orders waiting`, 'Click an order to manage'] },
  };

  const p = panels[activeTab] || panels.home;
  const PanelIcon = p.Icon;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 12, color: 'var(--orange)' }}>
        <PanelIcon size={48} strokeWidth={1.5} />
      </div>
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
  const [feedbackCount, setFeedbackCount] = useState(0);
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
        setPendingCount(o.data.filter(o => o.status === 'pending' || o.status === 'waiting_verification').length);
        setStats(s.data);
      } catch {}
    };
    fetch();
    const interval = setInterval(fetch, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const res = await axios.get('/api/feedback/admin');
        setFeedbackCount(res.data.length);
      } catch {}
    };
    fetchFeedback();
    const interval = setInterval(fetchFeedback, 15000);
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
            <div className="sidebar-plan">{restaurant?.plan === 'pro' ? 'Pro Plan' : 'Free Plan'}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(tab => {
            const TabIcon = tab.Icon;
            return (
              <button
                key={tab.key}
                className={`sidebar-nav-item ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => onTabChange(tab.key)}
              >
                <span className="sidebar-nav-icon"><TabIcon size={18} /></span>
                <span className="sidebar-nav-label">{tab.label}</span>
                {tab.key === 'orders' && pendingCount > 0 && (
                  <span className="sidebar-badge">{pendingCount}</span>
                )}
              </button>
            );
          })}
          <div className="sidebar-section-label">INSIGHTS</div>
          <button className={`sidebar-nav-item ${activeTab === 'ai' ? 'active' : ''}`} onClick={() => onTabChange('ai')}>
            <span className="sidebar-nav-icon" style={{ color: 'var(--orange)' }}><Bot size={18} /></span>
            <span className="sidebar-nav-label">AI Insights</span>
          </button>
          {restaurant?.plan === 'pro' && (
            <>
              <div className="sidebar-section-label">PRO FEATURES</div>
              <button className={`sidebar-nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => onTabChange('history')}>
                <span className="sidebar-nav-icon" style={{ color: 'var(--yellow)' }}><ScrollText size={18} /></span>
                <span className="sidebar-nav-label">History</span>
              </button>
              <button className={`sidebar-nav-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => onTabChange('analytics')}>
                <span className="sidebar-nav-icon" style={{ color: 'var(--yellow)' }}><BarChart3 size={18} /></span>
                <span className="sidebar-nav-label">Analytics</span>
              </button>
              <button className={`sidebar-nav-item ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => onTabChange('payments')}>
                <span className="sidebar-nav-icon" style={{ color: 'var(--yellow)' }}><CreditCard size={18} /></span>
                <span className="sidebar-nav-label">Payments</span>
              </button>
              <button className={`sidebar-nav-item ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => onTabChange('notifications')}>
                <span className="sidebar-nav-icon" style={{ color: 'var(--yellow)' }}><MessageSquare size={18} /></span>
                <span className="sidebar-nav-label">Feedback</span>
                {feedbackCount > 0 && <span className="sidebar-badge" style={{ background: '#EF4444' }}>{feedbackCount}</span>}
              </button>
              <button className={`sidebar-nav-item ${activeTab === 'staff' ? 'active' : ''}`} onClick={() => onTabChange('staff')}>
                <span className="sidebar-nav-icon" style={{ color: 'var(--yellow)' }}><Users size={18} /></span>
                <span className="sidebar-nav-label">Staff</span>
              </button>
              <button className={`sidebar-nav-item ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => onTabChange('inventory')}>
                <span className="sidebar-nav-icon" style={{ color: 'var(--yellow)' }}><Package size={18} /></span>
                <span className="sidebar-nav-label">Inventory</span>
              </button>
              <button className={`sidebar-nav-item ${activeTab === 'loyalty' ? 'active' : ''}`} onClick={() => onTabChange('loyalty')}>
                <span className="sidebar-nav-icon" style={{ color: 'var(--yellow)' }}><Gift size={18} /></span>
                <span className="sidebar-nav-label">Loyalty</span>
              </button>
              <button className={`sidebar-nav-item ${activeTab === 'billing' ? 'active' : ''}`} onClick={() => onTabChange('billing')}>
                <span className="sidebar-nav-icon" style={{ color: 'var(--yellow)' }}><FileText size={18} /></span>
                <span className="sidebar-nav-label">Billing</span>
              </button>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-nav-item" onClick={logout}>
            <span className="sidebar-nav-icon"><LogOut size={18} /></span>
            <span className="sidebar-nav-label">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="desktop-main">
        {/* TOPBAR */}
        <header className="desktop-topbar">
          <div className="topbar-left">
            <h2 className="topbar-title">{NAV.find(t => t.key === activeTab)?.label || PANEL_DEFS[activeTab]?.title || 'Dashboard'}</h2>
          </div>
          <div className="topbar-right">
            {stats && (
              <div className="topbar-stats">
                <span className="topbar-stat" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {rates ? formatPrice(stats.todayRevenue, currency, rates) : `$${Number(stats.todayRevenue).toFixed(2)}`}
                </span>
                <span className="topbar-stat" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <ClipboardList size={14} /> {stats.totalOrders}
                </span>
                <span className="topbar-stat" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Hourglass size={14} /> {stats.pendingOrders}
                </span>
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
                  <button onClick={() => { onTabChange('settings'); setProfileOpen(false); }} style={{ width: '100%', padding: '10px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Settings size={16} /> Settings
                  </button>
                  <button onClick={logout} style={{ width: '100%', padding: '10px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8, color: '#EF4444' }}>
                    <LogOut size={16} /> Sign Out
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
