import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LayoutDashboard, Store, CreditCard, Star, AlertTriangle, Settings,
  LogOut, ChevronRight, DollarSign, Users, ShoppingCart, Clock,
  Crown, Menu, X
} from './Icons';

const NAV_ITEMS = [
  { key: 'overview', label: 'Overview', Icon: LayoutDashboard },
  { key: 'restaurants', label: 'Restaurants', Icon: Store },
  { key: 'payments', label: 'Payments', Icon: CreditCard },
  { key: 'subscriptions', label: 'Subscriptions', Icon: Crown },
  { key: 'reports', label: 'Reports', Icon: AlertTriangle },
  { key: 'settings', label: 'Settings', Icon: Settings },
];

export default function SuperAdminLayout({ activeTab, onTabChange, onLogout, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingPayments, setPendingPayments] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('super_token');
        const res = await axios.get('/api/super-admin/stats', { headers: { Authorization: `Bearer ${token}` } });
        setPendingPayments(res.data.pendingApprovals || 0);
      } catch {}
    };
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="super-layout">
      {/* Mobile toggle */}
      <button className="super-mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Sidebar */}
      <aside className={`super-sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="super-sidebar-top">
          <div className="super-brand">
            <div className="super-brand-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </div>
            <div>
              <div className="super-brand-name">OrderTracker</div>
              <div className="super-brand-sub">Super Admin</div>
            </div>
          </div>
        </div>

        <nav className="super-nav">
          {NAV_ITEMS.map(({ key, label, Icon }) => (
            <button
              key={key}
              className={`super-nav-item ${activeTab === key ? 'active' : ''}`}
              onClick={() => { onTabChange(key); setMobileOpen(false); }}
              style={{ position: 'relative' }}
            >
              <Icon size={18} />
              <span>{label}</span>
              {key === 'payments' && pendingPayments > 0 && (
                <span style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  width: 10, height: 10, borderRadius: '50%', background: '#EF4444',
                  boxShadow: '0 0 6px rgba(239,68,68,0.6)',
                }} />
              )}
              {activeTab === key && <ChevronRight size={14} className="super-nav-arrow" />}
            </button>
          ))}
        </nav>

        <div className="super-sidebar-bottom">
          <div className="super-profile">
            <div className="super-avatar">SA</div>
            <div className="super-profile-info">
              <div className="super-profile-name">Super Admin</div>
              <div className="super-profile-role">Owner</div>
            </div>
          </div>
          <button className="super-logout" onClick={onLogout}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {mobileOpen && <div className="super-overlay" onClick={() => setMobileOpen(false)} />}

      {/* Main workspace */}
      <main className="super-main">
        {children}
      </main>

      {/* Insights panel (desktop only) */}
      <aside className="super-insights">
        <div className="super-insight-card">
          <div className="super-insight-header">
            <Clock size={14} />
            <span>Quick Actions</span>
          </div>
          <div className="super-insight-actions">
            <button className="super-insight-btn" onClick={() => onTabChange('restaurants')}>
              <Users size={16} /> Manage Restaurants
            </button>
            <button className="super-insight-btn" onClick={() => onTabChange('payments')}>
              <CreditCard size={16} /> View Payments
            </button>
            <button className="super-insight-btn" onClick={() => onTabChange('subscriptions')}>
              <Crown size={16} /> Subscriptions
            </button>
          </div>
        </div>
        <div className="super-insight-card">
          <div className="super-insight-header">
            <DollarSign size={14} />
            <span>Today's Summary</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--gray-500)', padding: '8px 0' }}>
            Full data visible in Overview
          </p>
        </div>
      </aside>
    </div>
  );
}
