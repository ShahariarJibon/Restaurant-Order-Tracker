import { Crown, Search } from '../components/Icons';

export default function SuperAdminSubscriptions() {
  return (
    <div className="super-page">
      <div className="super-page-header">
        <h1>Subscriptions</h1>
        <p>Manage plans & active subscriptions</p>
      </div>

      <div className="super-plan-cards">
        <div className="super-plan-card">
          <div className="super-plan-name">Free</div>
          <div className="super-plan-price">$0</div>
          <div className="super-plan-users">— users</div>
          <div className="super-plan-rev">Revenue: $0</div>
        </div>
        <div className="super-plan-card pro">
          <div className="super-plan-name">Pro Monthly</div>
          <div className="super-plan-price">$29<small>/mo</small></div>
          <div className="super-plan-users">— users</div>
          <div className="super-plan-rev">Revenue: $0</div>
        </div>
        <div className="super-plan-card pro">
          <div className="super-plan-name">Pro Yearly</div>
          <div className="super-plan-price">$249<small>/yr</small></div>
          <div className="super-plan-users">— users</div>
          <div className="super-plan-rev">Revenue: $0</div>
        </div>
      </div>

      <div className="super-section-title">Active Subscriptions</div>
      <div className="super-table-wrap">
        <table className="super-table">
          <thead>
            <tr>
              <th>Restaurant</th>
              <th>Plan</th>
              <th>Start Date</th>
              <th>Expiry</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr><td colSpan={6} className="super-empty">Subscription data will appear once payment system is active</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
