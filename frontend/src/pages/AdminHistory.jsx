import { useState, useEffect } from 'react';
import axios from 'axios';
import { getSelectedCurrency, fetchRates, formatPrice } from '../utils/currency';
import { Download, CreditCard, ShoppingCart } from '../components/Icons';

export default function AdminHistory() {
  const [orders, setOrders] = useState([]);
  const [rates, setRates] = useState(null);
  const [currency, setCurrency] = useState(getSelectedCurrency());

  useEffect(() => {
    fetchRates().then(setRates);
    const load = async () => {
      try {
        const res = await axios.get('/api/orders/admin');
        setOrders(res.data);
      } catch {}
    };
    load();
  }, []);

  const handleExport = async () => {
    try {
      const res = await axios.get('/api/orders/export/excel', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `order-history-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {}
  };

  const grouped = {};
  for (const order of orders) {
    const d = new Date(order.created_at + 'Z');
    const dateKey = d.toLocaleDateString('en-CA');
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(order);
  }

  const dateKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2>Order History</h2>
        <button className="btn btn-sm" onClick={handleExport} style={{ background: 'var(--green)', color: 'white', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Download size={16} /> Download Excel
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="card" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--gray-500)', fontSize: 13, lineHeight: 1.6 }}>
          <ShoppingCart size={32} style={{ display: 'block', margin: '0 auto 12px', color: 'var(--gray-300)' }} />
          No orders yet.
        </div>
      ) : (
        <div className="super-table-wrap" style={{ borderRadius: 12, overflow: 'hidden' }}>
          <table className="super-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Order Items</th>
                <th>Price</th>
                <th>Customer</th>
                <th>Payment</th>
                <th>Order ID</th>
                <th>Table</th>
              </tr>
            </thead>
            <tbody>
              {dateKeys.map(dateKey => {
                const dayOrders = grouped[dateKey];
                const dayTotal = dayOrders.reduce((s, o) => s + Number(o.total), 0);
                return (
                  <>
                    <tr key={dateKey} style={{ background: 'var(--orange-light)' }}>
                      <td colSpan={7} style={{ fontWeight: 700, fontSize: 14, color: 'var(--orange)', padding: '8px 12px' }}>
                        {new Date(dateKey + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </td>
                    </tr>
                    {dayOrders.map(order => {
                      const dt = new Date(order.created_at + 'Z').toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
                      const shortId = `#${order.id.slice(0, 6).toUpperCase()}`;
                      const paymentStr = order.payment_method ? `${order.payment_method}${order.trx_id ? ` (${order.trx_id})` : ''}` : '—';
                      return (
                        <tr key={order.id}>
                          <td className="super-td-muted">{dt}</td>
                          <td>
                            {order.items?.map((item, i) => (
                              <div key={item.id} style={{ fontSize: 13, lineHeight: 1.6 }}>
                                {item.item_name} × {item.quantity}
                              </div>
                            ))}
                          </td>
                          <td style={{ fontWeight: 600 }}>{rates ? formatPrice(Number(order.total), currency, rates) : `$${Number(order.total).toFixed(2)}`}</td>
                          <td className="super-td-muted">{order.customer_name || 'Guest'}</td>
                          <td style={{ fontSize: 13 }}>
                            {order.payment_method ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <CreditCard size={14} /> {paymentStr}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--gray-400)' }}>—</span>
                            )}
                          </td>
                          <td className="super-td-name" style={{ fontSize: 13 }}>{shortId}</td>
                          <td className="super-td-muted">{order.table_number || '—'}</td>
                        </tr>
                      );
                    })}
                    <tr style={{ background: '#FFF8F0' }}>
                      <td colSpan={1} style={{ fontWeight: 700, fontSize: 13, color: 'var(--orange)', padding: '6px 12px' }}>Day Summary</td>
                      <td colSpan={1} style={{ fontWeight: 600, fontSize: 13 }}>Orders: {dayOrders.length}</td>
                      <td colSpan={5} style={{ fontWeight: 700, fontSize: 13, color: 'var(--orange)' }}>
                        Revenue: {rates ? formatPrice(dayTotal, currency, rates) : `$${dayTotal.toFixed(2)}`}
                      </td>
                    </tr>
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
