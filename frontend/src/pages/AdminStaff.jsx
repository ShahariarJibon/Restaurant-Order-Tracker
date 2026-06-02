import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Plus, Trash2, ChefHat, CheckCircle } from '../components/Icons';

export default function AdminStaff() {
  const [staff, setStaff] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'chef' });

  useEffect(() => {
    axios.get('/api/staff').then(r => setStaff(r.data)).catch(() => {});
  }, []);

  const create = async () => {
    if (!form.name || !form.email || !form.password) return;
    try {
      const res = await axios.post('/api/staff', form);
      setStaff(prev => [...prev, { id: res.data.id, name: form.name, email: form.email, role: form.role }]);
      setForm({ name: '', email: '', password: '', role: 'chef' });
      setShowForm(false);
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to create staff');
    }
  };

  const remove = async (id) => {
    if (!confirm('Remove this staff member?')) return;
    try {
      await axios.delete(`/api/staff/${id}`);
      setStaff(prev => prev.filter(s => s.id !== id));
    } catch {}
  };

  const RoleIcon = (r) => r === 'chef' ? <ChefHat size={16} /> : <CheckCircle size={16} />;

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2>Staff Management</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} /> {showForm ? 'Cancel' : 'Add Staff'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 16, padding: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} />
            <input placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} />
            <input placeholder="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={inputStyle} />
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={inputStyle}>
              <option value="chef">Chef</option>
              <option value="waiter">Waiter</option>
            </select>
            <button className="btn btn-primary" onClick={create}>Create Staff</button>
          </div>
        </div>
      )}

      {staff.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Users size={40} /></div>
          <h3>No staff yet</h3>
          <p>Add chefs and waiters to manage orders</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {staff.map(s => (
            <div key={s.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--orange-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--orange)' }}>
                  {RoleIcon(s.role)}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{s.email} • <span style={{ textTransform: 'capitalize' }}>{s.role}</span></div>
                </div>
              </div>
              <button className="btn btn-sm btn-danger" onClick={() => remove(s.id)} style={{ padding: '6px 10px' }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ marginTop: 16, padding: 16, background: 'var(--orange-light)' }}>
        <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>Staff Login</h4>
        <p style={{ fontSize: 13, color: 'var(--gray-600)', margin: 0 }}>
          Staff can log in at <strong>/staff-login</strong> using their email and password. Chefs see the kitchen display, waiters see ready orders.
        </p>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 8, border: '2px solid var(--gray-200)',
  background: 'var(--white)', color: 'var(--gray-900)', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box',
};
