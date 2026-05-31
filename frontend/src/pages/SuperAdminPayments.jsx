import { useState, useEffect } from 'react';
import axios from 'axios';
import { CreditCard, Search, Copy, CheckCircle, XCircle, ExternalLink, ThumbsUp, ThumbsDown, RefreshCw, Clock } from '../components/Icons';

const METHOD_COLORS = {
  bkash: { bg: '#FCE4EC', color: '#E2136E', label: 'bKash' },
  nagad: { bg: '#FFF3E0', color: '#F58324', label: 'Nagad' },
  rocket: { bg: '#E3F2FD', color: '#1565C0', label: 'Rocket' },
};

export default function SuperAdminPayments() {
  const [payments, setPayments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('super_token');
      const status = filter === 'all' ? '' : filter;
      const res = await axios.get(`/api/super-admin/payments${status ? `?status=${status}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(res.data);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayments(); }, [filter]);

  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem('super_token');
      await axios.put(`/api/super-admin/payments/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPayments();
    } catch {}
  };

  const handleReject = async (id) => {
    try {
      const token = localStorage.getItem('super_token');
      await axios.put(`/api/super-admin/payments/${id}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPayments();
    } catch {}
  };

  const copyTrx = (trx) => {
    navigator.clipboard.writeText(trx);
  };

  const getStatusBadge = (status) => {
    if (status === 'approved') return { label: 'Approved', color: '#28A745', bg: '#D4EDDA' };
    if (status === 'rejected') return { label: 'Rejected', color: '#DC3545', bg: '#F8D7DA' };
    return { label: 'Pending', color: '#FFC107', bg: '#FFF3CD' };
  };

  return (
    <div className="super-page">
      <div className="super-page-header">
        <h1>Payments</h1>
        <p>Verify & approve pro plan payments</p>
      </div>

      <div className="super-controls">
        <div className="super-search">
          <Search size={16} />
          <input placeholder="Search by restaurant or transaction ID..." />
        </div>
        <select className="super-select" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <button className="super-btn" style={{ padding: '8px 12px' }} onClick={fetchPayments}>
          <RefreshCw size={16} />
        </button>
      </div>

      {loading ? (
        <div className="super-empty-state"><p>Loading payments...</p></div>
      ) : payments.length === 0 ? (
        <div className="super-empty-state">
          <CreditCard size={40} />
          <h3>No Payments Yet</h3>
          <p>Payments from restaurant owners will appear here.</p>
        </div>
      ) : (
        <div className="super-table-wrapper">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {payments.map(p => {
              const methodInfo = METHOD_COLORS[p.method] || { bg: '#f0f0f0', color: '#666', label: p.method };
              const badge = getStatusBadge(p.status);
              return (
                <div key={p.id} className="super-card" style={{
                  border: p.status === 'pending' ? '2px solid #FFC107' : '1px solid var(--gray-200)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{p.restaurant_name || 'Unknown'}</div>
                      <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>{p.restaurant_email || ''}</div>
                    </div>
                    <span style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                      background: badge.bg, color: badge.color
                    }}>
                      {badge.label}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                    <span style={{ padding: '3px 10px', borderRadius: 6, background: methodInfo.bg, color: methodInfo.color, fontSize: 12, fontWeight: 700 }}>
                      {methodInfo.label}
                    </span>
                    <span style={{ padding: '3px 10px', borderRadius: 6, background: '#F3E8FF', color: '#7C3AED', fontSize: 12, fontWeight: 700 }}>
                      {p.plan_type === 'yearly' ? 'Yearly' : 'Monthly'}
                    </span>
                    <span style={{ padding: '3px 10px', borderRadius: 6, background: '#E8F5E9', color: '#2E7D32', fontSize: 12, fontWeight: 700 }}>
                       ৳{Number(p.amount).toFixed(0)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 14 }}>
                    <code style={{ fontSize: 13, fontWeight: 600, background: 'var(--gray-100)', padding: '4px 8px', borderRadius: 6 }}>
                      {p.trx_id}
                    </code>
                    <button
                      onClick={() => copyTrx(p.trx_id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', padding: 2 }}
                      title="Copy TRX ID"
                    >
                      <Copy size={14} />
                    </button>
                  </div>

                  {p.sender_number && (
                    <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 10 }}>
                      From: {p.sender_number}
                    </div>
                  )}
                  {p.screenshot && (
                    <div style={{ marginBottom: 10 }}>
                      <a href={p.screenshot} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--orange)', textDecoration: 'underline' }}>
                        <img src={p.screenshot} alt="payment screenshot" style={{ height: 60, borderRadius: 6, border: '1px solid var(--gray-200)' }} />
                      </a>
                    </div>
                  )}

                  {p.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button
                        onClick={() => handleApprove(p.id)}
                        style={{
                          flex: 1, padding: '10px', borderRadius: 10, border: 'none',
                          background: '#28A745', color: 'white', fontWeight: 700, fontSize: 14,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          gap: 6, fontFamily: 'inherit'
                        }}
                      >
                        <ThumbsUp size={16} /> Approve
                      </button>
                      <button
                        onClick={() => handleReject(p.id)}
                        style={{
                          flex: 1, padding: '10px', borderRadius: 10, border: 'none',
                          background: '#DC3545', color: 'white', fontWeight: 700, fontSize: 14,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          gap: 6, fontFamily: 'inherit'
                        }}
                      >
                        <ThumbsDown size={16} /> Reject
                      </button>
                    </div>
                  )}

                  <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 8 }}>
                    <Clock size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    {new Date(p.created_at).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
