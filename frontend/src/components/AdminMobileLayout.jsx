import { useAuth } from '../context/AuthContext';

const TABS = [
  { key: 'home', label: 'Home', icon: '🏠' },
  { key: 'orders', label: 'Orders', icon: '📋' },
  { key: 'menu', label: 'Menu', icon: '🍽️' },
  { key: 'tables', label: 'Tables', icon: '🪑' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
];

export default function AdminMobileLayout({ activeTab, onTabChange, children }) {
  const { restaurant, logout } = useAuth();

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
            <span className="nav-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
