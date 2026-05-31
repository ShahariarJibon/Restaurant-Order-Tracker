import { useState, useEffect } from 'react';
import axios from 'axios';
import { LayoutDashboard, ClipboardList, UtensilsCrossed, QrCode, Settings } from './Icons';

const TABS = [
  { key: 'home', label: 'Home', Icon: LayoutDashboard },
  { key: 'orders', label: 'Orders', Icon: ClipboardList },
  { key: 'menu', label: 'Menu', Icon: UtensilsCrossed },
  { key: 'tables', label: 'Tables', Icon: QrCode },
  { key: 'settings', label: 'Settings', Icon: Settings },
];

export default function AdminMobileLayout({ activeTab, onTabChange, children }) {
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
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
