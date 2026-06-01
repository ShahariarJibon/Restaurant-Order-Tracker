import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getSelectedCurrency, fetchRates, convertPrice, formatPrice } from '../utils/currency';
import { UtensilsCrossed, WifiOff, ShoppingCart, ClipboardList, CheckCircle, Sparkles, MessageSquare } from '../components/Icons';
import CustomerDesktopLayout from '../components/CustomerDesktopLayout';

function CartPanel({ cart, setCart, customerName, setCustomerName, onPlaceOrder, placing, onClose, rates, currency, isPro, restaurantId, tableId }) {
  const updateQty = (id, delta) => {
    setCart(prev => {
      const next = prev.map(c => c.id === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c);
      return next.filter(c => c.quantity > 0);
    });
  };

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <>
      <div className="cart-overlay" onClick={onClose} />
      <div className="cart-panel">
        <div className="cart-panel-handle" />
        <h2>Your Order</h2>
        {cart.map(item => (
          <div key={item.id} className="cart-item">
            <div className="cart-item-info">
              <div className="cart-item-name">{item.name}</div>
              <div className="cart-item-price">{rates ? formatPrice(item.price, currency, rates) : `$${parseFloat(item.price).toFixed(2)}`}</div>
            </div>
            <div className="cart-qty">
              <button onClick={() => updateQty(item.id, -1)}>−</button>
              <span>{item.quantity}</span>
              <button onClick={() => updateQty(item.id, 1)}>+</button>
            </div>
          </div>
        ))}
        <div className="cart-name-input">
          <input
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            placeholder="Your name (optional)"
          />
        </div>
        <div className="cart-total-row">
          <span>Total</span>
          <span>{rates ? formatPrice(total, currency, rates) : `$${total.toFixed(2)}`}</span>
        </div>
        <button
          className="btn btn-primary btn-lg"
          style={{ width: '100%', marginTop: 4 }}
          onClick={onPlaceOrder}
          disabled={placing}
        >
          {placing ? 'Placing Order...' : 'Place Order'}
        </button>
        {isPro && (
          <button
            onClick={() => {
              localStorage.setItem('payment_cart', JSON.stringify(cart));
              localStorage.setItem('payment_customer_name', customerName || 'Guest');
              onClose();
              window.location.href = `/payment/${restaurantId}?table=${tableId || ''}`;
            }}
            style={{
              width: '100%', padding: '16px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, var(--orange), #FF6B35)',
              color: 'white', fontWeight: 800, fontSize: 16, cursor: 'pointer',
              boxShadow: '0 0 20px rgba(255, 140, 66, 0.5), 0 4px 15px rgba(255, 140, 66, 0.3)',
              fontFamily: 'inherit', marginTop: 8,
              animation: 'pulse-glow 2s ease-in-out infinite',
            }}
          >
            Pay Online & Order
          </button>
        )}
      </div>
    </>
  );
}

function DesktopPlaceOrderModal({ cart, customerName, setCustomerName, onPlaceOrder, placing, onClose, rates, currency, isPro, restaurantId, tableId }) {
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <h2>Confirm Order</h2>
        {cart.map(item => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-100)', fontSize: 14 }}>
            <span>{item.name} × {item.quantity}</span>
            <span style={{ fontWeight: 600 }}>{rates ? formatPrice(item.price * item.quantity, currency, rates) : `$${(item.price * item.quantity).toFixed(2)}`}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontWeight: 700, fontSize: 18 }}>
          <span>Total</span>
          <span style={{ color: 'var(--orange)' }}>{rates ? formatPrice(total, currency, rates) : `$${total.toFixed(2)}`}</span>
        </div>
        <div className="cart-name-input" style={{ marginTop: 8 }}>
          <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Your name (optional)" />
        </div>
        <div className="modal-actions" style={{ marginTop: 16 }}>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onPlaceOrder} disabled={placing} style={{ flex: 1 }}>
            {placing ? 'Placing...' : 'Place Order'}
          </button>
        </div>
        {isPro && (
          <button
            onClick={() => {
              localStorage.setItem('payment_cart', JSON.stringify(cart));
              localStorage.setItem('payment_customer_name', customerName || 'Guest');
              onClose();
              window.location.href = `/payment/${restaurantId}?table=${tableId || ''}`;
            }}
            style={{
              width: '100%', padding: '14px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, var(--orange), #FF6B35)',
              color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer',
              boxShadow: '0 0 20px rgba(255, 140, 66, 0.5), 0 4px 15px rgba(255, 140, 66, 0.3)',
              fontFamily: 'inherit', marginTop: 10,
              animation: 'pulse-glow 2s ease-in-out infinite',
            }}
          >
            Pay Online & Order
          </button>
        )}
      </div>
    </div>
  );
}

export default function CustomerMenu() {
  const { restaurantId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tableId = searchParams.get('table');

  const [data, setData] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showDesktopOrder, setShowDesktopOrder] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [offline, setOffline] = useState(!navigator.onLine);
  const [rates, setRates] = useState(null);
  const [currency, setCurrency] = useState(getSelectedCurrency());
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 900);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackName, setFeedbackName] = useState(localStorage.getItem('feedback_name') || '');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 900);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => { fetchRates().then(setRates); }, []);

  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (restaurantId) {
      axios.get(`/api/menu/public/${restaurantId}`)
        .then(r => {
          setData(r.data);
          if (r.data.restaurant?.currency) {
            setCurrency(r.data.restaurant.currency);
          }
        })
        .catch(() => setError('Restaurant not found'));
    }
  }, [restaurantId]);

  useEffect(() => {
    const handler = (e) => {
      const { id, delta } = e.detail;
      updateCartQty(id, delta);
    };
    window.addEventListener('cart-update-qty', handler);
    return () => window.removeEventListener('cart-update-qty', handler);
  }, []);

  const updateCartQty = useCallback((id, delta) => {
    setCart(prev => {
      const next = prev.map(c => c.id === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c);
      return next.filter(c => c.quantity > 0);
    });
  }, []);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      return existing
        ? prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
        : [...prev, { ...item, quantity: 1 }];
    });
  };

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    if (offline) {
      setError('You are offline. Please try again when connected.');
      return;
    }
    setPlacing(true);
    try {
      const res = await axios.post('/api/orders', {
        restaurant_id: restaurantId,
        table_id: tableId,
        customer_name: customerName || 'Guest',
        items: cart.map(c => ({ name: c.name, price: c.price, quantity: c.quantity }))
      });
      localStorage.setItem('lastOrderId', res.data.orderId);
      localStorage.setItem('lastTableId', tableId || '');
      localStorage.setItem('lastRestaurantId', restaurantId);
      setCart([]);
      setShowCart(false);
      setShowDesktopOrder(false);
      navigate(`/order-confirmation/${res.data.orderId}?table=${tableId || ''}`);
    } catch {
      setError('Failed to place order. Try again.');
      setPlacing(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackMessage.trim()) return;
    setSubmittingFeedback(true);
    try {
      await axios.post('/api/feedback', {
        restaurant_id: restaurantId,
        customer_name: feedbackName.trim() || 'Anonymous',
        message: feedbackMessage.trim(),
      });
      localStorage.setItem('feedback_name', feedbackName);
      setFeedbackSubmitted(true);
    } catch {}
    setSubmittingFeedback(false);
  };

  if (error === 'Restaurant not found') {
    return (
      <div className="status-screen">
        <div className="status-icon placed"><UtensilsCrossed size={40} /></div>
        <h1>Restaurant Not Found</h1>
        <p className="sub">The menu you're looking for doesn't exist.</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="status-screen">
        <p style={{ color: 'var(--gray-500)' }}>Loading menu...</p>
      </div>
    );
  }

  const filteredItems = activeCategory === 'all'
    ? data.items
    : data.items.filter(item => item.category_id === activeCategory);

  const renderMenuItems = () => (
    <>
      {filteredItems.map(item => (
        <div key={item.id} className={`cd-food-card ${isDesktop ? '' : 'food-card'}`} onClick={() => addToCart(item)}>
          <div className="cd-food-card-img">
            {item.image ? <img src={item.image} alt={item.name} /> : <UtensilsCrossed size={24} />}
          </div>
          <div className="cd-food-card-body">
            <div className="cd-food-card-name">{item.name}</div>
            {item.description && <div className="cd-food-card-desc">{item.description}</div>}
            <div className="cd-food-card-bottom">
              <span className="cd-food-card-price">{rates ? formatPrice(parseFloat(item.price), currency, rates) : `$${parseFloat(item.price).toFixed(2)}`}</span>
              <button className="cd-food-card-add" onClick={e => { e.stopPropagation(); addToCart(item); }}>
                +
              </button>
            </div>
          </div>
        </div>
      ))}
      {filteredItems.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon"><UtensilsCrossed size={40} /></div>
          <h3>No items yet</h3>
          <p>Check back soon for new menu items</p>
        </div>
      )}
    </>
  );

  const isPremiumDesktop = isDesktop && data?.restaurant?.plan === 'pro';

  if (isPremiumDesktop) {
    return (
      <>
        {offline && (
          <div className="offline-banner" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999 }}>
            <WifiOff size={16} /> Offline mode — will sync automatically
          </div>
        )}
        <CustomerDesktopLayout
          restaurant={data.restaurant}
          tableId={tableId}
          categories={data.categories || []}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          cart={cart}
          cartCount={cartCount}
          onCartToggle={() => setShowDesktopOrder(true)}
        >
          <div className="cd-food-grid">
            {renderMenuItems()}
          </div>
        </CustomerDesktopLayout>
        {showDesktopOrder && (
          <DesktopPlaceOrderModal
            cart={cart}
            customerName={customerName}
            setCustomerName={setCustomerName}
            onPlaceOrder={handlePlaceOrder}
            placing={placing}
            onClose={() => setShowDesktopOrder(false)}
            rates={rates}
            currency={currency}
            isPro={data?.restaurant?.plan === 'pro'}
            restaurantId={restaurantId}
            tableId={tableId}
          />
        )}
      </>
    );
  }

  return (
    <div className="mobile-app">
      {offline && (
        <div className="offline-banner">
          <WifiOff size={16} /> Offline mode — will sync automatically
        </div>
      )}

      <div className="top-bar">
        <div className="top-bar-left" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {data.restaurant?.logo && (
            <img src={data.restaurant.logo} alt="logo" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
          )}
          <div>
            <h1 style={{ fontSize: 18 }}>{data.restaurant?.name || 'Restaurant'}</h1>
            <p>Table {tableId ? `#${tableId.slice(0, 4)}` : '—'}</p>
          </div>
        </div>
      </div>

      <div className="category-chips">
        <button
          className={`chip ${activeCategory === 'all' ? 'active' : ''}`}
          onClick={() => setActiveCategory('all')}
        >
          All
        </button>
        {data.categories.map(cat => (
          <button
            key={cat.id}
            className={`chip ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="food-grid">
        {filteredItems.map(item => (
          <div key={item.id} className="food-card" onClick={() => addToCart(item)}>
            <div className="food-card-img">
              {item.image ? <img src={item.image} alt={item.name} /> : <UtensilsCrossed size={24} />}
            </div>
            <div className="food-card-body">
              <div className="food-card-name">{item.name}</div>
              {item.description && <div className="food-card-desc">{item.description}</div>}
              <div className="food-card-bottom">
                <span className="food-card-price">{rates ? formatPrice(parseFloat(item.price), currency, rates) : `$${parseFloat(item.price).toFixed(2)}`}</span>
                <button
                  className="food-card-add"
                  onClick={e => { e.stopPropagation(); addToCart(item); }}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon"><UtensilsCrossed size={40} /></div>
          <h3>No items yet</h3>
          <p>Check back soon for new menu items</p>
        </div>
      )}

      {cartCount > 0 && (
        <button className="floating-cart" onClick={() => setShowCart(true)}>
          <ShoppingCart size={24} />
          <span className="floating-cart-badge">{cartCount}</span>
        </button>
      )}
      {cartCount === 0 && localStorage.getItem('lastOrderId') && localStorage.getItem('lastRestaurantId') === restaurantId && (
        <button className="floating-cart" onClick={() => navigate(`/order-confirmation/${localStorage.getItem('lastOrderId')}?table=${localStorage.getItem('lastTableId') || ''}`)}>
          <ClipboardList size={24} />
          <span style={{ fontSize: 10, marginTop: 2 }}>Track</span>
        </button>
      )}

      <button
        onClick={() => { setShowFeedback(true); setFeedbackSubmitted(false); }}
        style={{
          position: 'fixed', bottom: cartCount > 0 ? 80 : 90, right: 20, zIndex: 999,
          background: 'var(--orange)', color: 'white', border: 'none', borderRadius: '50%',
          width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
        }}
        title="Send Feedback"
      >
        <MessageSquare size={22} />
      </button>

      {showFeedback && (
        <div className="modal-overlay" onClick={() => setShowFeedback(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380, paddingTop: 28 }}>
            <h2 style={{ fontSize: 18, marginBottom: 4 }}>Send Feedback</h2>
            <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 16 }}>
              Share your thoughts about the food and service.
            </p>
            {feedbackSubmitted ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <MessageSquare size={40} style={{ color: 'var(--green)', marginBottom: 12 }} />
                <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Thank You!</p>
                <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 16 }}>Your feedback has been submitted.</p>
                <button className="btn btn-outline" onClick={() => setShowFeedback(false)}>Close</button>
              </div>
            ) : (
              <>
                <input
                  value={feedbackName}
                  onChange={e => setFeedbackName(e.target.value)}
                  placeholder="Your name (optional)"
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8, border: '2px solid var(--gray-200)',
                    background: 'var(--white)', color: 'var(--gray-900)', fontSize: 14,
                    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 10,
                  }}
                />
                <textarea
                  value={feedbackMessage}
                  onChange={e => setFeedbackMessage(e.target.value)}
                  placeholder="Write your feedback..."
                  rows={4}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8, border: '2px solid var(--gray-200)',
                    background: 'var(--white)', color: 'var(--gray-900)', fontSize: 14,
                    fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                  }}
                />
                <div className="modal-actions" style={{ marginTop: 16 }}>
                  <button className="btn btn-outline" onClick={() => setShowFeedback(false)}>Cancel</button>
                  <button
                    className="btn btn-primary"
                    onClick={handleSubmitFeedback}
                    disabled={submittingFeedback || !feedbackMessage.trim()}
                    style={{ flex: 1 }}
                  >
                    {submittingFeedback ? 'Sending...' : 'Send Feedback'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

        {showCart && (
        <CartPanel
          cart={cart}
          setCart={setCart}
          customerName={customerName}
          setCustomerName={setCustomerName}
          onPlaceOrder={handlePlaceOrder}
          placing={placing}
          onClose={() => setShowCart(false)}
          rates={rates}
          currency={currency}
          isPro={data?.restaurant?.plan === 'pro'}
          restaurantId={restaurantId}
          tableId={tableId}
        />
      )}
    </div>
  );
}
