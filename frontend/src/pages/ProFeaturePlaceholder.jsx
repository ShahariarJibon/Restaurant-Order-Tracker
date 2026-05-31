import { Lock } from '../components/Icons';

export default function ProFeaturePlaceholder({ name, desc, Icon }) {
  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2>{name}</h2>
      </div>
      <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
        {Icon && (
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--yellow-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Icon size={32} color="var(--yellow)" />
          </div>
        )}
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Coming Soon</h3>
        <p style={{ color: 'var(--gray-500)', fontSize: 14, lineHeight: 1.6 }}>
          {desc || 'This feature is in development and will be available soon.'}
        </p>
      </div>
    </div>
  );
}
