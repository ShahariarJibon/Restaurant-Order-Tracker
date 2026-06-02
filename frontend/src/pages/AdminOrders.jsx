import { useState, useEffect } from 'react';
import axios from 'axios';
import { getSelectedCurrency, fetchRates, formatPrice } from '../utils/currency';
import { cacheData, getCachedData } from '../utils/dataCache';
import { ClipboardList, Trash2, CreditCard, CheckCircle, XCircle, Phone, Download } from '../components/Icons';

const STATUS_GROUPS = [
  { key: 'new', label: 'New Orders', statuses: ['pending', 'waiting_verification'], color: 'var(--yellow)' },
  { key: 'approved', label: 'Approved', statuses: ['approved'], color: 'var(--green)' },
  { key: 'kitchen', label: 'Cooking', statuses: ['preparing', 'cooking', 'ready'], color: 'var(--orange)' },
  { key: 'done', label: 'Completed', statuses: ['delivered', 'completed', 'done'], color: 'var(--gray-500)' },
];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('new');
  const [rates, setRates] = useState(null);
  const currency = getSelectedCurrency();

  useEffect(() => { fetchRates().then(setRates); }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get('/api/orders/admin');
        setOrders(res.data);
        cacheData('orders', res.data);
      } catch {
        const cached = getCachedData('orders');
        if (cached) setOrders(cached);
      }
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const confirmOrder = async (orderId) => {
    await axios.put(`/api/orders/${orderId}/confirm`);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'approved' } : o));
  };

  const updateStatus = async (orderId, status) => {
    await axios.put(`/api/orders/${orderId}/status`, { status });
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  const deleteOrder = async (orderId) => {
    await axios.delete(`/api/orders/${orderId}`);
    setOrders(prev => prev.filter(o => o.id !== orderId));
  };

  const deleteAllDone = async () => {
    await axios.delete('/api/orders/done/all');
    setOrders(prev => prev.filter(o => o.status !== 'done' && o.status !== 'completed'));
  };

  const activeGroup = STATUS_GROUPS.find(g => g.key === filter) || STATUS_GROUPS[0];
  const filtered = filter === 'all' ? orders : orders.filter(o => activeGroup.statuses.includes(o.status) || (filter === 'new' && (o.status === 'waiting_verification' || o.payment_status === 'pending')));

  const counts = {};
  for (const g of STATUS_GROUPS) {
    counts[g.key] = orders.filter(o => g.statuses.includes(o.status)).length;
  }
  counts.new = orders.filter(o => o.status === 'pending' || o.status === 'waiting_verification').length;

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2>Orders</h2>
        <p>{orders.length} total</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto' }}>
        {STATUS_GROUPS.map(g => (
          <button
            key={g.key}
            className={`btn btn-sm ${filter === g.key ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter(g.key)}
            style={filter === g.key && g.color ? { background: g.color, borderColor: g.color } : {}}
          >
            {g.label} ({counts[g.key] || 0})
          </button>
        ))}
      </div>

      {filter === 'done' && counts.done > 0 && (
        <button className="btn btn-danger btn-sm" style={{ marginBottom: 12, width: '100%' }} onClick={deleteAllDone}>
          <Trash2 size={16} /> Delete All Completed Orders
        </button>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><ClipboardList size={40} /></div>
          <h3>No {filter} orders</h3>
          <p>Orders appear here when customers place them</p>
        </div>
      ) : (
        <div className="order-list">
          {filtered.map(order => {
            const isPaymentVerification = order.payment_status === 'pending' && (order.status === 'waiting_verification' || order.status === 'pending');
            const isPaymentFailed = order.status === 'payment_failed';
            const getBadgeClass = () => {
              if (isPaymentVerification) return 'badge-pending';
              if (isPaymentFailed) return 'badge-cancelled';
              return `badge-${order.status}`;
            };
            const getBadgeLabel = () => {
              if (isPaymentVerification) return 'PENDING VERIFICATION';
              if (isPaymentFailed) return 'PAYMENT FAILED';
              return order.status.toUpperCase();
            };
            return (
            <div key={order.id} className="order-card" style={{ borderLeft: isPaymentVerification ? '4px solid var(--orange)' : undefined }}>
              <div className="order-card-top">
                <div>
                  <div className="order-card-customer">{order.customer_name || 'Guest'}</div>
                  <div className="order-card-table">
                    Table {order.table_number || '—'} • {new Date(order.created_at + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <span className={`badge ${getBadgeClass()}`}>{getBadgeLabel()}</span>
              </div>
              {order.payment_method && (
                <div style={{ fontSize: 11, color: 'var(--gray-500)', marginBottom: 6, display: 'flex', gap: 10, flexWrap: 'wrap', padding: '0 2px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><CreditCard size={12} /> {order.payment_method}</span>
                  {order.trx_id && <span>TRX: {order.trx_id}</span>}
                  {order.customer_phone && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Phone size={12} /> {order.customer_phone}</span>}
                  {order.payment_screenshot && (
                    <a href={order.payment_screenshot} target="_blank" rel="noreferrer" style={{ color: 'var(--orange)', display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, textDecoration: 'none' }}>
                      <Download size={12} /> Screenshot
                    </a>
                  )}
                </div>
              )}
              {order.items && order.items.length > 0 && (
                <div className="order-card-items">
                  {order.items.map(item => (
                    <span key={item.id}>{item.item_name} ×{item.quantity}</span>
                  ))}
                </div>
              )}
              <div className="order-card-bottom">
                <div className="order-card-total">{rates ? formatPrice(parseFloat(order.total), currency, rates) : `$${parseFloat(order.total).toFixed(2)}`}</div>
                <div className="order-card-actions">
                  {isPaymentVerification && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm" style={{ background: 'var(--green)', color: 'white' }} onClick={async () => { await axios.put(`/api/orders/${order.id}/verify-payment`); setOrders(prev => prev.map(o => o.id === order.id ? { ...o, payment_status: 'verified', status: 'approved' } : o)); }}>
                        <CheckCircle size={14} /> Confirm
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={async () => { await axios.put(`/api/orders/${order.id}/reject-payment`); setOrders(prev => prev.map(o => o.id === order.id ? { ...o, payment_status: 'rejected', status: 'payment_failed' } : o)); }}>
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  )}
                  {order.status === 'pending' && !isPaymentVerification && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm" style={{ background: 'var(--green)', color: 'white' }} onClick={() => confirmOrder(order.id)}>
                        <CheckCircle size={14} /> Confirm
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={async () => { await axios.put(`/api/orders/${order.id}/status`, { status: 'cancelled' }); setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'cancelled' } : o)); }}>
                        <XCircle size={14} /> Cancel
                      </button>
                    </div>
                  )}
                  {order.status === 'approved' && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm" style={{ background: '#8B5CF6', color: 'white' }} onClick={() => updateStatus(order.id, 'preparing')}>
                        Send to Chef
                      </button>
                    </div>
                  )}
                  {(order.status === 'done' || order.status === 'completed' || order.status === 'delivered') && (
                    <button className="btn btn-sm btn-danger" onClick={() => deleteOrder(order.id)}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
