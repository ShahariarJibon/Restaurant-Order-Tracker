import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Clock, LogOut, CheckCircle, UtensilsCrossed, RefreshCw, Sparkles } from '../components/Icons';

const STATUS_FLOW = { approved: 'preparing', preparing: 'cooking', cooking: 'ready' };
const STATUS_LABELS = { approved: 'Approved', preparing: 'Preparing', cooking: 'Cooking', ready: 'Ready' };
const STATUS_COLORS = { approved: '#F59E0B', preparing: '#F97316', cooking: '#8B5CF6', ready: '#22C55E' };
const BTN_LABELS = { approved: '🍳 Start Cooking', preparing: '🔥 Cooking', cooking: '✅ Ready' };

export default function ChefDisplay() {
  const [orders, setOrders] = useState([]);
  const [staffInfo, setStaffInfo] = useState(null);
  const navigate = useNavigate();
  const audioRef = useRef(null);

  useEffect(() => {
    const info = localStorage.getItem('staff_info');
    if (!info) { navigate('/staff-login'); return; }
    const parsed = JSON.parse(info);
    if (parsed.role !== 'chef') { navigate('/staff-login'); return; }
    setStaffInfo(parsed);
    axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('staff_token')}`;
  }, [navigate]);

  useEffect(() => {
    if (!staffInfo) return;
    const load = async () => {
      try {
        const res = await axios.get('/api/staff/chef-orders');
        setOrders(prev => {
          if (res.data.length > prev.length) {
            try { audioRef.current?.play(); } catch {}
          }
          return res.data;
        });
      } catch {}
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [staffInfo]);

  const updateStatus = async (orderId, currentStatus) => {
    const next = STATUS_FLOW[currentStatus];
    if (!next) return;
    try {
      await axios.put(`/api/staff/chef-status/${orderId}`, { status: next });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: next } : o));
    } catch {}
  };

  const logout = () => {
    localStorage.removeItem('staff_token');
    localStorage.removeItem('staff_info');
    delete axios.defaults.headers.common['Authorization'];
    navigate('/staff-login');
  };

  const getElapsed = (createdAt) => {
    const diff = Date.now() - new Date(createdAt + 'Z').getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'Just now';
    if (min < 60) return `${min}m ago`;
    return `${Math.floor(min / 60)}h ${min % 60}m`;
  };

  const getTimerColor = (createdAt) => {
    const diff = Date.now() - new Date(createdAt + 'Z').getTime();
    const min = Math.floor(diff / 60000);
    if (min > 20) return '#EF4444';
    if (min > 10) return '#F59E0B';
    return 'var(--gray-500)';
  };

  return (
    <div style={{ minHeight: '100vh', background: '#1a1a2e', color: 'white', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <audio ref={audioRef} src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACAf39/f4B/f3+AgH9/f3+AgH9/f3+AgH9/f3+AgICAgICAgIGBgYGCgoKCg4ODg4SEhISFhYWGhoaHh4eIiIiJiYmKioqLi4uMjIyNjY2Ojo6Pj4+QkJCRkZGSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKRkZGRkZGQkJCQkJCPj4+Pj4+Ojo6Ojo6NjY2NjY2MjIyMjIyLi4uLi4uKioqKioqJiYmJiYmIiIiIiIiHh4eHh4eGhoaGhoaFhYWFhYWEhISEhISDg4ODg4OCgoKCgoKCgYGBgYGBgICAgICAgIABAQH9/f39/f39/f39/f39/f3+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v3+/v39/f39/f39/f39/f39/f39/f7+/v7+/v7+/v7+/v7+/v7+" />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: '#16213e', borderBottom: '1px solid #0f3460' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ChefHat size={28} style={{ color: '#F97316' }} />
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Kitchen Display</h1>
            {staffInfo && <p style={{ fontSize: 13, color: '#94a3b8', margin: '2px 0 0' }}>{staffInfo.name}</p>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#22C55E', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
            Live
          </span>
          <button onClick={logout} style={{ background: 'none', border: '1px solid #EF4444', color: '#EF4444', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
            <LogOut size={14} /> Exit
          </button>
        </div>
      </div>

      <div style={{ padding: 16, maxWidth: 1400, margin: '0 auto' }}>
        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <UtensilsCrossed size={48} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <h2 style={{ fontSize: 18, margin: '0 0 6px', color: '#94a3b8' }}>No Orders Yet</h2>
            <p style={{ fontSize: 14, margin: 0 }}>Waiting for approved orders from the admin...</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
            {orders.map(order => {
              const flowStep = STATUS_FLOW[order.status];
              return (
                <div key={order.id} style={{
                  background: '#16213e', borderRadius: 12, padding: 16, border: `2px solid ${STATUS_COLORS[order.status] || '#0f3460'}`,
                  transition: 'all 0.2s', boxShadow: order.status === 'approved' ? `0 0 20px ${STATUS_COLORS[order.status]}30` : 'none',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 22 }}>🍽️</span>
                        <span style={{ fontWeight: 700, fontSize: 18 }}>Table {order.table_number || '—'}</span>
                      </div>
                      <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{order.customer_name || 'Guest'}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                        background: STATUS_COLORS[order.status] + '30', color: STATUS_COLORS[order.status],
                      }}>
                        {STATUS_LABELS[order.status] || order.status.toUpperCase()}
                      </span>
                      <span style={{ fontSize: 12, color: getTimerColor(order.created_at), display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Clock size={12} /> {getElapsed(order.created_at)}
                      </span>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #0f3460', borderBottom: '1px solid #0f3460', padding: '10px 0', marginBottom: 12 }}>
                    {order.items?.map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 15 }}>
                        <span style={{ fontWeight: 500 }}>{item.item_name}</span>
                        <span style={{ color: '#94a3b8' }}>×{item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    {flowStep && (
                      <button
                        onClick={() => updateStatus(order.id, order.status)}
                        style={{
                          flex: 1, padding: '12px', border: 'none', borderRadius: 8, cursor: 'pointer',
                          background: STATUS_COLORS[order.status], color: 'white', fontWeight: 700, fontSize: 14,
                          fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          transition: 'transform 0.1s', boxShadow: `0 4px 12px ${STATUS_COLORS[order.status]}40`,
                        }}
                        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
                        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        {BTN_LABELS[order.status]}
                      </button>
                    )}
                    {order.status === 'ready' && (
                      <div style={{ flex: 1, padding: '12px', borderRadius: 8, background: '#22C55E20', color: '#22C55E', textAlign: 'center', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <CheckCircle size={16} /> Ready for Waiter
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
