import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminTables() {
  const [tables, setTables] = useState([]);
  const [newNum, setNewNum] = useState('');
  const [qrModal, setQrModal] = useState(null);

  useEffect(() => {
    axios.get('/api/tables').then(r => setTables(r.data));
  }, []);

  const addTable = async () => {
    if (!newNum.trim()) return;
    const res = await axios.post('/api/tables', { table_number: parseInt(newNum) });
    setTables(prev => [...prev, res.data]);
    setNewNum('');
  };

  const removeTable = async (id) => {
    if (!confirm('Remove this table?')) return;
    await axios.delete(`/api/tables/${id}`);
    setTables(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="tab-content">
      <div className="tab-header">
        <div>
          <h2>Tables</h2>
          <p>{tables.length} tables</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="number"
            placeholder="Number"
            value={newNum}
            onChange={e => setNewNum(e.target.value)}
            style={{ width: 80, padding: '10px 12px' }}
          />
          <button className="btn btn-primary btn-sm" onClick={addTable}>+ Add</button>
        </div>
      </div>

      {tables.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🪑</div>
          <h3>No tables yet</h3>
          <p>Add a table to generate its QR menu</p>
        </div>
      ) : (
        <div className="table-list">
          {tables.map(table => (
            <div key={table.id} className="table-list-item">
              <div className="table-list-left">
                <div className="table-number-badge">#{table.table_number}</div>
                <div>
                  <div style={{ fontWeight: 600 }}>Table {table.table_number}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{table.qr_code ? 'QR ready' : 'No QR'}</div>
                </div>
              </div>
              <div className="table-list-actions">
                {table.qr_code ? (
                  <button className="btn btn-secondary btn-sm" onClick={() => setQrModal(table)}>QR</button>
                ) : (
                  <span style={{ color: 'var(--gray-300)', fontSize: 12 }}>—</span>
                )}
                <button className="btn btn-danger btn-sm" onClick={() => removeTable(table.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Modal */}
      {qrModal && (
        <div className="modal-overlay" onClick={() => setQrModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 340 }}>
            <h2>Table #{qrModal.table_number}</h2>
            <div className="qr-preview">
              {qrModal.qr_code ? (
                <img src={qrModal.qr_code} alt={`QR for Table ${qrModal.table_number}`} />
              ) : (
                <p>No QR code available</p>
              )}
              <p>Scan to view menu & order</p>
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setQrModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
