import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShoppingCart, UtensilsCrossed, Clock, ChefHat, Sparkles, MessageSquare } from './Icons';

function PremiumBadge() {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
      background: 'linear-gradient(135deg, #FFC107, #FF8C42)',
      color: '#fff', padding: '2px 8px', borderRadius: 4, marginLeft: 8
    }}>Premium</span>
  );
}

export default function CustomerDesktopLayout({
  restaurant, tableId, categories, activeCategory, onCategoryChange,
  cart, cartCount, children, onCartToggle, showCart, onFeedbackClick
}) {
  const [searchParams] = useSearchParams();
  const scrolled = cartCount > 0;

  return (
    <div className="customer-desktop">
      {/* === HERO === */}
      <header className="cd-hero">
        <div className="cd-hero-content">
          <div className="cd-hero-left">
            {restaurant?.logo && (
              <img src={restaurant.logo} alt="" className="cd-hero-logo" />
            )}
            <div>
              <h1 className="cd-hero-name">{restaurant?.name || 'Restaurant'}</h1>
              <p className="cd-hero-table">
                Table {tableId ? `#${tableId.slice(0, 4)}` : '—'}
                <span className="cd-hero-status">&#9679; Open</span>
              </p>
              <p className="cd-hero-tagline">Fresh ingredients, bold flavors — crafted for you.</p>
            </div>
          </div>
          <div className="cd-hero-right">
            <div className="cd-hero-illustration">
              <div className="cd-hero-orbit">
                <div className="cd-orbit-item" style={{ animationDelay: '0s' }}><ChefHat size={28} /></div>
                <div className="cd-orbit-item" style={{ animationDelay: '1s' }}><UtensilsCrossed size={22} /></div>
                <div className="cd-orbit-item" style={{ animationDelay: '2s' }}><Sparkles size={20} /></div>
              </div>
              <div className="cd-hero-badge-premium">
                <Sparkles size={14} /> Premium Dining
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* === BODY: Sidebar + Content + Cart === */}
      <div className="cd-body">
        {/* === CATEGORY SIDEBAR === */}
        <aside className="cd-sidebar">
          <nav className="cd-sidebar-nav">
            <button
              className={`cd-cat-item ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => onCategoryChange('all')}
            >
              <span className="cd-cat-dot" />
              All Items
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`cd-cat-item ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => onCategoryChange(cat.id)}
              >
                <span className="cd-cat-dot" />
                {cat.name}
              </button>
            ))}
          </nav>
          <button
            onClick={onFeedbackClick}
            style={{
              background: 'none', border: 'none', color: 'var(--gray-500)', cursor: 'pointer',
              padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12, fontWeight: 600, fontFamily: 'inherit', width: '100%',
              borderTop: '1px solid var(--gray-100)',
            }}
            title="Send Feedback"
          >
            <MessageSquare size={14} /> Feedback
          </button>
          <div className="cd-sidebar-footer">
            <div className="cd-sidebar-stats">
              <Clock size={14} />
              <span>Live</span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>v2.0 <PremiumBadge /></span>
          </div>
        </aside>

        {/* === MENU CONTENT === */}
        <main className="cd-content">
          {children}
        </main>

        {/* === CART PANEL (desktop) === */}
        <aside className={`cd-cart ${scrolled ? 'has-items' : ''}`}>
          <div className="cd-cart-header">
            <ShoppingCart size={18} />
            <span>Your Order</span>
            {cartCount > 0 && <span className="cd-cart-count">{cartCount}</span>}
          </div>

          {cart.length === 0 ? (
            <div className="cd-cart-empty">
              <ShoppingCart size={32} />
              <p>Your cart is empty</p>
              <p className="cd-cart-empty-sub">Tap + on any item to add</p>
            </div>
          ) : (
            <>
              <div className="cd-cart-items">
                {cart.map(item => (
                  <div key={item.id} className="cd-cart-item">
                    <div className="cd-cart-item-info">
                      <div className="cd-cart-item-name">{item.name}</div>
                      <div className="cd-cart-item-price">${parseFloat(item.price).toFixed(2)}</div>
                    </div>
                    <div className="cd-cart-qty">
                      <button className="cd-cart-qty-btn" onClick={() => {
                        const evt = new CustomEvent('cart-update-qty', { detail: { id: item.id, delta: -1 } });
                        window.dispatchEvent(evt);
                      }}>−</button>
                      <span>{item.quantity}</span>
                      <button className="cd-cart-qty-btn" onClick={() => {
                        const evt = new CustomEvent('cart-update-qty', { detail: { id: item.id, delta: 1 } });
                        window.dispatchEvent(evt);
                      }}>+</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="cd-cart-footer">
                <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={onCartToggle}>
                  Place Order
                </button>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
