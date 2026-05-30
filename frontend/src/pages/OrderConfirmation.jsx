import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const STEPS = [
  { key: 'pending', label: 'Order Placed' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'done', label: 'Ready' },
];

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!orderId) return;
    const load = async () => {
      try {
        const res = await axios.get(`/api/orders/${orderId}`);
        setOrder(res.data);
      } catch {}
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  const currentIdx = order ? STEPS.findIndex(s => s.key === order.status) : 0;
  const orderTime = order ? new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className="mobile-app" style={{ paddingBottom: 0 }}>
      <div className="status-screen">
        <div className={`status-icon ${order?.status === 'done' ? 'placed' : ''}`} style={{ background: order?.status === 'done' ? 'var(--green-light)' : 'var(--orange-light)' }}>
          {order?.status === 'done' ? '✅' : order?.status === 'preparing' ? '👨‍🍳' : '📋'}
        </div>
        <h1>
          {order?.status === 'done' ? 'Enjoy Your Meal!' : order?.status === 'preparing' ? 'Being Prepared' : 'Order Placed!'}
        </h1>
        <p className="sub">
          {order?.status === 'done'
            ? 'Your order is ready. Bon appétit!'
            : order?.status === 'preparing'
            ? 'The kitchen is working on your order'
            : 'Your order has been sent to the kitchen'}
        </p>

        {order && (
          <div style={{ marginBottom: 16, textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>Order</p>
            <p style={{ fontSize: 20, fontWeight: 800, letterSpacing: 1 }}>#{order.id.slice(0, 8).toUpperCase()}</p>
          </div>
        )}

        <div className="status-steps">
          {STEPS.map((step, i) => {
            const status = i < currentIdx ? 'completed' : i === currentIdx ? 'active' : '';
            return (
              <div key={step.key} className={`status-step ${status}`}>
                <div className="step-dot">
                  {i < currentIdx ? '✓' : i + 1}
                </div>
                <div>
                  <div className="step-label">{step.label}</div>
                  {status === 'active' && order && (
                    <div className="step-time">{orderTime}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {order && (
          <div style={{
            background: 'var(--white)',
            borderRadius: 'var(--radius)',
            padding: 16,
            width: '100%',
            maxWidth: 300,
            boxShadow: 'var(--shadow-sm)',
            marginTop: 8
          }}>
            {order.items?.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 14 }}>
                <span>{item.item_name} × {item.quantity}</span>
                <span style={{ fontWeight: 600 }}>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--gray-200)', marginTop: 8, paddingTop: 8, fontWeight: 700, fontSize: 16 }}>
              <span>Total</span>
              <span style={{ color: 'var(--orange)' }}>${parseFloat(order.total).toFixed(2)}</span>
            </div>
          </div>
        )}

        <p style={{ marginTop: 24, fontSize: 13, color: 'var(--gray-400)' }}>
          Thank you for your order! 🍽️
        </p>
      </div>
    </div>
  );
}
