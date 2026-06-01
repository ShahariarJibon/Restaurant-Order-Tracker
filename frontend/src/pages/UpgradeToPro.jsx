import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Crown, CheckCircle, Clock, RefreshCw, Phone,
  Copy, ArrowLeft, Upload, AlertTriangle, ChevronRight,
  Shield, Star, XCircle, MessageSquare
} from '../components/Icons';

const METHODS = [
  { id: 'bkash', label: 'bKash', color: '#E2136E', bg: '#FCE4EC', img: '/bkash.png' },
  { id: 'nagad', label: 'Nagad', color: '#F58324', bg: '#FFF3E0', img: '/nagad.jpg' },
  { id: 'rocket', label: 'Rocket', color: '#1565C0', bg: '#E3F2FD', img: '/rocket.png' },
];

const INSTRUCTIONS = {
  bkash: { number: '01739849009', type: 'Send Money' },
  nagad: { number: '01739849009', type: 'Send Money' },
  rocket: { number: '01739849009', type: 'Send Money' },
};

export default function UpgradeToPro({ onBack }) {
  const { restaurant } = useAuth();
  const [method, setMethod] = useState('');
  const [trxId, setTrxId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [copied, setCopied] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (restaurant?.plan === 'pro') checkStatus();
    else checkStatus();
  }, [restaurant]);

  const checkStatus = async () => {
    try {
      const res = await axios.get('/api/payments/status');
      setStatus(res.data);
    } catch {}
  };

  const handleSubmit = async () => {
    if (!trxId.trim()) return;
    setSubmitting(true);
    try {
      const res = await axios.post('/api/payments/submit', {
        method,
        trxId: trxId.trim(),
        senderNumber: senderNumber.trim(),
        planType: 'monthly',
        screenshot: screenshot || '',
      });
      if (res.data.success) {
        setShowForm(false);
        checkStatus();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyNumber = (num) => {
    navigator.clipboard.writeText(num);
    setCopied(num);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleScreenshot = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setScreenshot(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const submittedPayment = status?.payment;
  const isProActivated = status?.plan?.plan === 'pro';

  // Show status screen if pro or payment exists
  if (isProActivated || submittedPayment) {
    return (
      <div className="tab-content" style={{ padding: '20px 16px' }}>
        <div className="tab-header">
          <h2>Pro Plan</h2>
        </div>

        {isProActivated ? (
          <div className="card" style={{ textAlign: 'center', padding: '32px 20px' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#D4EDDA', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle size={40} color="#28A745" />
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Pro Activated</h3>
            <p style={{ color: 'var(--gray-500)', fontSize: 14, marginBottom: 4 }}>All pro features are now unlocked.</p>
            {status?.plan?.plan_expiry && (
              <p style={{ color: 'var(--gray-400)', fontSize: 13 }}>
                Valid until {new Date(status.plan.plan_expiry).toLocaleDateString()}
              </p>
            )}
            <button className="pro-cta" style={{ marginTop: 20, padding: '14px 28px' }} onClick={onBack}>
              <ArrowLeft size={18} /> Back to Dashboard
            </button>
          </div>
        ) : submittedPayment?.status === 'rejected' ? (
          <div className="card" style={{ textAlign: 'center', padding: '32px 20px' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#F8D7DA', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <XCircle size={40} color="#DC3545" />
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, color: '#DC3545' }}>Payment Rejected</h3>
            <p style={{ color: 'var(--gray-500)', fontSize: 14, lineHeight: 1.6 }}>
              Invalid payment. Please try again with a valid transaction.
            </p>
            <button className="pro-cta" style={{ marginTop: 20 }} onClick={() => { setShowForm(false); setMethod(''); setTrxId(''); setScreenshot(null); setSenderNumber(''); setStatus(null); }}>
              Try Again
            </button>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '32px 20px' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#FFF3CD', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Clock size={40} color="#FFC107" />
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Payment verification in progress</h3>
            <p style={{ color: 'var(--gray-500)', fontSize: 14, lineHeight: 1.6, maxWidth: 320, margin: '0 auto' }}>
              We manually verify payments during active hours. Your account will be upgraded within 12 hours.
              If it takes longer, please contact our support team.
            </p>
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
              <div style={{ fontSize: 13, color: 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={14} /> Support Hours: 10:00 AM – 10:00 PM
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                <a href="tel:01739849009" style={{ padding: '12px 20px', borderRadius: 10, border: '1px solid var(--gray-200)', background: 'var(--white)', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--gray-700)', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontFamily: 'inherit' }}>
                  <MessageSquare size={16} /> Contact Support
                </a>
                <button className="pro-cta" style={{ padding: '12px 20px', fontSize: 14 }} onClick={checkStatus}>
                  <RefreshCw size={16} /> Check Status
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="tab-content" style={{ padding: '20px 16px' }}>
      <div className="tab-header">
        <h2>Upgrade to Pro</h2>
      </div>

      {/* Plan Info Card */}
      <div className="card" style={{ marginBottom: 20, padding: 0, overflow: 'hidden', border: '2px solid #FFC107' }}>
        <div style={{ background: 'linear-gradient(135deg, #FFFDE7 0%, #FFF8E1 100%)', padding: '24px 20px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FFC107', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <Crown size={30} color="#333" />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Pro Plan</h3>
          <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--orange)', marginBottom: 4 }}>৳499</div>
          <div style={{ fontSize: 14, color: 'var(--gray-500' }}>/ month</div>
        </div>
        <div style={{ padding: '16px 20px' }}>
          {[
            'Unlimited orders',
            'Analytics dashboard',
            'Priority support',
          ].map((feat, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', fontSize: 14, color: 'var(--gray-700)' }}>
              <Star size={14} color="#FFC107" />
              {feat}
            </div>
          ))}
        </div>
      </div>

      {/* Payment Method */}
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: 'var(--gray-700)' }}>
        Choose Payment Method
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {METHODS.map(m => {
          const selected = method === m.id;
          return (
            <button
              key={m.id}
              onClick={() => { setMethod(m.id); setShowForm(true); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px',
                borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit',
                border: selected ? `2px solid ${m.color}` : '2px solid var(--gray-100)',
                background: selected ? m.bg : 'var(--white)',
                transition: 'all 0.15s',
                boxShadow: selected ? `0 4px 16px ${m.color}30` : 'none',
              }}
            >
              <img src={m.img} alt={m.label} style={{
                width: 44, height: 44, borderRadius: 10, objectFit: 'contain',
                flexShrink: 0, background: m.bg, padding: 4
              }} />
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{m.label}</div>
                <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>Send Money</div>
              </div>
              {selected ? <CheckCircle size={22} color={m.color} /> : <ChevronRight size={20} color="var(--gray-300)" />}
            </button>
          );
        })}
      </div>

      {/* Payment Instructions + Submit Form (shown when method selected) */}
      {showForm && method && (() => {
        const instr = INSTRUCTIONS[method];
        const m = METHODS.find(x => x.id === method);
        return (
          <>
            {/* Instructions */}
            <div className="card" style={{ marginBottom: 16, background: '#FFFDE7', border: '1px solid #FFF9C4' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Shield size={18} color="#F59E0B" />
                <span style={{ fontWeight: 700, fontSize: 15 }}>Send ৳499 to this number</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 12 }}>
                Via <strong style={{ color: m?.color }}>{m?.label}</strong> — {instr.type}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, background: 'var(--white)', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--gray-200)' }}>
                <code style={{ fontSize: 20, fontWeight: 800, letterSpacing: 1, color: 'var(--gray-900)' }}>{instr.number}</code>
                <button
                  onClick={() => copyNumber(instr.number)}
                  style={{
                    padding: '10px 16px', borderRadius: 8, border: '1px solid var(--gray-200)',
                    background: 'var(--white)', cursor: 'pointer', fontSize: 13,
                    fontWeight: 600, color: copied === instr.number ? '#28A745' : 'var(--gray-700)',
                    display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {copied === instr.number ? <CheckCircle size={16} /> : <Copy size={16} />}
                  {copied === instr.number ? 'Copied' : 'Copy Number'}
                </button>
              </div>
            </div>

            {/* Submit Form */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 6 }}>
                  Transaction ID <span style={{ color: '#DC3545' }}>*</span>
                </label>
                <input
                  value={trxId}
                  onChange={e => setTrxId(e.target.value)}
                  placeholder="Enter transaction ID"
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 10, border: '2px solid var(--gray-200)',
                    background: 'var(--white)', color: 'var(--gray-900)', fontWeight: 600, fontSize: 15,
                    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 6 }}>
                  <Phone size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  Sender Number <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  value={senderNumber}
                  onChange={e => setSenderNumber(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 10, border: '2px solid var(--gray-200)',
                    background: 'var(--white)', color: 'var(--gray-900)', fontWeight: 600, fontSize: 15,
                    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 6 }}>
                  <Upload size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  Screenshot <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>(optional)</span>
                </label>
                <label style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '12px', borderRadius: 10, border: '2px dashed var(--gray-300)',
                  background: 'var(--gray-50)', cursor: 'pointer', fontSize: 14, color: 'var(--gray-500)',
                  fontFamily: 'inherit',
                }}>
                  <Upload size={18} />
                  {screenshot ? 'Screenshot added' : 'Upload payment screenshot'}
                  <input type="file" accept="image/*" onChange={handleScreenshot} style={{ display: 'none' }} />
                </label>
                {screenshot && (
                  <div style={{ marginTop: 8, position: 'relative', display: 'inline-block' }}>
                    <img src={screenshot} alt="screenshot" style={{ height: 80, borderRadius: 8, border: '1px solid var(--gray-200)' }} />
                    <button onClick={() => setScreenshot(null)} style={{ position: 'absolute', top: -6, right: -6, background: '#EF4444', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!trxId.trim() || submitting}
              className="pro-cta"
              style={{
                width: '100%', padding: '16px', fontSize: 16,
                opacity: !trxId.trim() || submitting ? 0.6 : 1,
                cursor: !trxId.trim() || submitting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {submitting ? (
                <>Submitting...</>
              ) : (
                <><Crown size={18} /> Submit Payment — ৳499</>
              )}
            </button>
          </>
        );
      })()}
    </div>
  );
}
