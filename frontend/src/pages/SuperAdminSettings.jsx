import { useState } from 'react';
import { Save, Crown, DollarSign, Shield } from '../components/Icons';

export default function SuperAdminSettings() {
  const [monthly, setMonthly] = useState(29);
  const [yearly, setYearly] = useState(249);
  const [trialDays, setTrialDays] = useState(7);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="super-page">
      <div className="super-page-header">
        <h1>Settings</h1>
        <p>Configure platform-wide settings</p>
      </div>

      <div className="super-settings-grid">
        <div className="super-settings-card">
          <div className="super-settings-card-header">
            <Crown size={18} />
            <span>Pricing Control</span>
          </div>
          <div className="super-settings-field">
            <label>Monthly Price ($)</label>
            <input type="number" value={monthly} onChange={e => setMonthly(Number(e.target.value))} />
          </div>
          <div className="super-settings-field">
            <label>Yearly Price ($)</label>
            <input type="number" value={yearly} onChange={e => setYearly(Number(e.target.value))} />
          </div>
        </div>

        <div className="super-settings-card">
          <div className="super-settings-card-header">
            <DollarSign size={18} />
            <span>Payment Settings</span>
          </div>
          <div className="super-settings-field">
            <label>bKash Number</label>
            <input placeholder="01X-XXXXXXXX" />
          </div>
          <div className="super-settings-field">
            <label>Nagad Number</label>
            <input placeholder="01X-XXXXXXXX" />
          </div>
          <div className="super-settings-field">
            <label>Rocket Number</label>
            <input placeholder="01X-XXXXXXXX" />
          </div>
        </div>

        <div className="super-settings-card">
          <div className="super-settings-card-header">
            <Shield size={18} />
            <span>System Settings</span>
          </div>
          <div className="super-settings-field">
            <label>Trial Days</label>
            <input type="number" value={trialDays} onChange={e => setTrialDays(Number(e.target.value))} />
          </div>
        </div>
      </div>

      <button className="btn btn-primary" onClick={handleSave} style={{ marginTop: 24 }}>
        <Save size={16} /> {saved ? 'Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}
