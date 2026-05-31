import { useState } from 'react';
import { CreditCard, Search, Copy, CheckCircle, XCircle, ExternalLink } from '../components/Icons';

export default function SuperAdminPayments() {
  const [filter, setFilter] = useState('all');

  return (
    <div className="super-page">
      <div className="super-page-header">
        <h1>Payments</h1>
        <p>Manage payment approvals & verification</p>
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
      </div>

      <div className="super-empty-state">
        <CreditCard size={40} />
        <h3>Payment Gateway</h3>
        <p>Payments module will be fully functional after backend integration.</p>
        <p style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 8 }}>
          Configure bKash, Nagad & Rocket numbers in Settings.
        </p>
      </div>
    </div>
  );
}
