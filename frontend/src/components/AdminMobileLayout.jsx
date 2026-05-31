import { useState, useEffect } from 'react';
import axios from 'axios';

const TABS = [
  { key: 'home', label: 'Home', icon: '🏠' },
  { key: 'orders', label: 'Orders', icon: '📋' },
  { key: 'menu', label: 'Menu', icon: '🍽️' },
  { key: 'tables', label: 'Tables', icon: '🪑' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
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
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`nav-item ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => onTabChange(tab.key)}
          >
            <span className="nav-icon" style={{ position: 'relative' }}>
              {tab.icon}
              {tab.key === 'orders' && pendingCount > 0 && (
                <span className="nav-badge" />
              )}
            </span>
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
