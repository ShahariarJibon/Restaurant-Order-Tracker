import { useState, useEffect } from 'react';
import axios from 'axios';
import { cacheData, getCachedData } from '../utils/dataCache';

const downloadQR = (imgSrc, tableNum) => {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    const canvas = document.createElement('canvas');
    const padding = 30;
    const textHeight = 50;
    const size = Math.max(img.width, 220);
    canvas.width = size + padding * 2;
    canvas.height = size + padding * 2 + textHeight;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const x = (canvas.width - img.width) / 2;
    ctx.drawImage(img, x, padding, img.width, img.height);
    ctx.fillStyle = '#222222';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Scan QR to view menu & order', canvas.width / 2, canvas.height - 14);
    const link = document.createElement('a');
    link.download = `table-${tableNum}-qr.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };
  img.src = imgSrc;
};

export default function AdminTables() {
  const [tables, setTables] = useState([]);
  const [newNum, setNewNum] = useState('');
  const [qrModal, setQrModal] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get('/api/tables');
        setTables(res.data);
        cacheData('tables', res.data);
      } catch {
        const cached = getCachedData('tables');
        if (cached) setTables(cached);
      }
    };
    load();
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
            style={{ width: 120, padding: '10px 12px' }}
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
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => downloadQR(qrModal.qr_code, qrModal.table_number)}>⬇ Download</button>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setQrModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
