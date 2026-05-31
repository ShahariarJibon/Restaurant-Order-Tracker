import { useState } from 'react';
import axios from 'axios';

export default function SuperAdminLogin({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/api/super-admin/login', { password });
      localStorage.setItem('super_token', res.data.token);
      onLogin(res.data.token);
    } catch {
      setError('Invalid password');
    }
    setLoading(false);
  };

  return (
    <div className="super-login-page">
      <div className="super-login-card">
        <div className="super-login-logo">
          <div className="super-login-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <h1>OrderTracker</h1>
          <p>Super Admin Panel</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter super admin password"
              autoFocus
            />
          </div>
          {error && <p className="super-login-error">{error}</p>}
          <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 12 }} disabled={loading}>
            {loading ? 'Verifying...' : 'Access Panel'}
          </button>
        </form>
        <p className="super-login-footer">Authorized access only</p>
      </div>
    </div>
  );
}
