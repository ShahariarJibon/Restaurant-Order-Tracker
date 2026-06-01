import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getSelectedCurrency, fetchRates, formatPrice } from '../utils/currency';
import { CreditCard, CheckCircle, XCircle, Upload, Phone, ArrowLeft } from '../components/Icons';

const METHODS = ['bKash', 'Nagad', 'Rocket'];

export default function CustomerPayment() {
  const { restaurantId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tableId = searchParams.get('table');

  const [restaurant, setRestaurant] = useState(null);
  const [cart, setCart] = useState([]);
  const [rates, setRates] = useState(null);
  const [currency, setCurrency] = useState(getSelectedCurrency());
  const [method, setMethod] = useState('bKash');
  const [trxId, setTrxId] = useState('');
  const [phone, setPhone] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRates().then(setRates);
    const saved = localStorage.getItem('payment_cart');
    if (saved) {
      try { setCart(JSON.parse(saved)); } catch { navigate(`/menu/${restaurantId}?table=${tableId || ''}`); }
    } else {
      navigate(`/menu/${restaurantId}?table=${tableId || ''}`);
    }
    if (restaurantId) {
      axios.get(`/api/menu/public/${restaurantId}`)
        .then(r => { setRestaurant(r.data.restaurant); setCurrency(r.data.restaurant?.currency || 'BDT'); })
        .catch(() => navigate(`/menu/${restaurantId}?table=${tableId || ''}`))
        .finally(() => setLoading(false));
    }
  }, [restaurantId]);

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const getQr = () => {
    if (!restaurant) return '';
    switch (method) {
      case 'bKash': return restaurant.payment_qr_bkash || '';
      case 'Nagad': return restaurant.payment_qr_nagad || '';
      case 'Rocket': return restaurant.payment_qr_rocket || '';
      default: return '';
    }
  };

  const getPhone = () => {
    if (!restaurant) return '';
    switch (method) {
      case 'bKash': return restaurant.payment_phone_bkash || '';
      case 'Nagad': return restaurant.payment_phone_nagad || '';
      case 'Rocket': return restaurant.payment_phone_rocket || '';
      default: return '';
    }
  };

  const handleScreenshot = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setScreenshot(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!trxId.trim()) return setError('Please enter the Transaction ID');
    if (!phone.trim()) return setError('Please enter your phone number');
    setSubmitting(true);
    setError('');
    try {
      const res = await axios.post('/api/orders', {
        restaurant_id: restaurantId,
        table_id: tableId,
        customer_name: localStorage.getItem('payment_customer_name') || 'Guest',
        items: cart.map(c => ({ name: c.name, price: c.price, quantity: c.quantity })),
        payment_method: method,
        trx_id: trxId.trim(),
        payment_screenshot: screenshot || '',
        customer_phone: phone.trim(),
      });
      localStorage.removeItem('payment_cart');
      localStorage.removeItem('payment_customer_name');
      localStorage.setItem('lastOrderId', res.data.orderId);
      localStorage.setItem('lastTableId', tableId || '');
      localStorage.setItem('lastRestaurantId', restaurantId);
      navigate(`/order-confirmation/${res.data.orderId}?table=${tableId || ''}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to place order. Try again.');
      setSubmitting(false);
    }
  };

  if (loading || !restaurant) {
    return (
      <div className="mobile-app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: 'var(--gray-500)' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="mobile-app" style={{ paddingBottom: 0 }}>
      <div style={{ padding: '16px 16px 0' }}>
        <button onClick={() => navigate(`/menu/${restaurantId}?table=${tableId || ''}`)} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--gray-600)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontFamily: 'inherit' }}>
          <ArrowLeft size={18} /> Back to Menu
        </button>
      </div>

      <div style={{ padding: '0 16px' }}>
        {/* Restaurant info */}
        <div style={{ textAlign: 'center', margin: '8px 0 16px' }}>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Pay Online</h1>
          <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>{restaurant?.name || 'Restaurant'}</p>
        </div>

        {/* Order Summary */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Order Summary</h3>
          {cart.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 13 }}>
              <span>{item.name} × {item.quantity}</span>
              <span style={{ fontWeight: 600 }}>{rates ? formatPrice(item.price * item.quantity, currency, rates) : `$${(item.price * item.quantity).toFixed(2)}`}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--gray-200)', marginTop: 8, paddingTop: 8, fontWeight: 700, fontSize: 17 }}>
            <span>Total</span>
            <span style={{ color: 'var(--orange)' }}>{rates ? formatPrice(total, currency, rates) : `$${total.toFixed(2)}`}</span>
          </div>
        </div>

        {/* Payment Info */}
        <div className="card" style={{ marginBottom: 16, textAlign: 'center', padding: 20 }}>
          {getQr() ? (
            <>
              <img src={getQr()} alt={`${method} QR`} style={{ width: 200, height: 200, objectFit: 'contain', margin: '0 auto 8px' }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-600)' }}>Scan to pay via {method}</p>
            </>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>Pay via {method}</p>
          )}
          {getPhone() && (
            <div style={{ marginTop: getQr() ? 12 : 0, padding: '10px 14px', background: 'var(--gray-50)', borderRadius: 10, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Phone size={16} color="var(--orange)" />
              <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>{getPhone()}</span>
            </div>
          )}
        </div>

        {/* Payment Method */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, display: 'block' }}>Payment Method</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {METHODS.map(m => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                style={{
                  flex: 1, padding: '10px 8px', borderRadius: 10, border: `2px solid ${method === m ? 'var(--orange)' : 'var(--gray-200)'}`,
                  background: method === m ? 'var(--orange-light)' : 'var(--white)', color: method === m ? 'var(--orange)' : 'var(--gray-600)',
                  fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
              >
                <CreditCard size={18} style={{ display: 'block', margin: '0 auto 4px' }} />
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* TRX ID */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 4 }}>Transaction ID *</label>
            <input
              value={trxId}
              onChange={e => setTrxId(e.target.value)}
              placeholder="Enter your transaction ID"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '2px solid var(--gray-200)', background: 'var(--white)', color: 'var(--gray-900)', fontWeight: 600, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 4 }}>
              <Phone size={14} /> Sender Number *
            </label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              type="tel"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '2px solid var(--gray-200)', background: 'var(--white)', color: 'var(--gray-900)', fontWeight: 600, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 4 }}>
              <Upload size={14} /> Payment Screenshot (optional)
            </label>
            <label style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px', borderRadius: 10, border: '2px dashed var(--gray-300)',
              background: 'var(--gray-50)', cursor: 'pointer', fontSize: 14, color: 'var(--gray-500)',
            }}>
              <Upload size={18} />
              {screenshot ? 'Screenshot added' : 'Upload screenshot'}
              <input type="file" accept="image/*" onChange={handleScreenshot} style={{ display: 'none' }} />
            </label>
            {screenshot && (
              <div style={{ marginTop: 8, position: 'relative', display: 'inline-block' }}>
                <img src={screenshot} alt="screenshot" style={{ height: 80, borderRadius: 8, border: '1px solid var(--gray-200)' }} />
                <button onClick={() => setScreenshot(null)} style={{ position: 'absolute', top: -6, right: -6, background: '#EF4444', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
            )}
          </div>
        </div>

        {/* Warning */}
        <div style={{
          background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 10, padding: '12px 14px',
          marginBottom: 16, fontSize: 12, color: '#F57F17', display: 'flex', gap: 8, alignItems: 'flex-start'
        }}>
          <XCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>Please complete payment before submitting. Orders will be confirmed after restaurant verification.</span>
        </div>

        {/* Trust UI */}
        <div style={{ marginBottom: 16, display: 'flex', gap: 16, justifyContent: 'center', fontSize: 12, color: 'var(--gray-500)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={14} color="var(--green)" /> Restaurant verifies manually</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={14} color="var(--green)" /> Usually 10-20 min</span>
        </div>

        {error && <p style={{ color: '#DC2626', fontSize: 14, fontWeight: 600, marginBottom: 12, textAlign: 'center' }}>{error}</p>}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            width: '100%', padding: '16px', borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg, var(--orange), #FF6B35)',
            color: 'white', fontWeight: 800, fontSize: 17, cursor: submitting ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 20px rgba(255, 140, 66, 0.4)',
            opacity: submitting ? 0.7 : 1,
            fontFamily: 'inherit', marginBottom: 40,
          }}
        >
          {submitting ? 'Submitting...' : 'I Have Paid — Place Order'}
        </button>
      </div>
    </div>
  );
}
