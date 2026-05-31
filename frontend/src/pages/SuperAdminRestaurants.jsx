import { useState, useEffect } from 'react';
import axios from 'axios';
import { Store, Search, Download, Crown, XCircle, CheckCircle, Trash2, AlertTriangle } from '../components/Icons';

export default function SuperAdminRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const token = localStorage.getItem('super_token');
  const headers = { Authorization: `Bearer ${token}` };

  const load = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (planFilter) params.plan = planFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await axios.get('/api/super-admin/restaurants', { params, headers });
      setRestaurants(res.data);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const updatePlan = async (id, plan) => {
    await axios.put(`/api/super-admin/restaurants/${id}/plan`, { plan }, { headers });
    if (selected?.id === id) setSelected(prev => ({ ...prev, plan }));
    load();
  };

  const updateStatus = async (id, status) => {
    await axios.put(`/api/super-admin/restaurants/${id}/status`, { status }, { headers });
    if (selected?.id === id) setSelected(prev => ({ ...prev, status }));
    load();
  };

  const removeRestaurant = async (id) => {
    if (!window.confirm('Delete this restaurant and ALL its data? This cannot be undone.')) return;
    await axios.delete(`/api/super-admin/restaurants/${id}`, { headers });
    setSelected(null);
    load();
  };

  const viewDetails = async (id) => {
    try {
      const res = await axios.get(`/api/super-admin/restaurants/${id}`, { headers });
      setSelected(res.data);
    } catch {}
  };

  const filtered = restaurants.filter(r => {
    if (planFilter && r.plan !== planFilter) return false;
    if (statusFilter && r.status !== statusFilter) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase()) && !r.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="super-page">
      <div className="super-page-header">
        <h1>Restaurants</h1>
        <p>Manage all registered restaurants</p>
      </div>

      <div className="super-controls">
        <div className="super-search">
          <Search size={16} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." />
        </div>
        <select className="super-select" value={planFilter} onChange={e => setPlanFilter(e.target.value)}>
          <option value="">All Plans</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
        </select>
        <select className="super-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <button className="super-btn-icon" onClick={load} title="Refresh">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
        </button>
      </div>

      <div className="super-table-wrap">
        <table className="super-table">
          <thead>
            <tr>
              <th>Restaurant</th>
              <th>Email</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Orders</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} className="super-table-row" onClick={() => viewDetails(r.id)}>
                <td className="super-td-name">{r.name}</td>
                <td className="super-td-muted">{r.email}</td>
                <td><span className={`super-badge ${r.plan === 'pro' ? 'pro' : 'free'}`}>{r.plan || 'free'}</span></td>
                <td><span className={`super-badge ${r.status === 'suspended' ? 'suspended' : 'active'}`}>{r.status || 'active'}</span></td>
                <td className="super-td-muted">{r.totalOrders || 0}</td>
                <td className="super-td-muted">{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</td>
                <td className="super-td-actions" onClick={e => e.stopPropagation()}>
                  {r.plan !== 'pro' && (
                    <button className="super-action-btn pro" onClick={() => updatePlan(r.id, 'pro')} title="Make Pro"><Crown size={14} /></button>
                  )}
                  {r.plan === 'pro' && (
                    <button className="super-action-btn" onClick={() => updatePlan(r.id, 'free')} title="Revoke Pro"><Crown size={14} style={{ opacity: 0.4 }} /></button>
                  )}
                  {r.status !== 'suspended' && (
                    <button className="super-action-btn suspend" onClick={() => updateStatus(r.id, 'suspended')} title="Suspend"><XCircle size={14} /></button>
                  )}
                  {r.status === 'suspended' && (
                    <button className="super-action-btn activate" onClick={() => updateStatus(r.id, 'active')} title="Activate"><CheckCircle size={14} /></button>
                  )}
                  <button className="super-action-btn delete" onClick={() => removeRestaurant(r.id)} title="Delete"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="super-empty">No restaurants found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <>
          <div className="super-overlay" onClick={() => setSelected(null)} />
          <div className="super-drawer">
            <div className="super-drawer-header">
              <h2>{selected.name}</h2>
              <button className="super-drawer-close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="super-drawer-body">
              <div className="super-detail-row"><span>Email</span><span>{selected.email}</span></div>
              <div className="super-detail-row"><span>Plan</span><span className={`super-badge ${selected.plan === 'pro' ? 'pro' : 'free'}`}>{selected.plan || 'free'}</span></div>
              <div className="super-detail-row"><span>Status</span><span className={`super-badge ${selected.status === 'suspended' ? 'suspended' : 'active'}`}>{selected.status || 'active'}</span></div>
              <div className="super-detail-row"><span>Total Revenue</span><span style={{ fontWeight: 700, color: 'var(--orange)' }}>${Number(selected.totalRevenue || 0).toFixed(2)}</span></div>
              <div className="super-detail-row"><span>Avg Rating</span><span>{Number(selected.avgRating || 0).toFixed(1)} ⭐</span></div>
              <div className="super-detail-row"><span>Currency</span><span>{selected.currency || 'BDT'}</span></div>

              <div className="super-section-title" style={{ marginTop: 20 }}>Quick Actions</div>
              <div className="super-drawer-actions">
                {selected.plan !== 'pro' && (
                  <button className="btn btn-sm" style={{ background: 'var(--yellow)', color: 'var(--gray-900)' }} onClick={() => updatePlan(selected.id, 'pro')}>
                    <Crown size={14} /> Make Pro
                  </button>
                )}
                {selected.status !== 'suspended' && (
                  <button className="btn btn-sm btn-danger" onClick={() => updateStatus(selected.id, 'suspended')}>
                    <XCircle size={14} /> Suspend
                  </button>
                )}
                {selected.status === 'suspended' && (
                  <button className="btn btn-sm" style={{ background: 'var(--green)', color: 'white' }} onClick={() => updateStatus(selected.id, 'active')}>
                    <CheckCircle size={14} /> Activate
                  </button>
                )}
                <button className="btn btn-sm btn-danger" onClick={() => removeRestaurant(selected.id)}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>

              {selected.orders && selected.orders.length > 0 && (
                <>
                  <div className="super-section-title" style={{ marginTop: 20 }}>Recent Orders</div>
                  {selected.orders.map(o => (
                    <div key={o.id} className="super-timeline-item">
                      <span className="super-timeline-status">{o.status}</span>
                      <span>${Number(o.total).toFixed(2)}</span>
                      <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{o.created_at ? new Date(o.created_at).toLocaleDateString() : ''}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
