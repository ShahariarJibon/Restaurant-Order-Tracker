import { useState, useEffect } from 'react';
import axios from 'axios';
import { MessageSquare, Trash2, Clock } from '../components/Icons';

export default function AdminFeedback() {
  const [feedback, setFeedback] = useState([]);

  const load = async () => {
    try {
      const res = await axios.get('/api/feedback/admin');
      setFeedback(res.data);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/feedback/${id}`);
      setFeedback(prev => prev.filter(f => f.id !== id));
    } catch {}
  };

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2>Feedback</h2>
      </div>

      {feedback.length === 0 ? (
        <div className="card" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--gray-500)', fontSize: 13, lineHeight: 1.6 }}>
          <MessageSquare size={32} style={{ display: 'block', margin: '0 auto 12px', color: 'var(--gray-300)' }} />
          No feedback yet. Customers can submit feedback from the menu page.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {feedback.map(f => (
            <div key={f.id} className="card" style={{ position: 'relative', padding: '16px 40px 16px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 12, color: 'var(--gray-500)' }}>
                <span style={{ fontWeight: 600 }}>{f.customer_name || 'Anonymous'}</span>
                <Clock size={14} />
                <span>{new Date(f.created_at + 'Z').toLocaleString()}</span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--gray-800)', margin: 0 }}>{f.message}</p>
              <button
                onClick={() => handleDelete(f.id)}
                style={{
                  position: 'absolute', top: 12, right: 12, background: 'none', border: 'none',
                  color: 'var(--gray-400)', cursor: 'pointer', padding: 4, fontSize: 16,
                }}
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
