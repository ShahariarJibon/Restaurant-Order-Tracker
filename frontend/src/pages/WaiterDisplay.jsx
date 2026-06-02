import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Users, LogOut, CheckCircle, TrendingUp, ClipboardList } from '../components/Icons';

export default function WaiterDisplay() {
  const [orders, setOrders] = useState([]);
  const [staffInfo, setStaffInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const info = localStorage.getItem('staff_info');
    if (!info) { navigate('/staff-login'); return; }
    const parsed = JSON.parse(info);
    if (parsed.role !== 'waiter') { navigate('/staff-login'); return; }
    setStaffInfo(parsed);
    axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('staff_token')}`;
  }, [navigate]);

  useEffect(() => {
    if (!staffInfo) return;
    const load = async () => {
      try {
        const res = await axios.get('/api/staff/waiter-orders');
        setOrders(res.data);
      } catch {}
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [staffInfo]);

  const updateStatus = async (orderId, status) => {
    try {
      await axios.put(`/api/staff/waiter-status/${orderId}`, { status });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    } catch {}
  };

  const logout = () => {
    localStorage.removeItem('staff_token');
    localStorage.removeItem('staff_info');
    delete axios.defaults.headers.common['Authorization'];
    navigate('/staff-login');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: '#1e293b', borderBottom: '1px solid #334155' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Users size={28} style={{ color: '#22C55E' }} />
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Waiter Station</h1>
            {staffInfo && <p style={{ fontSize: 13, color: '#94a3b8', margin: '2px 0 0' }}>{staffInfo.name}</p>}
          </div>
        </div>
        <button onClick={logout} style={{ background: 'none', border: '1px solid #EF4444', color: '#EF4444', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
          <LogOut size={14} /> Exit
        </button>
      </div>

      <div style={{ padding: 16, maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
          <span style={{ fontSize: 14, color: '#94a3b8' }}>Orders Ready to Serve: <strong style={{ color: 'white' }}>{orders.filter(o => o.status === 'ready').length}</strong></span>
          <span style={{ fontSize: 14, color: '#94a3b8' }}>•</span>
          <span style={{ fontSize: 14, color: '#94a3b8' }}>In Delivery: <strong style={{ color: '#F97316' }}>{orders.filter(o => o.status === 'delivered').length}</strong></span>
        </div>

        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <TrendingUp size={48} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <h2 style={{ fontSize: 18, margin: '0 0 6px', color: '#94a3b8' }}>No Orders to Deliver</h2>
            <p style={{ fontSize: 14, margin: 0 }}>Waiting for the kitchen to mark orders as ready...</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {orders.map(order => (
              <div key={order.id} style={{
                background: '#1e293b', borderRadius: 12, padding: 16,
                border: `2px solid ${order.status === 'ready' ? '#22C55E' : '#F97316'}`,
                boxShadow: order.status === 'ready' ? '0 0 20px #22C55E20' : 'none',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 22 }}>🍽️</span>
                      <span style={{ fontWeight: 700, fontSize: 18 }}>Table {order.table_number || '—'}</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{order.customer_name || 'Guest'}</div>
                  </div>
                  <span style={{
                    padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                    background: order.status === 'ready' ? '#22C55E30' : '#F9731630',
                    color: order.status === 'ready' ? '#22C55E' : '#F97316',
                  }}>
                    {order.status === 'ready' ? '🍔 READY' : '🚶 DELIVERING'}
                  </span>
                </div>

                <div style={{ borderTop: '1px solid #334155', padding: '10px 0', marginBottom: 10 }}>
                  {order.items?.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: 14 }}>
                      <span>{item.item_name}</span>
                      <span style={{ color: '#94a3b8' }}>×{item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  {order.status === 'ready' && (
                    <button
                      onClick={() => updateStatus(order.id, 'delivered')}
                      style={{
                        flex: 1, padding: '14px', border: 'none', borderRadius: 8, cursor: 'pointer',
                        background: '#22C55E', color: 'white', fontWeight: 700, fontSize: 15,
                        fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        boxShadow: '0 4px 12px #22C55E40',
                      }}
                    >
                      🚶 Deliver to Table
                    </button>
                  )}
                  {order.status === 'delivered' && (
                    <button
                      onClick={() => updateStatus(order.id, 'completed')}
                      style={{
                        flex: 1, padding: '14px', border: 'none', borderRadius: 8, cursor: 'pointer',
                        background: '#8B5CF6', color: 'white', fontWeight: 700, fontSize: 15,
                        fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}
                    >
                      <CheckCircle size={18} /> Complete Order
                    </button>
                  )}
                  <button
                    onClick={() => updateStatus(order.id, order.status === 'ready' ? 'completed' : 'completed')}
                    style={{
                      padding: '14px 20px', border: '1px solid #475569', borderRadius: 8, cursor: 'pointer',
                      background: 'transparent', color: '#94a3b8', fontWeight: 600, fontSize: 13,
                      fontFamily: 'inherit', whiteSpace: 'nowrap',
                    }}
                  >
                    Skip →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
