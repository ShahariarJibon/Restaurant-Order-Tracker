import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { getSelectedCurrency, fetchRates, convertPrice, formatPrice } from '../utils/currency';

const STEPS = [
  { key: 'pending', label: 'Order Placed' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'done', label: 'Ready' },
];

function OrderCard({ order, rates, currency, showDone, onDone }) {
  const currentIdx = STEPS.findIndex(s => s.key === order.status);
  const orderTime = new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{
      background: 'var(--white)', borderRadius: 'var(--radius)', padding: 16,
      boxShadow: 'var(--shadow-sm)', width: '100%', maxWidth: 320, marginBottom: 12
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 15 }}>#{order.id.slice(0, 6).toUpperCase()}</span>
        <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>
          {orderTime} • Table {order.table_number || '—'}
        </span>
      </div>
      <div className="status-steps" style={{ gap: 2 }}>
        {STEPS.map((step, i) => {
          const status = i < currentIdx ? 'completed' : i === currentIdx ? 'active' : '';
          return (
            <div key={step.key} className={`status-step ${status}`} style={{ gap: 10 }}>
              <div className="step-dot" style={{ width: 26, height: 26, fontSize: 12 }}>
                {i < currentIdx ? '✓' : i + 1}
              </div>
              <div>
                <div className="step-label" style={{ fontSize: 13 }}>{step.label}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 10 }}>
        {order.items?.map(item => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: 13 }}>
            <span>{item.item_name} × {item.quantity}</span>
            <span style={{ fontWeight: 600 }}>{rates ? formatPrice(item.price * item.quantity, currency, rates) : `$${(item.price * item.quantity).toFixed(2)}`}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--gray-200)', marginTop: 8, paddingTop: 8, fontWeight: 700, fontSize: 15 }}>
        <span>Total</span>
        <span style={{ color: 'var(--orange)' }}>{rates ? formatPrice(parseFloat(order.total), currency, rates) : `$${parseFloat(order.total).toFixed(2)}`}</span>
      </div>
      {showDone && order.status === 'done' && (
        <button
          onClick={() => onDone(order.id)}
          className="btn btn-sm"
          style={{ width: '100%', marginTop: 10, background: 'var(--green)', color: 'white' }}
        >
          ✓ Done
        </button>
      )}
    </div>
  );
}

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get('table');

  const [currentOrder, setCurrentOrder] = useState(null);
  const [tableOrders, setTableOrders] = useState([]);
  const [rates, setRates] = useState(null);
  const [currency, setCurrency] = useState(getSelectedCurrency());
  const [tables, setTables] = useState([]);
  const [showTablePicker, setShowTablePicker] = useState(false);

  useEffect(() => { fetchRates().then(setRates); }, []);

  // Fetch current order
  useEffect(() => {
    if (!orderId) return;
    const load = async () => {
      try {
        const res = await axios.get(`/api/orders/${orderId}`);
        setCurrentOrder(res.data);
        if (res.data.currency) setCurrency(res.data.currency);
      } catch {}
    };
    load();
  }, [orderId]);

  // Fetch all orders for this table
  useEffect(() => {
    if (!tableId) return;
    const load = async () => {
      try {
        const res = await axios.get(`/api/orders/public/table/${tableId}`);
        setTableOrders(res.data);
      } catch {}
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [tableId]);

  // Fetch available tables when restaurant is known
  useEffect(() => {
    if (!currentOrder?.restaurant_id) return;
    axios.get(`/api/tables/public/${currentOrder.restaurant_id}`)
      .then(r => setTables(r.data))
      .catch(() => {});
  }, [currentOrder?.restaurant_id]);

  // Clear lastOrderId when all orders are done
  useEffect(() => {
    const allDone = tableOrders.length > 0 && tableOrders.every(o => o.status === 'done');
    if (allDone) {
      localStorage.removeItem('lastOrderId');
      localStorage.removeItem('lastTableId');
      localStorage.removeItem('lastRestaurantId');
    }
  }, [tableOrders]);

  const handleChangeTable = async (newTableId) => {
    try {
      const res = await axios.put(`/api/orders/${orderId}/table`, { table_id: newTableId });
      setCurrentOrder(prev => ({ ...prev, table_id: newTableId, table_number: res.data.table_number }));
      setShowTablePicker(false);
    } catch {}
  };

  const handleDone = (id) => {
    setTableOrders(prev => prev.filter(o => o.id !== id));
  };

  const sortedOrders = [...tableOrders].sort((a, b) => {
    if (a.status === 'done' && b.status !== 'done') return -1;
    if (a.status !== 'done' && b.status === 'done') return 1;
    return new Date(a.created_at) - new Date(b.created_at);
  });

  const activeCount = tableOrders.filter(o => o.status !== 'done').length;

  // Single order view (no table tracking)
  if (!tableId && currentOrder) {
    const currentIdx = STEPS.findIndex(s => s.key === currentOrder.status);
    const orderTime = new Date(currentOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return (
      <div className="mobile-app" style={{ paddingBottom: 0 }}>
        <div className="status-screen">
          <div className={`status-icon ${currentOrder.status === 'done' ? 'placed' : ''}`} style={{ background: currentOrder.status === 'done' ? 'var(--green-light)' : 'var(--orange-light)' }}>
            {currentOrder.status === 'done' ? '✅' : currentOrder.status === 'preparing' ? '👨‍🍳' : '📋'}
          </div>
          <h1>{currentOrder.status === 'done' ? 'Enjoy Your Meal!' : currentOrder.status === 'preparing' ? 'Being Prepared' : 'Order Placed!'}</h1>
          <p className="sub">
            {currentOrder.status === 'done' ? 'Your order is ready. Bon appétit!' : currentOrder.status === 'preparing' ? 'The kitchen is working on your order' : 'Your order has been sent to the kitchen'}
          </p>
          <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 4 }}>Order</p>
          <p style={{ fontSize: 20, fontWeight: 800, letterSpacing: 1, marginBottom: 16 }}>#{currentOrder.id.slice(0, 8).toUpperCase()}</p>
          <div className="status-steps">
            {STEPS.map((step, i) => {
              const status = i < currentIdx ? 'completed' : i === currentIdx ? 'active' : '';
              return (
                <div key={step.key} className={`status-step ${status}`}>
                  <div className="step-dot">{i < currentIdx ? '✓' : i + 1}</div>
                  <div>
                    <div className="step-label">{step.label}</div>
                    {status === 'active' && <div className="step-time">{orderTime}</div>}
                  </div>
                </div>
              );
            })}
          </div>
          {currentOrder.items && (
            <div style={{ background: 'var(--white)', borderRadius: 'var(--radius)', padding: 16, width: '100%', maxWidth: 300, boxShadow: 'var(--shadow-sm)', marginTop: 8 }}>
              {currentOrder.items.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 14 }}>
                  <span>{item.item_name} × {item.quantity}</span>
                  <span style={{ fontWeight: 600 }}>{rates ? formatPrice(item.price * item.quantity, currency, rates) : `$${(item.price * item.quantity).toFixed(2)}`}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--gray-200)', marginTop: 8, paddingTop: 8, fontWeight: 700, fontSize: 16 }}>
                <span>Total</span>
                <span style={{ color: 'var(--orange)' }}>{rates ? formatPrice(parseFloat(currentOrder.total), currency, rates) : `$${parseFloat(currentOrder.total).toFixed(2)}`}</span>
              </div>
            </div>
          )}
          <p style={{ marginTop: 24, fontSize: 13, color: 'var(--gray-400)' }}>Thank you for your order! 🍽️</p>
        </div>
      </div>
    );
  }

  // No orders yet
  if (!currentOrder && tableId) {
    return (
      <div className="mobile-app" style={{ paddingBottom: 0 }}>
        <div className="status-screen">
          <p style={{ color: 'var(--gray-500)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  const displayedOrders = sortedOrders.length > 0 ? sortedOrders : (currentOrder ? [currentOrder] : []);

  return (
    <div className="mobile-app" style={{ paddingBottom: 0 }}>
      <div className="status-screen" style={{ paddingTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
          <button
            onClick={() => setShowTablePicker(true)}
            className="btn btn-outline btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            🔄 Change Table #{currentOrder?.table_number || '—'}
          </button>
        </div>

        {activeCount === 0 && tableOrders.length > 0 && (
          <>
            <div className={`status-icon placed`} style={{ background: 'var(--green-light)' }}>✅</div>
            <h1>Enjoy Your Meal!</h1>
            <p className="sub">All orders are ready. Bon appétit!</p>
          </>
        )}

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {displayedOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              rates={rates}
              currency={currency}
              showDone={tableOrders.length > 1}
              onDone={handleDone}
            />
          ))}
        </div>

        {tableOrders.length > 0 && (
          <p style={{ marginTop: 20, fontSize: 13, color: 'var(--gray-400)' }}>
            Thank you for your order! 🍽️
          </p>
        )}
      </div>

      {/* Table picker modal */}
      {showTablePicker && (
        <div className="modal-overlay" onClick={() => setShowTablePicker(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 320 }}>
            <h2>Change Table</h2>
            <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 16 }}>Select your new table number</p>
            <select
              value={currentOrder?.table_id || ''}
              onChange={e => handleChangeTable(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '2px solid var(--gray-200)', background: 'var(--white)', color: 'var(--gray-900)', fontWeight: 600, fontSize: 15, fontFamily: 'inherit' }}
            >
              {tables.map(t => (
                <option key={t.id} value={t.id}>Table {t.table_number}</option>
              ))}
            </select>
            <div className="modal-actions">
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowTablePicker(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
