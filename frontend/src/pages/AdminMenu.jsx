import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminMenu() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showCatForm, setShowCatForm] = useState(false);
  const [showDeleteCat, setShowDeleteCat] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', price: '', description: '', category_id: '', image: '' });
  const [catName, setCatName] = useState('');

  const load = async () => {
    const [ir, cr] = await Promise.all([
      axios.get('/api/menu/items'),
      axios.get('/api/menu/categories')
    ]);
    setItems(ir.data);
    setCategories(cr.data);
  };

  useEffect(() => { load(); }, []);

  const openEdit = (item) => {
    setEditing(item);
    setForm({ name: item.name, price: item.price, description: item.description || '', category_id: item.category_id || '', image: item.image || '' });
    setShowForm(true);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', price: '', description: '', category_id: categories[0]?.id || '', image: '' });
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      const payload = { ...form, price: parseFloat(form.price) };
      if (editing) {
        await axios.put(`/api/menu/items/${editing.id}`, payload);
      } else {
        await axios.post('/api/menu/items', payload);
      }
      setShowForm(false);
      load();
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    await axios.delete(`/api/menu/items/${id}`);
    load();
  };

  const toggleAvailable = async (item) => {
    await axios.put(`/api/menu/items/${item.id}`, { ...item, available: item.available ? 0 : 1 });
    load();
  };

  const addCategory = async () => {
    if (!catName.trim()) return;
    await axios.post('/api/menu/categories', { name: catName });
    setCatName('');
    setShowCatForm(false);
    load();
  };

  const deleteCategory = async (id) => {
    await axios.delete(`/api/menu/categories/${id}`);
    load();
  };

  const getCatName = (id) => categories.find(c => c.id === id)?.name || 'Uncategorized';

  return (
    <div className="tab-content" style={{ paddingBottom: 80 }}>
      <div className="tab-header">
        <div>
          <h2>Menu</h2>
          <p>{items.length} items</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-outline btn-sm" onClick={() => setShowDeleteCat(true)}>− Category</button>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowCatForm(true)}>+ Category</button>
        </div>
      </div>

      {categories.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {categories.map(cat => (
            <span key={cat.id} style={{ background: 'var(--yellow-light)', borderRadius: 16, padding: '6px 14px', fontSize: 13, fontWeight: 600 }}>
              {cat.name}
            </span>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🍽️</div>
          <h3>No menu items</h3>
          <p>Tap the + button to add your first item</p>
        </div>
      ) : (
        <div className="menu-list">
          {items.map(item => (
            <div key={item.id} className="menu-list-item">
              <div className="menu-list-img">
                {item.image ? <img src={item.image} alt="" /> : '🍽️'}
              </div>
              <div className="menu-list-info">
                <div className="menu-list-name">{item.name}</div>
                <div className="menu-list-category">{getCatName(item.category_id)}</div>
                <div className="menu-list-price">${parseFloat(item.price).toFixed(2)}</div>
              </div>
              <div className="menu-list-toggle">
                <label className="toggle">
                  <input type="checkbox" checked={item.available === 1} onChange={() => toggleAvailable(item)} />
                  <span className="slider" />
                </label>
              </div>
              <div className="menu-list-actions">
                <button className="btn btn-outline btn-sm" style={{ padding: '6px 10px', minHeight: 36 }} onClick={() => openEdit(item)}>✏️</button>
                <button className="btn btn-danger btn-sm" style={{ padding: '6px 10px', minHeight: 36 }} onClick={() => handleDelete(item.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="fab" onClick={openCreate}>+</button>

      {/* Item form modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editing ? 'Edit Item' : 'New Item'}</h2>
            <div className="form-group">
              <label>Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Item name" />
            </div>
            <div className="form-group">
              <label>Price ($)</label>
              <input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                <option value="">No category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Image URL</label>
              <input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="https://..." />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description" rows={2} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>{editing ? 'Update' : 'Add Item'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add category modal */}
      {showCatForm && (
        <div className="modal-overlay" onClick={() => setShowCatForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 320 }}>
            <h2>Add Category</h2>
            <div className="form-group">
              <label>Category Name</label>
              <input value={catName} onChange={e => setCatName(e.target.value)} placeholder="e.g. Drinks" />
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowCatForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={addCategory}>Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete category modal */}
      {showDeleteCat && (
        <div className="modal-overlay" onClick={() => setShowDeleteCat(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 340 }}>
            <h2>Delete Category</h2>
            <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 16 }}>Tap a category to delete it.</p>
            {categories.length === 0 ? (
              <p style={{ fontSize: 14, color: 'var(--gray-400)', textAlign: 'center', padding: 20 }}>No categories yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {categories.map(cat => (
                  <div key={cat.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--gray-50)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{cat.name}</span>
                    <button
                      onClick={async () => { await deleteCategory(cat.id); }}
                      style={{ background: '#FEE2E2', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: '#DC2626', fontWeight: 600, fontSize: 13 }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="modal-actions">
              <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => setShowDeleteCat(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
