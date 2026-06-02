import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, ClipboardList, UtensilsCrossed, QrCode, Settings, ScrollText, BarChart3, CreditCard, Bell, Users, Package, Gift, FileText, Bot, MessageSquare, Mail, X, Phone } from './Icons';

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
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [contactOpen, setContactOpen] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await axios.get('/api/orders/admin');
        setPendingCount(res.data.filter(o => o.status === 'pending' || o.status === 'waiting_verification').length);
      } catch {}
    };
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkFeedback = async () => {
      try {
        const res = await axios.get('/api/feedback/admin');
        setFeedbackCount(res.data.length);
      } catch {}
    };
    checkFeedback();
    const interval = setInterval(checkFeedback, 15000);
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
                <span className="nav-icon" style={{ position: 'relative' }}>
                  <MessageSquare size={20} />
                  {feedbackCount > 0 && <span className="nav-badge" />}
                </span>
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
              <button className={`nav-item ${activeTab === 'ai' ? 'active' : ''}`} onClick={() => onTabChange('ai')}>
                <span className="nav-icon"><Bot size={20} /></span>
                AI
              </button>
              <button className="nav-item" onClick={() => setContactOpen(true)}>
                <span className="nav-icon"><Mail size={20} /></span>
                Contact
              </button>
            </>
          )}
      </nav>

      {/* Contact Developer Modal */}
      {contactOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)', padding: 20,
        }} onClick={() => setContactOpen(false)}>
          <div style={{
            background: 'var(--card-bg, white)', borderRadius: 16, padding: 28,
            maxWidth: 360, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Contact Developer</h3>
              <button onClick={() => setContactOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4, color: 'var(--gray-400)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, background: 'var(--gray-50, #F9FAFB)' }}>
                <Mail size={18} color="var(--orange)" />
                <div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 600 }}>EMAIL</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-900)' }}>shahariarhossain674@gmail.com</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, background: 'var(--gray-50, #F9FAFB)' }}>
                <Phone size={18} color="var(--orange)" />
                <div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 600 }}>PHONE</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-900)' }}>+8801739849009</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
