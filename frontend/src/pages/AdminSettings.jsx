import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { CURRENCIES, getSelectedCurrency } from '../utils/currency';
import {
  ScrollText, BarChart3, CreditCard, Bell, Users, Package, Gift, FileText, Bot,
  Sun, Moon, Lock, LogOut, Star, Crown, CheckCircle, Upload, Image,
} from '../components/Icons';

const PRO_FEATURES = [
  { Icon: ScrollText, tabKey: 'history', name: 'History', desc: 'Order history with filters & export' },
  { Icon: BarChart3, tabKey: 'analytics', name: 'Advanced Analytics', desc: 'Daily reports, best sellers, revenue trends' },
  { Icon: CreditCard, tabKey: 'payments', name: 'Payments', desc: 'bKash, Nagad, card payments' },
  { Icon: Bell, tabKey: 'notifications', name: 'Notifications', desc: 'Sound alerts, push, SMS' },
  { Icon: Users, tabKey: 'staff', name: 'Staff Management', desc: 'Multiple accounts with roles' },
  { Icon: Package, tabKey: 'inventory', name: 'Inventory', desc: 'Track ingredients & stock' },
  { Icon: Gift, tabKey: 'loyalty', name: 'Loyalty Program', desc: 'Points, coupons, promos' },
  { Icon: FileText, tabKey: 'billing', name: 'Billing & Reports', desc: 'Invoices, tax reports, export' },
  { Icon: Bot, tabKey: 'ai', name: 'AI Features', desc: 'Smart suggestions & predictions' },
];

export default function AdminSettings({ onGoToUpgrade, onNavigate }) {
  const { restaurant, logout, updateCurrency, updateRestaurant } = useAuth();
  const stored = localStorage.getItem('theme') === 'dark';
  const [darkMode, setDarkMode] = useState(stored);
  const [logo, setLogo] = useState(localStorage.getItem('restaurant_logo') || '');
  const [currency, setCurrency] = useState(getSelectedCurrency());
  const [qrBkash, setQrBkash] = useState(localStorage.getItem('payment_qr_bkash') || '');
  const [qrNagad, setQrNagad] = useState(localStorage.getItem('payment_qr_nagad') || '');
  const [qrRocket, setQrRocket] = useState(localStorage.getItem('payment_qr_rocket') || '');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : '');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    if (restaurant?.payment_qr_bkash) setQrBkash(restaurant.payment_qr_bkash);
    if (restaurant?.payment_qr_nagad) setQrNagad(restaurant.payment_qr_nagad);
    if (restaurant?.payment_qr_rocket) setQrRocket(restaurant.payment_qr_rocket);
  }, [restaurant]);

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('logo', file);
    try {
      const res = await axios.post('/api/auth/logo', formData);
      if (res.data.logo) {
        setLogo(res.data.logo);
        updateRestaurant({ logo: res.data.logo });
      }
    } catch {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setLogo(ev.target.result);
        localStorage.setItem('restaurant_logo', ev.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleQrUpload = async (method, dataUrl) => {
    const payload = {};
    if (method === 'bKash') payload.bkash = dataUrl;
    if (method === 'Nagad') payload.nagad = dataUrl;
    if (method === 'Rocket') payload.rocket = dataUrl;
    try {
      const res = await axios.put('/api/auth/payment-qr', payload);
      if (res.data.qr) {
        updateRestaurant({
          payment_qr_bkash: res.data.qr.payment_qr_bkash,
          payment_qr_nagad: res.data.qr.payment_qr_nagad,
          payment_qr_rocket: res.data.qr.payment_qr_rocket,
        });
      }
    } catch {}
  };

  const readFileAsDataUrl = (file, setter, method) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target.result;
      setter(url);
      handleQrUpload(method, url);
      localStorage.setItem(`payment_qr_${method.toLowerCase()}`, url);
    };
    reader.readAsDataURL(file);
  };

  const isPro = restaurant?.plan === 'pro';

  const handleCurrencyChange = async (e) => {
    const code = e.target.value;
    setCurrency(code);
    localStorage.setItem('currency', code);
    try {
      await axios.put('/api/auth/currency', { currency: code });
      updateCurrency(code);
    } catch {}
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

      {/* Dark Mode */}
      <div className="card" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {darkMode ? <Moon size={22} /> : <Sun size={22} />}
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

      {/* Currency */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Currency</div>
        <select
          value={currency}
          onChange={handleCurrencyChange}
          style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '2px solid var(--gray-200)', background: 'var(--white)', color: 'var(--gray-900)', fontWeight: 600, fontSize: 15, fontFamily: 'inherit' }}
        >
          {CURRENCIES.map(c => (
            <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>
          ))}
        </select>
      </div>

      <div className="settings-list" style={{ marginBottom: 20 }}>
        <button className="settings-item" onClick={logout}>
          <span className="si-icon"><LogOut size={20} /></span>
          <span className="si-label">Sign Out</span>
          <span className="si-arrow">›</span>
        </button>
      </div>

      {/* Payment QR (Pro) */}
      {isPro && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
            <CreditCard size={18} style={{ color: 'var(--orange)' }} /> Payment QR Codes
          </h3>
          <p style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 12 }}>
            Upload your bKash, Nagad, and Rocket QR codes. Customers will scan these to pay.
          </p>
          {[
            { key: 'bkash', label: 'bKash', img: qrBkash, setter: setQrBkash },
            { key: 'nagad', label: 'Nagad', img: qrNagad, setter: setQrNagad },
            { key: 'rocket', label: 'Rocket', img: qrRocket, setter: setQrRocket },
          ].map(item => (
            <div key={item.key} style={{ marginBottom: 10 }}>
              <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 4 }}>{item.label}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {item.img ? (
                  <img src={item.img} alt={item.label} style={{ width: 60, height: 60, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--gray-200)' }} />
                ) : (
                  <div style={{ width: 60, height: 60, borderRadius: 8, background: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)' }}>
                    <Image size={24} />
                  </div>
                )}
                <label style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '8px', borderRadius: 8, border: '1px dashed var(--gray-300)',
                  cursor: 'pointer', fontSize: 13, color: 'var(--gray-500)', background: 'var(--gray-50)',
                }}>
                  <Upload size={16} /> {item.img ? 'Change' : 'Upload'} QR
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) { readFileAsDataUrl(file, item.setter, item.label); }
                  }} />
                </label>
                {item.img && (
                  <button onClick={() => { item.setter(''); localStorage.setItem(`payment_qr_${item.key}`, ''); handleQrUpload(item.label, ''); }} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 18, padding: 4 }}>×</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pro Features */}
      <div className="pro-section">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isPro ? <Crown size={18} style={{ color: 'var(--yellow)' }} /> : <Lock size={18} />}
          Pro Features
          {isPro && <span className="super-badge pro" style={{ marginLeft: 8 }}>ACTIVE</span>}
        </h3>
        {PRO_FEATURES.map((feat, i) => {
          const FeatIcon = feat.Icon;
          return (
            <div
              key={i}
              className="pro-card"
              onClick={isPro && onNavigate ? () => onNavigate(feat.tabKey) : undefined}
              style={{
                opacity: isPro ? 1 : 0.6, filter: isPro ? 'none' : 'grayscale(0.3)',
                cursor: isPro && onNavigate ? 'pointer' : 'default',
              }}
            >
              <div className="pro-card-icon">{isPro ? <CheckCircle size={20} style={{ color: 'var(--green)' }} /> : <Lock size={20} />}</div>
              <div className="pro-card-info">
                <div className="pro-card-name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FeatIcon size={16} /> {feat.name}</div>
                <div className="pro-card-desc">{feat.desc}</div>
              </div>
            </div>
          );
        })}
        {!isPro && (
          <button className="pro-cta" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={onGoToUpgrade}>
            <Star size={18} /> Upgrade to Pro
          </button>
        )}
      </div>
    </div>
  );
}
