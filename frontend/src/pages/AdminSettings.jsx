import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const PRO_FEATURES = [
  { icon: '📊', name: 'Advanced Analytics', desc: 'Daily reports, best sellers, revenue trends' },
  { icon: '💳', name: 'Payments', desc: 'bKash, Nagad, card payments' },
  { icon: '🔔', name: 'Notifications', desc: 'Sound alerts, push, SMS' },
  { icon: '👨‍🍳', name: 'Staff Management', desc: 'Multiple accounts with roles' },
  { icon: '📦', name: 'Inventory', desc: 'Track ingredients & stock' },
  { icon: '🎁', name: 'Loyalty Program', desc: 'Points, coupons, promos' },
  { icon: '🧾', name: 'Billing & Reports', desc: 'Invoices, tax reports, export' },
  { icon: '🤖', name: 'AI Features', desc: 'Smart suggestions & predictions' },
];

export default function AdminSettings() {
  const { restaurant, logout } = useAuth();
  const stored = localStorage.getItem('theme') === 'dark';
  const [darkMode, setDarkMode] = useState(stored);
  const [logo, setLogo] = useState(localStorage.getItem('restaurant_logo') || '');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : '');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setLogo(dataUrl);
      localStorage.setItem('restaurant_logo', dataUrl);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2>Settings</h2>
      </div>

      {/* Profile */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => document.getElementById('logo-input').click()} style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--orange-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: 'var(--orange)', cursor: 'pointer', border: '2px solid var(--orange)', overflow: 'hidden', padding: 0, flexShrink: 0 }}>
            {logo ? <img src={logo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (restaurant?.name?.[0]?.toUpperCase() || 'R')}
          </button>
          <input id="logo-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoChange} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{restaurant?.name || 'Restaurant'}</div>
            <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>{restaurant?.email || ''}</div>
          </div>
        </div>
      </div>

      {/* Dark Mode Toggle */}
      <div className="card" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22 }}>{darkMode ? '🌙' : '☀️'}</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Dark Mode</div>
            <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>{darkMode ? 'On' : 'Off'}</div>
          </div>
        </div>
        <label className="toggle">
          <input type="checkbox" checked={darkMode} onChange={e => setDarkMode(e.target.checked)} />
          <span className="slider" />
        </label>
      </div>

      <div className="settings-list" style={{ marginBottom: 20 }}>
        <button className="settings-item" onClick={logout}>
          <span className="si-icon">🚪</span>
          <span className="si-label">Sign Out</span>
          <span className="si-arrow">›</span>
        </button>
      </div>

      {/* Pro Features */}
      <div className="pro-section">
        <h3>🔒 Pro Features</h3>
        {PRO_FEATURES.map((feat, i) => (
          <div key={i} className="pro-card">
            <div className="pro-card-icon">🔒</div>
            <div className="pro-card-info">
              <div className="pro-card-name">{feat.icon} {feat.name}</div>
              <div className="pro-card-desc">{feat.desc}</div>
            </div>
          </div>
        ))}
        <button className="pro-cta">⭐ Upgrade to Pro</button>
      </div>
    </div>
  );
}
