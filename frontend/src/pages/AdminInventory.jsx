import { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Plus, Search, AlertTriangle, Trash2 } from '../components/Icons';

const UNITS = ['kg', 'pcs', 'liter'];
const LOW_STOCK_THRESHOLD = 3;

function QuantityInput({ value, onChange, onSubmit, placeholder }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      {open ? (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <input
            type="number"
            value={value}
            onChange={e => onChange(Number(e.target.value))}
            placeholder={placeholder || '0'}
            style={{
              width: 60, padding: '4px 6px', borderRadius: 6, border: '2px solid var(--gray-200)',
              background: 'var(--white)', color: 'var(--gray-900)', fontSize: 13, fontFamily: 'inherit', textAlign: 'center', outline: 'none',
            }}
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') { onSubmit(); setOpen(false); } }}
          />
          <button onClick={() => { onSubmit(); setOpen(false); }} className="btn btn-sm btn-primary" style={{ padding: '4px 8px', fontSize: 12 }}>OK</button>
          <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--gray-400)', fontSize: 14 }}>x</button>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} style={{
          padding: '4px 10px', borderRadius: 6, border: '1px dashed var(--gray-300)',
          background: 'transparent', color: 'var(--gray-500)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
        }}>{placeholder || 'Custom'}</button>
      )}
    </div>
  );
}

function InventoryCard({ item, onAdd, onReduce, onToggle, onDelete, isDesktop }) {
  const [customDelta, setCustomDelta] = useState(0);
  const unit = item.unit || 'kg';
  const isLow = item.quantity <= LOW_STOCK_THRESHOLD && item.quantity > 0;
  const isAvailable = item.status === 'available';

  return (
    <div className="card" style={{
      padding: '14px 16px', borderLeft: isAvailable ? '4px solid #22C55E' : '4px solid #EF4444',
      opacity: isAvailable ? 1 : 0.7, transition: 'all 0.2s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            {item.name}
            {isLow && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#D97706', background: '#FEF3C7', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
                <AlertTriangle size={12} /> Low
              </span>
            )}
          </div>
          <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 2 }}>
            <strong style={{ fontSize: 18, color: isAvailable ? '#22C55E' : '#EF4444' }}>{item.quantity}</strong> {unit}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className={`badge ${isAvailable ? 'badge-approved' : 'badge-cancelled'}`} style={{ fontSize: 10, padding: '2px 8px' }}>
            {isAvailable ? 'Available' : 'Unavailable'}
          </span>
          {isDesktop && (
            <button onClick={() => onDelete(item.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 4 }}>
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginTop: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--gray-500)', fontWeight: 600, marginRight: 4 }}>Add:</span>
        <button onClick={() => onAdd(item.id, 1)} className="btn btn-sm" style={quickBtnStyle}>+1 {unit}</button>
        <button onClick={() => onAdd(item.id, 5)} className="btn btn-sm" style={quickBtnStyle}>+5 {unit}</button>
        <QuantityInput value={customDelta} onChange={setCustomDelta} onSubmit={() => { if (customDelta > 0) { onAdd(item.id, customDelta); setCustomDelta(0); } }} placeholder="+Custom" />

        <span style={{ fontSize: 12, color: 'var(--gray-500)', fontWeight: 600, marginLeft: 8, marginRight: 4 }}>Use:</span>
        <button onClick={() => onReduce(item.id, 1)} className="btn btn-sm" style={{ ...quickBtnStyle, borderColor: '#FCA5A5', color: '#DC2626' }}>-1</button>
        <button onClick={() => onReduce(item.id, 5)} className="btn btn-sm" style={{ ...quickBtnStyle, borderColor: '#FCA5A5', color: '#DC2626' }}>-5</button>
        <QuantityInput value={customDelta} onChange={setCustomDelta} onSubmit={() => { if (customDelta > 0) { onReduce(item.id, customDelta); setCustomDelta(0); } }} placeholder="-Custom" />

        <button onClick={() => onToggle(item.id)} className="btn btn-sm" style={{
          marginLeft: 'auto', background: isAvailable ? '#FEE2E2' : '#DCFCE7',
          color: isAvailable ? '#DC2626' : '#16A34A', border: 'none', fontWeight: 600, fontSize: 11,
        }}>
          {isAvailable ? 'Mark Unavailable' : 'Mark Available'}
        </button>
      </div>
    </div>
  );
}

const quickBtnStyle = {
  padding: '4px 10px', fontSize: 12, fontWeight: 600, border: '1px solid #D1D5DB',
  background: 'var(--white)', cursor: 'pointer', borderRadius: 6, fontFamily: 'inherit',
};

export default function AdminInventory() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', quantity: 0, unit: 'kg' });
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 900);

  useEffect(() => {
    const r = () => setIsDesktop(window.innerWidth >= 900);
    window.addEventListener('resize', r);
    return () => window.removeEventListener('resize', r);
  }, []);

  const load = async () => {
    try {
      const res = await axios.get('/api/inventory');
      setItems(res.data);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const addItem = async () => {
    if (!newItem.name.trim()) return;
    try {
      await axios.post('/api/inventory', newItem);
      setNewItem({ name: '', quantity: 0, unit: 'kg' });
      setShowAdd(false);
      load();
    } catch {}
  };

  const addQuantity = async (id, delta) => {
    try {
      const res = await axios.put(`/api/inventory/${id}/quantity`, { delta });
      setItems(prev => prev.map(i => i.id === id ? res.data : i));
    } catch {}
  };

  const reduceQuantity = async (id, delta) => {
    await addQuantity(id, -delta);
  };

  const toggleStatus = async (id) => {
    try {
      const res = await axios.put(`/api/inventory/${id}/toggle`);
      setItems(prev => prev.map(i => i.id === id ? res.data : i));
    } catch {}
  };

  const deleteItem = async (id) => {
    if (!confirm('Delete this item?')) return;
    try {
      await axios.delete(`/api/inventory/${id}`);
      setItems(prev => prev.filter(i => i.id !== id));
      if (selectedItem?.id === id) setSelectedItem(null);
    } catch {}
  };

  const filtered = items.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filter === 'available') return i.status === 'available';
    if (filter === 'unavailable') return i.status === 'unavailable';
    return true;
  });

  const counts = {
    all: items.length,
    available: items.filter(i => i.status === 'available').length,
    unavailable: items.filter(i => i.status === 'unavailable').length,
  };

  const TABS = [
    { key: 'all', label: 'All Items', color: 'var(--orange)' },
    { key: 'available', label: 'Available', color: '#22C55E' },
    { key: 'unavailable', label: 'Unavailable', color: '#EF4444' },
  ];

  // Desktop view
  if (isDesktop) {
    return (
      <div className="tab-content">
        <div className="tab-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={22} /> Kitchen Inventory
            <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-500)', marginLeft: 4 }}>({counts.all} items)</span>
          </h2>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t.key} className={`btn btn-sm ${filter === t.key ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilter(t.key)}
              style={filter === t.key ? { background: t.color, borderColor: t.color } : {}}
            >{t.label} ({counts[t.key]})</button>
          ))}
          <div style={{ flex: 1 }} />
          <div style={{ position: 'relative', flex: '0 1 200px' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..." style={{
              width: '100%', padding: '8px 12px 8px 32px', borderRadius: 8, border: '2px solid var(--gray-200)',
              background: 'var(--white)', color: 'var(--gray-900)', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
            }} />
          </div>
          <button className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Add Item
          </button>
        </div>

        {showAdd && (
          <div className="card" style={{ padding: 16, marginBottom: 16, border: '2px solid var(--orange)' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--gray-600)' }}>Item Name</label>
                <input value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} placeholder="e.g. Onion" style={inputStyle} autoFocus />
              </div>
              <div style={{ flex: '0 1 100px' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--gray-600)' }}>Quantity</label>
                <input type="number" value={newItem.quantity} onChange={e => setNewItem({ ...newItem, quantity: Number(e.target.value) })} style={inputStyle} min="0" />
              </div>
              <div style={{ flex: '0 1 100px' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--gray-600)' }}>Unit</label>
                <select value={newItem.unit} onChange={e => setNewItem({ ...newItem, unit: e.target.value })} style={inputStyle}>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <button className="btn btn-primary" onClick={addItem} style={{ padding: '10px 20px' }}>Add</button>
              <button className="btn btn-outline" onClick={() => setShowAdd(false)} style={{ padding: '10px 20px' }}>Cancel</button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1 }}>
            {filtered.length === 0 ? (
              <div className="empty-state">
                <Package size={40} />
                <h3>No items found</h3>
                <p>Add ingredients to track your kitchen inventory</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filtered.map(item => (
                  <div
                    key={item.id}
                    className="card"
                    style={{
                      padding: '12px 16px', cursor: 'pointer', border: selectedItem?.id === item.id ? '2px solid var(--orange)' : '2px solid transparent',
                      borderLeft: `4px solid ${item.status === 'available' ? '#22C55E' : '#EF4444'}`,
                      opacity: item.status === 'available' ? 1 : 0.7,
                    }}
                    onClick={() => setSelectedItem(item)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{item.name}</div>
                        {item.quantity <= LOW_STOCK_THRESHOLD && item.quantity > 0 && (
                          <span style={{ fontSize: 11, color: '#D97706', background: '#FEF3C7', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
                            <AlertTriangle size={12} style={{ verticalAlign: 'middle', marginRight: 2 }} />Low
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <span style={{ fontWeight: 700, fontSize: 16, color: item.status === 'available' ? '#22C55E' : '#EF4444' }}>{item.quantity} {item.unit}</span>
                        <span className={`badge ${item.status === 'available' ? 'badge-approved' : 'badge-cancelled'}`} style={{ fontSize: 10 }}>{item.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedItem && (
            <div className="card" style={{ width: 320, flexShrink: 0, padding: 16, maxHeight: 500, overflowY: 'auto', position: 'sticky', top: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 18 }}>{selectedItem.name}</h3>
                <button onClick={() => setSelectedItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--gray-400)' }}>x</button>
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: selectedItem.status === 'available' ? '#22C55E' : '#EF4444', marginBottom: 4 }}>
                {selectedItem.quantity} <span style={{ fontSize: 16, fontWeight: 400 }}>{selectedItem.unit}</span>
              </div>
              <span className={`badge ${selectedItem.status === 'available' ? 'badge-approved' : 'badge-cancelled'}`} style={{ marginBottom: 16, display: 'inline-block' }}>
                {selectedItem.status === 'available' ? 'Available' : 'Unavailable'}
              </span>

              <div style={{ borderTop: '1px solid var(--gray-100)', paddingTop: 12, marginTop: 4 }}>
                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--gray-600)' }}>Add Stock</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[1, 5, 10, 20].map(n => (
                    <button key={n} className="btn btn-sm" style={{ ...quickBtnStyle }} onClick={() => addQuantity(selectedItem.id, n)}>+{n} {selectedItem.unit}</button>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--gray-100)', paddingTop: 12, marginTop: 12 }}>
                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--gray-600)' }}>Use Stock</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[1, 5, 10].map(n => (
                    <button key={n} className="btn btn-sm" style={{ ...quickBtnStyle, borderColor: '#FCA5A5', color: '#DC2626' }} onClick={() => reduceQuantity(selectedItem.id, n)}>-{n}</button>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--gray-100)', paddingTop: 12, marginTop: 12 }}>
                <button onClick={() => toggleStatus(selectedItem.id)} className="btn btn-sm" style={{
                  width: '100%',
                  background: selectedItem.status === 'available' ? '#FEE2E2' : '#DCFCE7',
                  color: selectedItem.status === 'available' ? '#DC2626' : '#16A34A',
                  border: 'none', fontWeight: 600, padding: '10px',
                }}>
                  {selectedItem.status === 'available' ? 'Mark Unavailable' : 'Mark Available'}
                </button>
                <button onClick={() => deleteItem(selectedItem.id)} className="btn btn-sm" style={{
                  width: '100%', marginTop: 8, background: 'none', border: '1px solid #FCA5A5',
                  color: '#DC2626', fontWeight: 600, padding: '10px',
                }}>
                  <Trash2 size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Delete Item
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Mobile view
  return (
    <div className="tab-content" style={{ paddingBottom: 80 }}>
      <div className="tab-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Package size={20} /> Inventory
          <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--gray-500)' }}>({counts.all})</span>
        </h2>
      </div>

      <div style={{ position: 'relative', marginBottom: 12 }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search inventory..." style={{
          width: '100%', padding: '10px 12px 10px 36px', borderRadius: 10, border: '2px solid var(--gray-200)',
          background: 'var(--white)', color: 'var(--gray-900)', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
        }} />
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.key} className={`btn btn-sm ${filter === t.key ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter(t.key)}
            style={filter === t.key ? { background: t.color, borderColor: t.color } : {}}
          >{t.label} ({counts[t.key]})</button>
        ))}
      </div>

      {showAdd && (
        <div className="card" style={{ padding: 16, marginBottom: 12, border: '2px solid var(--orange)' }}>
          <h4 style={{ margin: '0 0 10px', fontSize: 15 }}>New Inventory Item</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} placeholder="Item name (e.g. Onion)" style={inputStyle} autoFocus />
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="number" value={newItem.quantity} onChange={e => setNewItem({ ...newItem, quantity: Number(e.target.value) })} placeholder="Quantity" style={{ ...inputStyle, flex: 1 }} min="0" />
              <select value={newItem.unit} onChange={e => setNewItem({ ...newItem, unit: e.target.value })} style={{ ...inputStyle, flex: '0 1 90px' }}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={addItem}>Add Item</button>
              <button className="btn btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Package size={40} /></div>
          <h3>No items</h3>
          <p>{search ? 'No items match your search' : 'Add ingredients to track inventory'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(item => (
            <InventoryCard
              key={item.id}
              item={item}
              onAdd={addQuantity}
              onReduce={reduceQuantity}
              onToggle={toggleStatus}
              onDelete={deleteItem}
            />
          ))}
        </div>
      )}

      <button onClick={() => setShowAdd(true)} style={{
        position: 'fixed', bottom: 76, right: 16, width: 56, height: 56, borderRadius: '50%',
        background: 'var(--orange)', color: 'white', border: 'none', cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(255, 140, 66, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100,
      }}>
        <Plus size={24} />
      </button>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 8, border: '2px solid var(--gray-200)',
  background: 'var(--white)', color: 'var(--gray-900)', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
};
