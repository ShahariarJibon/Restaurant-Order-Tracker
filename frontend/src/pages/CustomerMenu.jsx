import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getSelectedCurrency, fetchRates, convertPrice, formatPrice } from '../utils/currency';

function CartPanel({ cart, setCart, customerName, setCustomerName, onPlaceOrder, placing, onClose, rates, currency }) {
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
      </div>
    </>
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
  const [customerName, setCustomerName] = useState('');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [offline, setOffline] = useState(!navigator.onLine);
  const [rates, setRates] = useState(null);
  const [currency, setCurrency] = useState(getSelectedCurrency());

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
      navigate(`/order-confirmation/${res.data.orderId}?table=${tableId || ''}`);
    } catch {
      setError('Failed to place order. Try again.');
      setPlacing(false);
    }
  };

  if (error === 'Restaurant not found') {
    return (
      <div className="status-screen">
        <div className="status-icon placed" style={{ fontSize: 40 }}>🍽️</div>
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

  return (
    <div className="mobile-app">
      {offline && (
        <div className="offline-banner">
          📡 Offline mode — will sync automatically
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
              {item.image ? <img src={item.image} alt={item.name} /> : '🍽️'}
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
          <div className="empty-icon">🍽️</div>
          <h3>No items yet</h3>
          <p>Check back soon for new menu items</p>
        </div>
      )}

      {cartCount > 0 && (
        <button className="floating-cart" onClick={() => setShowCart(true)}>
          🛒
          <span className="floating-cart-badge">{cartCount}</span>
        </button>
      )}
      {cartCount === 0 && localStorage.getItem('lastOrderId') && localStorage.getItem('lastRestaurantId') === restaurantId && (
        <button className="floating-cart" onClick={() => navigate(`/order-confirmation/${localStorage.getItem('lastOrderId')}?table=${localStorage.getItem('lastTableId') || ''}`)}>
          📋
          <span style={{ fontSize: 10, marginTop: 2 }}>Track</span>
        </button>
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
        />
      )}
    </div>
  );
}
