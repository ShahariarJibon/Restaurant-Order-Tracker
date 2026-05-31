import { AlertTriangle, CheckCircle, MessageSquare } from '../components/Icons';

export default function SuperAdminReports() {
  return (
    <div className="super-page">
      <div className="super-page-header">
        <h1>Reports & Issues</h1>
        <p>User complaints, payment issues & bug reports</p>
      </div>

      <div className="super-empty-state">
        <AlertTriangle size={40} />
        <h3>No Reports</h3>
        <p>All systems running smoothly. Any issues will appear here.</p>
      </div>
    </div>
  );
}
