import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, ClipboardList, UtensilsCrossed, QrCode, Settings, ScrollText, TrendingUp } from './Icons';

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
      <nav className="bottom-nav">
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
            <button
              className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => onTabChange('history')}
            >
              <span className="nav-icon"><ScrollText size={20} /></span>
              History
            </button>
            <button
              className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => onTabChange('analytics')}
            >
              <span className="nav-icon"><TrendingUp size={20} /></span>
              Analytics
            </button>
          </>
        )}
      </nav>
    </div>
  );
}
