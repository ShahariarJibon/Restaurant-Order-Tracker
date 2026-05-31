import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Crown, Star, CheckCircle, Clock, RefreshCw, Phone,
  Copy, ArrowLeft, Upload, LogOut, AlertTriangle, ChevronRight,
  Shield, Sparkles
} from '../components/Icons';

const PLANS = [
  { id: 'monthly', label: 'Monthly', price: 499, period: '/month', popular: false },
  { id: 'yearly', label: 'Yearly', price: 5599, period: '/year', popular: true },
];

const METHODS = [
  { id: 'bkash', label: 'bKash', color: '#E2136E', bg: '#FCE4EC' },
  { id: 'nagad', label: 'Nagad', color: '#F58324', bg: '#FFF3E0' },
  { id: 'rocket', label: 'Rocket', color: '#1565C0', bg: '#E3F2FD' },
];

const INSTRUCTIONS = {
  bkash: { number: '01XXXXXXXXX', type: 'Send Money' },
  nagad: { number: '01XXXXXXXXX', type: 'Send Money' },
  rocket: { number: '01XXXXXXXXX', type: 'Send Money' },
};

export default function UpgradeToPro({ onBack }) {
  const { restaurant, updateRestaurant } = useAuth();
  const [step, setStep] = useState('plan');
  const [planType, setPlanType] = useState('monthly');
  const [method, setMethod] = useState('');
  const [trxId, setTrxId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    if (restaurant?.plan === 'pro') {
      setStep('status');
      checkStatus();
    }
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
        planType,
      });
      if (res.data.success) {
        setStep('status');
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

  const amount = planType === 'monthly' ? 499 : 5599;

  if (step === 'status') {
    const payment = status?.payment;
    const isPro = status?.plan?.plan === 'pro';
    return (
      <div className="tab-content" style={{ padding: '20px 16px' }}>
        <div className="tab-header">
          <h2>Pro Plan</h2>
        </div>

        {isPro ? (
          <div className="card" style={{ textAlign: 'center', padding: '32px 20px' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#D4EDDA', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle size={36} color="#28A745" />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Pro Activated ✓</h3>
            <p style={{ color: 'var(--gray-500)', fontSize: 14, marginBottom: 4 }}>All pro features are unlocked.</p>
            {status?.plan?.plan_expiry && (
              <p style={{ color: 'var(--gray-400)', fontSize: 13 }}>
                Valid until {new Date(status.plan.plan_expiry).toLocaleDateString()}
              </p>
            )}
          </div>
        ) : payment ? (
          <div className="card" style={{ textAlign: 'center', padding: '32px 20px' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#FFF3CD', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Clock size={36} color="#FFC107" />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Payment Verification in Progress</h3>
            <p style={{ color: 'var(--gray-500)', fontSize: 14, lineHeight: 1.6 }}>
              We manually verify payments during active hours. Your account will be upgraded within 12 hours.
            </p>
            {payment.status === 'rejected' && (
              <div style={{ marginTop: 16, padding: 12, borderRadius: 10, background: '#FFF3CD', fontSize: 14 }}>
                <strong>Payment rejected.</strong> Please submit a new payment request.
              </div>
            )}
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                <Clock size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                Support Hours: 10:00 AM – 10:00 PM
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="pro-cta" style={{ padding: '10px 20px', fontSize: 14 }} onClick={checkStatus}>
                  <RefreshCw size={16} /> Check Status
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '32px 20px' }}>
            <p style={{ color: 'var(--gray-500)' }}>No payment found. Start your upgrade below.</p>
            <button className="pro-cta" style={{ marginTop: 16 }} onClick={() => setStep('plan')}>
              Upgrade Now
            </button>
          </div>
        )}

        {isPro && (
          <button className="settings-item" style={{ marginTop: 16 }} onClick={onBack}>
            <span className="si-arrow" style={{ transform: 'rotate(180deg)' }}>›</span>
            <span className="si-label">Back to Settings</span>
          </button>
        )}
      </div>
    );
  }

  if (step === 'submit') {
    const instr = INSTRUCTIONS[method];
    return (
      <div className="tab-content" style={{ padding: '20px 16px' }}>
        <div className="tab-header">
          <button onClick={() => setStep('method')} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--gray-600)' }}>
            <ArrowLeft size={22} />
          </button>
          <h2>Complete Payment</h2>
        </div>

        <div className="card" style={{ marginBottom: 16, background: '#FFFDE7', border: '1px solid #FFF9C4' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Shield size={18} color="#F59E0B" />
            <span style={{ fontWeight: 700, fontSize: 15 }}>Send {amount} TK</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6 }}>
            <p>Send exactly <strong>{amount} TK</strong> to the number below via <strong>{METHODS.find(m => m.id === method)?.label}</strong></p>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, color: 'var(--gray-500)' }}>{instr.type}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <code style={{ fontSize: 18, fontWeight: 700, letterSpacing: 1 }}>{instr.number}</code>
            <button
              onClick={() => copyNumber(instr.number)}
              style={{
                padding: '8px 14px', borderRadius: 8, border: '1px solid var(--gray-200)',
                background: 'var(--white)', cursor: 'pointer', fontSize: 13,
                fontWeight: 600, color: copied === instr.number ? 'var(--green)' : 'var(--gray-700)',
                display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit'
              }}
            >
              {copied === instr.number ? <CheckCircle size={16} /> : <Copy size={16} />}
              {copied === instr.number ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 8 }}>
            Transaction ID <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            value={trxId}
            onChange={e => setTrxId(e.target.value)}
            placeholder="Enter transaction ID"
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 10, border: '2px solid var(--gray-200)',
              background: 'var(--white)', color: 'var(--gray-900)', fontWeight: 600, fontSize: 15,
              fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box'
            }}
          />
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 8 }}>
            Sender Number <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>(optional)</span>
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Phone size={18} color="var(--gray-400)" />
            <input
              value={senderNumber}
              onChange={e => setSenderNumber(e.target.value)}
              placeholder="01XXXXXXXXX"
              style={{
                flex: 1, padding: '12px 14px', borderRadius: 10, border: '2px solid var(--gray-200)',
                background: 'var(--white)', color: 'var(--gray-900)', fontWeight: 600, fontSize: 15,
                fontFamily: 'inherit', outline: 'none'
              }}
            />
          </div>
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <label style={{ fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 8 }}>
            Screenshot <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>(optional)</span>
          </label>
          <label
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '16px', borderRadius: 10, border: '2px dashed var(--gray-200)',
              cursor: 'pointer', fontSize: 14, color: 'var(--gray-500)', fontFamily: 'inherit'
            }}
          >
            <Upload size={20} />
            Upload payment screenshot
            <input type="file" accept="image/*" style={{ display: 'none' }} />
          </label>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!trxId.trim() || submitting}
          className="pro-cta"
          style={{
            width: '100%', padding: '16px', fontSize: 16, opacity: !trxId.trim() || submitting ? 0.6 : 1,
            cursor: !trxId.trim() || submitting ? 'not-allowed' : 'pointer'
          }}
        >
          {submitting ? 'Submitting...' : `Submit Payment — ${amount} TK`}
        </button>

        <button
          onClick={onBack}
          style={{
            width: '100%', padding: '14px', marginTop: 12, borderRadius: 12,
            border: 'none', background: 'none', cursor: 'pointer', fontSize: 14,
            color: 'var(--gray-500)', fontFamily: 'inherit'
          }}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="tab-content" style={{ padding: '20px 16px' }}>
      <div className="tab-header">
        <h2>Upgrade to Pro</h2>
      </div>

      {/* Plan Selection */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: 'var(--gray-500)' }}>
          Choose Your Plan
        </h3>
        <div style={{ display: 'flex', gap: 12 }}>
          {PLANS.map(p => {
            const selected = planType === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setPlanType(p.id)}
                style={{
                  flex: 1, padding: '20px 16px', borderRadius: 16, cursor: 'pointer',
                  border: selected ? '2px solid var(--yellow)' : '2px solid var(--gray-100)',
                  background: selected ? 'var(--yellow-light, #FFFDE7)' : 'var(--white)',
                  textAlign: 'center', position: 'relative', fontFamily: 'inherit',
                  boxShadow: selected ? '0 4px 20px rgba(255,193,7,0.2)' : '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                {p.popular && (
                  <span style={{
                    position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                    background: '#FFC107', color: '#333', fontSize: 11, fontWeight: 700,
                    padding: '3px 12px', borderRadius: 20, whiteSpace: 'nowrap'
                  }}>
                    <Star size={12} style={{ verticalAlign: 'middle', marginRight: 2 }} /> BEST VALUE
                  </span>
                )}
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{p.label}</div>
                <div style={{ fontWeight: 800, fontSize: 26, color: 'var(--orange)' }}>৳{p.price}</div>
                <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>{p.period}</div>
              </button>
            );
          })}
        </div>
        <div style={{
          marginTop: 12, padding: '10px 14px', borderRadius: 10,
          background: '#FFF3CD', fontSize: 13, color: '#856404', lineHeight: 1.5
        }}>
          <Sparkles size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          Unlimited orders, analytics dashboard, priority support & more.
        </div>
      </div>

      {/* Payment Method */}
      {planType && (
        <>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: 'var(--gray-500)' }}>
            Choose Payment Method
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {METHODS.map(m => {
              const selected = method === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
                    borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit',
                    border: selected ? `2px solid ${m.color}` : '2px solid var(--gray-100)',
                    background: selected ? m.bg : 'var(--white)',
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, background: m.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800, color: m.color, flexShrink: 0
                  }}>
                    {m.label[0]}
                  </div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{m.label}</div>
                    <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>Send Money</div>
                  </div>
                  <ChevronRight size={20} color={selected ? m.color : 'var(--gray-300)'} />
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setStep('submit')}
            disabled={!method}
            className="pro-cta"
            style={{
              width: '100%', padding: '16px', fontSize: 16,
              opacity: !method ? 0.6 : 1, cursor: !method ? 'not-allowed' : 'pointer'
            }}
          >
            <Crown size={18} /> Upgrade Now — ৳{amount}
          </button>
        </>
      )}
    </div>
  );
}
