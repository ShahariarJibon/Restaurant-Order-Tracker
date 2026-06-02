import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ChefHat, CheckCircle } from '../components/Icons';

const ROLE_INFO = {
  chef: { Icon: ChefHat, label: 'Chef', color: 'var(--orange)' },
  waiter: { Icon: CheckCircle, label: 'Waiter', color: 'var(--green)' },
};

export default function StaffLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/staff/login', { email, password });
      localStorage.setItem('staff_token', res.data.token);
      localStorage.setItem('staff_info', JSON.stringify(res.data.staff));
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      const role = res.data.staff.role;
      if (role === 'chef') navigate('/chef');
      else if (role === 'waiter') navigate('/waiter');
      else navigate('/');
    } catch (e) {
      setError(e.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            🍽️ Staff Login
          </h1>
          <p style={{ fontSize: 14, color: 'var(--gray-500)', margin: 0 }}>Chef & Waiter Access</p>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {Object.entries(ROLE_INFO).map(([key, info]) => {
            const InfoIcon = info.Icon;
            return (
              <div key={key} style={{ flex: 1, padding: '10px 8px', borderRadius: 8, background: info.color + '15', textAlign: 'center', border: '1px solid ' + info.color + '30' }}>
                <InfoIcon size={20} style={{ color: info.color }} />
                <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4, color: info.color }}>{info.label}</div>
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ background: 'var(--white)', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: 24 }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--gray-700)' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="staff@restaurant.com" style={inputStyle} autoFocus />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--gray-700)' }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" style={inputStyle} />
            </div>
            {error && <p style={{ color: '#EF4444', fontSize: 13, margin: '0 0 12px' }}>{error}</p>}
            <button className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: 16 }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <a href="/login" style={{ fontSize: 13, color: 'var(--orange)', textDecoration: 'none' }}>Admin Login →</a>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '12px 14px', borderRadius: 10, border: '2px solid var(--gray-200)',
  background: 'var(--white)', color: 'var(--gray-900)', fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.15s',
};
