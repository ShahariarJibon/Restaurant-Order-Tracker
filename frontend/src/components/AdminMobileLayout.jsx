import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, ClipboardList, UtensilsCrossed, QrCode, Settings, ScrollText, BarChart3, CreditCard, Bell, Users, Package, Gift, FileText, Bot, MessageSquare } from './Icons';

const TABS = [
  { key: 'home', label: 'Home', Icon: LayoutDashboard },
  { key: 'orders', label: 'Orders', Icon: ClipboardList },
  { key: 'menu', label: 'Menu', Icon: UtensilsCrossed },
  { key: 'tables', label: 'Tables', Icon: QrCode },
  { key: 'settings', label: 'Settings', Icon: Settings },
];

export default function AdminMobileLayout({ activeTab, onTabChange, children }) {
  const { restaurant } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await axios.get('/api/orders/admin');
        setPendingCount(res.data.filter(o => o.status === 'pending').length);
      } catch {}
    };
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="admin-app">
      {children}
      <nav className="bottom-nav" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {TABS.map(tab => {
          const Icon = tab.Icon;
          const isProTab = tab.key === 'settings' && restaurant?.plan === 'pro';
          return (
            <button
              key={tab.key}
              className={`nav-item ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => onTabChange(tab.key)}
            >
              <span className="nav-icon" style={{ position: 'relative' }}>
                <Icon size={20} />
                {tab.key === 'orders' && pendingCount > 0 && (
                  <span className="nav-badge" />
                )}
              </span>
              {tab.key === 'tables' ? 'Tables' : tab.label}
            </button>
          );
        })}
        {restaurant?.plan === 'pro' && (
            <>
              <button className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => onTabChange('history')}>
                <span className="nav-icon"><ScrollText size={20} /></span>
                History
              </button>
              <button className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => onTabChange('analytics')}>
                <span className="nav-icon"><BarChart3 size={20} /></span>
                Analytics
              </button>
              <button className={`nav-item ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => onTabChange('payments')}>
                <span className="nav-icon"><CreditCard size={20} /></span>
                Payments
              </button>
              <button className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => onTabChange('notifications')}>
                <span className="nav-icon"><MessageSquare size={20} /></span>
                Feedback
              </button>
              <button className={`nav-item ${activeTab === 'staff' ? 'active' : ''}`} onClick={() => onTabChange('staff')}>
                <span className="nav-icon"><Users size={20} /></span>
                Staff
              </button>
              <button className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => onTabChange('inventory')}>
                <span className="nav-icon"><Package size={20} /></span>
                Stock
              </button>
              <button className={`nav-item ${activeTab === 'loyalty' ? 'active' : ''}`} onClick={() => onTabChange('loyalty')}>
                <span className="nav-icon"><Gift size={20} /></span>
                Loyalty
              </button>
              <button className={`nav-item ${activeTab === 'billing' ? 'active' : ''}`} onClick={() => onTabChange('billing')}>
                <span className="nav-icon"><FileText size={20} /></span>
                Billing
              </button>
              <button className={`nav-item ${activeTab === 'ai' ? 'active' : ''}`} onClick={() => onTabChange('ai')}>
                <span className="nav-icon"><Bot size={20} /></span>
                AI
              </button>
            </>
          )}
      </nav>
    </div>
  );
}
