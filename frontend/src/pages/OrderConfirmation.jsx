import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getSelectedCurrency, fetchRates, formatPrice } from '../utils/currency';
import { XCircle, CheckCircle, ChefHat, ClipboardList, RefreshCw, UtensilsCrossed, Sparkles, Clock, CreditCard, Hourglass } from '../components/Icons';

const RATING_CACHE_KEY = (tableId) => `rated_table_${tableId}`;

const STEPS = [
  { key: 'pending', label: 'Order Placed' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'done', label: 'Ready' },
];

function OrderCard({ order, rates, currency, showDone, onDone }) {
  const currentIdx = STEPS.findIndex(s => s.key === order.status);
  const orderTime = new Date(order.created_at + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const isCancelled = order.status === 'cancelled';
  const isPaymentVerification = order.payment_status === 'pending' && order.status === 'waiting_verification';
  const isPaymentRejected = order.payment_status === 'rejected' || order.status === 'payment_failed';

  const getBadge = () => {
    if (isCancelled) return { label: 'CANCELLED', bg: '#FEE2E2', color: '#DC2626' };
    if (isPaymentRejected) return { label: 'PAYMENT FAILED', bg: '#FEF2F2', color: '#DC2626' };
    if (isPaymentVerification) return { label: 'AWAITING VERIFICATION', bg: '#FFF8E1', color: '#D97706' };
    if (order.status === 'done') return { label: 'DONE', bg: 'var(--green-light)', color: 'var(--green)' };
    if (order.status === 'preparing') return { label: 'PREPARING', bg: 'var(--orange-light)', color: 'var(--orange)' };
    return { label: 'PENDING', bg: 'var(--yellow-light)', color: 'var(--yellow)' };
  };

  const badge = getBadge();

  return (
    <div style={{
      background: isCancelled || isPaymentRejected ? '#FEF2F2' : 'var(--white)',
      borderRadius: 'var(--radius)', padding: 16,
      boxShadow: 'var(--shadow-sm)', width: '100%', maxWidth: 320, marginBottom: 12,
      border: isCancelled || isPaymentRejected ? '2px solid #EF4444' : 'none',
      opacity: isCancelled || isPaymentRejected ? 0.7 : 1
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 15 }}>#{order.id.slice(0, 6).toUpperCase()}</span>
        <span style={{
          fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 12,
          background: badge.bg, color: badge.color,
        }}>
          {badge.label}
        </span>
      </div>
      {order.payment_method && (
        <div style={{ fontSize: 11, color: 'var(--gray-500)', marginBottom: 4, display: 'flex', gap: 8 }}>
          <span><CreditCard size={11} /> {order.payment_method}</span>
          {order.trx_id && <span>TRX: {order.trx_id}</span>}
        </div>
      )}
      <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 8 }}>
        {orderTime} • Table {order.table_number || '—'} • {order.customer_name || 'Guest'}
      </div>
      {isCancelled || isPaymentRejected ? (
        <div style={{ textAlign: 'center', padding: '12px 0', color: '#DC2626', fontWeight: 700, fontSize: 15 }}>
          <XCircle size={18} /> {isPaymentRejected ? 'Payment Not Verified' : 'Order Cancelled'}
        </div>
      ) : (
        <>
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
        </>
      )}
      {showDone && order.status === 'done' && !isPaymentVerification && (
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
  const navigate = useNavigate();
  const tableId = searchParams.get('table');

  const [currentOrder, setCurrentOrder] = useState(null);
  const [tableOrders, setTableOrders] = useState([]);
  const [rates, setRates] = useState(null);
  const [currency, setCurrency] = useState(getSelectedCurrency());
  const [tables, setTables] = useState([]);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 900);

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 900);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => { fetchRates().then(setRates); }, []);

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
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

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

  useEffect(() => {
    if (!currentOrder?.restaurant_id) return;
    axios.get(`/api/tables/public/${currentOrder.restaurant_id}`)
      .then(r => setTables(r.data))
      .catch(() => {});
  }, [currentOrder?.restaurant_id]);

  useEffect(() => {
    if (!tableId && currentOrder?.status === 'done') {
      const alreadyRated = ratingSubmitted || localStorage.getItem(RATING_CACHE_KEY('single'));
      if (!alreadyRated) {
        setShowRating(true);
      }
      return;
    }
    const allDone = tableOrders.length > 0 && tableOrders.every(o => o.status === 'done' || o.status === 'cancelled');
    if (allDone) {
      localStorage.removeItem('lastOrderId');
      localStorage.removeItem('lastTableId');
      localStorage.removeItem('lastRestaurantId');
      const alreadyRated = ratingSubmitted || localStorage.getItem(RATING_CACHE_KEY(tableId));
      if (!alreadyRated && tableOrders.some(o => o.status === 'done')) {
        setShowRating(true);
      }
    }
  }, [tableOrders, tableId, ratingSubmitted, currentOrder?.status]);

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
    const order = { cancelled: 0, done: 1, preparing: 2, pending: 3 };
    const pa = order[a.status] ?? 4;
    const pb = order[b.status] ?? 4;
    if (pa !== pb) return pa - pb;
    return new Date(a.created_at) - new Date(b.created_at);
  });

  const handleSubmitRating = async (star) => {
    setSubmittingRating(true);
    try {
      await axios.post('/api/ratings', {
        restaurant_id: currentOrder?.restaurant_id || tableOrders[0]?.restaurant_id,
        table_id: tableId,
        rating: star
      });
      if (tableId) localStorage.setItem(RATING_CACHE_KEY(tableId), '1');
      else localStorage.setItem(RATING_CACHE_KEY('single'), '1');
      setRatingSubmitted(true);
    } catch {}
    setShowRating(false);
    setSubmittingRating(false);
    setSelectedStar(0);
    setHoveredStar(0);
  };

  const handleDismissRating = () => {
    if (!submittingRating) {
      setShowRating(false);
      setSelectedStar(0);
      setHoveredStar(0);
    }
  };

  const activeCount = tableOrders.filter(o => o.status !== 'done' && o.status !== 'cancelled').length;
  const hasCancelled = tableOrders.some(o => o.status === 'cancelled');

  const renderPaymentInfo = (order) => {
    if (!order?.payment_status) return null;
    const isWaiting = order.payment_status === 'pending' && order.status === 'waiting_verification';
    const isRejected = order.payment_status === 'rejected' || order.status === 'payment_failed';
    const isVerified = order.payment_status === 'verified';
    return (
      <div style={{
        background: isRejected ? '#FEF2F2' : isVerified ? '#F0FDF4' : '#FFF8E1',
        border: `1px solid ${isRejected ? '#EF4444' : isVerified ? '#22C55E' : '#FFE082'}`,
        borderRadius: 'var(--radius)', padding: '14px 16px', margin: '0 -4px 16px',
        width: '100%', maxWidth: 300,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          {isRejected ? <XCircle size={20} color="#DC2626" /> : isVerified ? <CheckCircle size={20} color="#16A34A" /> : <Hourglass size={20} color="#F59E0B" />}
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: isRejected ? '#DC2626' : isVerified ? '#16A34A' : '#D97706' }}>
              {isRejected ? 'Payment Not Verified' : isVerified ? 'Payment Verified' : 'Awaiting Verification'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
              {isRejected ? 'The restaurant could not verify your payment' : isVerified ? 'Payment confirmed by restaurant' : 'Restaurant will verify your payment manually'}
            </div>
          </div>
        </div>
        {order.payment_method && (
          <div style={{ fontSize: 12, color: 'var(--gray-500)', display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4, paddingTop: 6, borderTop: '1px solid var(--gray-200)' }}>
            <span><CreditCard size={12} /> {order.payment_method}</span>
            {order.trx_id && <span>TRX: {order.trx_id}</span>}
          </div>
        )}
      </div>
    );
  };

  if (currentOrder) {
    const isCancelled = currentOrder.status === 'cancelled';
    const isPaymentRejected = currentOrder.payment_status === 'rejected' || currentOrder.status === 'payment_failed';
    const currentIdx = STEPS.findIndex(s => s.key === currentOrder.status);
    const orderTime = new Date(currentOrder.created_at + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return (
      <div className="mobile-app" style={{ paddingBottom: 0 }}>
        <div className="status-screen">
          <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: 2, marginBottom: 8 }}>ORDER PLACED</h1>
          <div className={`status-icon ${currentOrder.status === 'done' && !isCancelled ? 'placed' : ''}`} style={{ background: isCancelled ? '#FEE2E2' : currentOrder.status === 'done' ? 'var(--green-light)' : 'var(--orange-light)' }}>
            {isCancelled ? <XCircle size={36} /> : currentOrder.status === 'done' ? <CheckCircle size={36} /> : currentOrder.status === 'preparing' ? <ChefHat size={36} /> : <ClipboardList size={36} />}
          </div>
          {isCancelled ? (
            <>
              <h1 style={{ color: '#DC2626' }}>Order Cancelled</h1>
              <p className="sub">This order has been cancelled by the restaurant.</p>
            </>
          ) : (
            <>
              <h1>{currentOrder.status === 'done' ? 'Enjoy Your Meal!' : currentOrder.status === 'preparing' ? 'Being Prepared' : 'Order Placed!'}</h1>
              <p className="sub">
                {currentOrder.status === 'done' ? 'Your order is ready. Bon appétit!' : currentOrder.status === 'preparing' ? 'The kitchen is working on your order' : 'Your order has been sent to the kitchen'}
              </p>
            </>
          )}
          <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 4 }}>Order</p>
          <p style={{ fontSize: 20, fontWeight: 800, letterSpacing: 1, marginBottom: 16 }}>#{currentOrder.id.slice(0, 8).toUpperCase()}</p>
          {renderPaymentInfo(currentOrder)}
          {!isCancelled && !isPaymentRejected && (
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
          )}
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
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
            {tableId && (
              <button onClick={() => setShowTablePicker(true)} className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <RefreshCw size={16} /> Change Table
              </button>
            )}
            <button onClick={() => navigate(`/menu/${currentOrder?.restaurant_id}?table=${tableId || ''}`)} className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <UtensilsCrossed size={16} /> Order More
            </button>
          </div>
          <p style={{ marginTop: 24, fontSize: 13, color: 'var(--gray-400)' }}>Thank you for your order!</p>
        </div>

        {showRating && (
          <div className="modal-overlay" onClick={handleDismissRating}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{
              maxWidth: 320, textAlign: 'center', padding: '32px 24px'
            }}>
              <h2 style={{ fontSize: 20, marginBottom: 4 }}>Rate Your Experience</h2>
              <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 20 }}>
                How was your meal today?
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => { if (!submittingRating) { setSelectedStar(star); handleSubmitRating(star); } }}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    style={{
                      background: 'none', border: 'none', fontSize: 36, cursor: submittingRating ? 'default' : 'pointer',
                      color: (hoveredStar || selectedStar) >= star ? '#FFC107' : 'var(--gray-300)',
                      transition: 'color 0.15s', padding: '0 2px'
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
              {submittingRating && <p style={{ fontSize: 13, color: 'var(--gray-400)' }}>Submitting...</p>}
              <p style={{ fontSize: 12, color: 'var(--gray-400)' }}>Tap a star to rate, or tap outside to dismiss</p>
            </div>
          </div>
        )}
      </div>
    );
  }

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

  const renderRatingModal = () => (
    <div className="modal-overlay" onClick={handleDismissRating}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{
        maxWidth: 400, textAlign: 'center', padding: '40px 32px'
      }}>
        <div style={{ fontSize: 48, marginBottom: 12, animation: 'pulse 1.5s ease-in-out infinite' }}>
          <Sparkles size={48} style={{ color: 'var(--yellow)' }} />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Rate Your Experience</h2>
        <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 24 }}>
          How was your meal today?
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 24 }}>
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onClick={() => { if (!submittingRating) { setSelectedStar(star); handleSubmitRating(star); } }}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              style={{
                background: 'none', border: 'none', fontSize: 42, cursor: submittingRating ? 'default' : 'pointer',
                color: (hoveredStar || selectedStar) >= star ? '#FFC107' : 'var(--gray-300)',
                transition: 'color 0.15s, transform 0.15s',
                transform: hoveredStar >= star ? 'scale(1.2)' : 'scale(1)',
                padding: '0 2px', lineHeight: 1
              }}
            >
              ★
            </button>
          ))}
        </div>
        {submittingRating && <p style={{ fontSize: 13, color: 'var(--gray-400)' }}>Submitting...</p>}
        <p style={{ fontSize: 12, color: 'var(--gray-400)' }}>Tap a star to rate, or tap outside to dismiss</p>
      </div>
    </div>
  );

  const renderTablePicker = () => (
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
  );

  const StatusHero = ({ order, isCancelled }) => (
    <div className="cd-confirm-hero">
      <div className={`cd-confirm-icon ${order.status === 'done' && !isCancelled ? 'done' : order.status === 'preparing' ? 'preparing' : 'pending'}`}>
        {isCancelled ? <XCircle size={40} /> : order.status === 'done' ? <CheckCircle size={40} /> : order.status === 'preparing' ? <ChefHat size={40} /> : <ClipboardList size={40} />}
      </div>
      <h1 className="cd-confirm-title">
        {isCancelled ? 'Order Cancelled' : order.status === 'done' ? 'Enjoy Your Meal!' : order.status === 'preparing' ? 'Being Prepared' : 'Order Placed!'}
      </h1>
      <p className="cd-confirm-sub">
        {isCancelled ? 'This order has been cancelled by the restaurant.' : order.status === 'done' ? 'Your order is ready. Bon appétit!' : order.status === 'preparing' ? 'The kitchen is working on your order' : 'Your order has been sent to the kitchen'}
      </p>
      <div className="cd-confirm-id">#{order.id.slice(0, 8).toUpperCase()}</div>
    </div>
  );

  const HorizontalSteps = ({ order, isCancelled }) => {
    if (isCancelled) return null;
    const currentIdx = STEPS.findIndex(s => s.key === order.status);
    return (
      <div className="cd-confirm-steps">
        {STEPS.map((step, i) => {
          const state = i < currentIdx ? 'completed' : i === currentIdx ? 'active' : '';
          return (
            <div key={step.key} className={`cd-step ${state}`}>
              <div className="cd-step-dot">{i < currentIdx ? '✓' : i + 1}</div>
              <div className="cd-step-label">{step.label}</div>
              {i < STEPS.length - 1 && <div className={`cd-step-line ${i < currentIdx ? 'filled' : ''}`} />}
            </div>
          );
        })}
      </div>
    );
  };

  // ---- DESKTOP RENDER ----
  if (isDesktop && !(!tableId && currentOrder)) {
    const isSingleCancelled = currentOrder?.status === 'cancelled';
    return (
      <div className="customer-desktop" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="cd-confirm-wrapper">
          {currentOrder && (
            <>
              <StatusHero order={currentOrder} isCancelled={isSingleCancelled} />
              <HorizontalSteps order={currentOrder} isCancelled={isSingleCancelled} />
            </>
          )}

          {tableOrders.length > 0 && (
            <div className="cd-confirm-order-grid">
              {displayedOrders.map(order => {
                const canc = order.status === 'cancelled';
                const idx = STEPS.findIndex(s => s.key === order.status);
                const time = new Date(order.created_at + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={order.id} className={`cd-confirm-order-card ${canc ? 'cancelled' : ''}`}>
                    <div className="cd-confirm-order-header">
                      <span className="cd-confirm-order-id">#{order.id.slice(0, 6).toUpperCase()}</span>
                      <span className={`badge badge-${order.payment_status === 'pending' ? 'pending' : order.status}`}>
                        {order.payment_status === 'pending' ? 'AWAITING PAYMENT' : order.status.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 8, marginTop: 4 }}>
                      {time} • Table {order.table_number || '—'} • {order.customer_name || 'Guest'}
                    </div>
                    {order.items?.map(item => (
                      <div key={item.id} className="cd-confirm-order-item">
                        <span>{item.item_name} × {item.quantity}</span>
                        <span>{rates ? formatPrice(item.price * item.quantity, currency, rates) : `$${(item.price * item.quantity).toFixed(2)}`}</span>
                      </div>
                    ))}
                    <div className="cd-confirm-order-total">
                      <span>Total</span>
                      <span>{rates ? formatPrice(parseFloat(order.total), currency, rates) : `$${parseFloat(order.total).toFixed(2)}`}</span>
                    </div>
                    {!canc && (
                      <div className="cd-confirm-mini-steps">
                        {STEPS.map((step, i) => (
                          <div key={step.key} className={`cd-mini-step ${i <= idx ? 'active' : ''}`} />
                        ))}
                      </div>
                    )}
                    {canc && (
                      <div style={{ color: '#DC2626', fontWeight: 600, fontSize: 13, marginTop: 8 }}>
                        <XCircle size={14} /> Cancelled
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
            {tableId && (
              <button onClick={() => setShowTablePicker(true)} className="btn btn-outline btn-sm">
                <RefreshCw size={16} /> Change Table
              </button>
            )}
            <button onClick={() => navigate(`/menu/${currentOrder?.restaurant_id}?table=${tableId || ''}`)} className="btn btn-outline btn-sm">
              <UtensilsCrossed size={16} /> Order More
            </button>
          </div>
        </div>

        {showRating && renderRatingModal()}
        {showTablePicker && renderTablePicker()}
      </div>
    );
  }

  // ---- SINGLE ORDER DESKTOP ----
  if (isDesktop && currentOrder && !tableId) {
    const isCancelled = currentOrder.status === 'cancelled';
    return (
      <div className="customer-desktop" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: 400, width: '100%', padding: 20 }}>
          <StatusHero order={currentOrder} isCancelled={isCancelled} />
          {renderPaymentInfo(currentOrder)}
          <HorizontalSteps order={currentOrder} isCancelled={isCancelled} />
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
            <button onClick={() => navigate(`/menu/${currentOrder?.restaurant_id}?table=${tableId || ''}`)} className="btn btn-outline btn-sm">
              <UtensilsCrossed size={16} /> Order More
            </button>
          </div>
          {showRating && renderRatingModal()}
        </div>
      </div>
    );
  }

  // ---- MOBILE RENDER ----
  return (
    <div className="mobile-app" style={{ paddingBottom: 0 }}>
      <div className="status-screen" style={{ paddingTop: 24 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: 2, marginBottom: 16 }}>ORDER PLACED</h1>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
          <button
            onClick={() => setShowTablePicker(true)}
            className="btn btn-outline btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={16} /> Change Table #{currentOrder?.table_number || '—'}
          </button>
        </div>

        {activeCount === 0 && tableOrders.length > 0 && !hasCancelled && (
          <>
            <div className={`status-icon placed`} style={{ background: 'var(--green-light)' }}><CheckCircle size={36} /></div>
            <h1>Enjoy Your Meal!</h1>
            <p className="sub">All orders are ready. Bon appétit!</p>
          </>
        )}

        {hasCancelled && (
          <div style={{
            background: '#FEF2F2', border: '2px solid #EF4444', borderRadius: 'var(--radius)',
            padding: '12px 16px', marginBottom: 16, width: '100%', maxWidth: 320,
            display: 'flex', alignItems: 'center', gap: 10, color: '#DC2626', fontWeight: 700
          }}>
            <XCircle size={18} /> Some orders were cancelled by the restaurant
          </div>
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
Thank you for your order!
          </p>
        )}
      </div>

      {showRating && renderRatingModal()}
      {showTablePicker && renderTablePicker()}
    </div>
  );
}
