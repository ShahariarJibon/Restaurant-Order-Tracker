import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    const load = async () => {
      const res = await axios.get('/api/orders/admin');
      setOrders(res.data);
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (orderId, currentStatus) => {
    const flow = ['pending', 'preparing', 'done'];
    const idx = flow.indexOf(currentStatus);
    if (idx >= flow.length - 1) return;
    const next = flow[idx + 1];
    await axios.put(`/api/orders/${orderId}/status`, { status: next });
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: next } : o));
  };

  const deleteOrder = async (orderId) => {
    await axios.delete(`/api/orders/${orderId}`);
    setOrders(prev => prev.filter(o => o.id !== orderId));
  };

  const deleteAllDone = async () => {
    await axios.delete('/api/orders/done/all');
    setOrders(prev => prev.filter(o => o.status !== 'done'));
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const counts = {
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    done: orders.filter(o => o.status === 'done').length,
  };

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2>Orders</h2>
        <p>{orders.length} total</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto' }}>
        {[
          { key: 'pending', label: `Pending (${counts.pending})`, color: 'var(--yellow)' },
          { key: 'preparing', label: `Preparing (${counts.preparing})`, color: 'var(--orange)' },
          { key: 'done', label: `Done (${counts.done})`, color: 'var(--green)' },
        ].map(f => (
          <button
            key={f.key}
            className={`btn btn-sm ${filter === f.key ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter(f.key)}
            style={filter === f.key && f.color ? { background: f.color, borderColor: f.color } : {}}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filter === 'done' && counts.done > 0 && (
        <button
          className="btn btn-danger btn-sm"
          style={{ marginBottom: 12, width: '100%' }}
          onClick={deleteAllDone}
        >
          🗑️ Delete All Done Orders
        </button>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No {filter} orders</h3>
          <p>Orders appear here when customers place them</p>
        </div>
      ) : (
        <div className="order-list">
          {filtered.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-card-top">
                <div>
                  <div className="order-card-customer">{order.customer_name || 'Guest'}</div>
                  <div className="order-card-table">
                    Table {order.table_number || '—'} • {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <span className={`badge badge-${order.status}`}>{order.status}</span>
              </div>
              {order.items && order.items.length > 0 && (
                <div className="order-card-items">
                  {order.items.map(item => (
                    <span key={item.id}>{item.item_name} ×{item.quantity}</span>
                  ))}
                </div>
              )}
              <div className="order-card-bottom">
                <div className="order-card-total">${parseFloat(order.total).toFixed(2)}</div>
                <div className="order-card-actions">
                  {order.status === 'pending' && (
                    <button className="btn btn-primary btn-sm" onClick={() => updateStatus(order.id, order.status)}>
                      Accept
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button className="btn btn-sm" style={{ background: 'var(--green)', color: 'white' }} onClick={() => updateStatus(order.id, order.status)}>
                      Mark Done
                    </button>
                  )}
                  {order.status === 'done' && (
                    <button className="btn btn-sm btn-danger" onClick={() => deleteOrder(order.id)}>
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
