import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { CreditCard, Upload, Image, Phone } from '../components/Icons';

export default function AdminPayments() {
  const { restaurant, updateRestaurant } = useAuth();
  const [qrBkash, setQrBkash] = useState(localStorage.getItem('payment_qr_bkash') || '');
  const [qrNagad, setQrNagad] = useState(localStorage.getItem('payment_qr_nagad') || '');
  const [qrRocket, setQrRocket] = useState(localStorage.getItem('payment_qr_rocket') || '');
  const [phoneBkash, setPhoneBkash] = useState(localStorage.getItem('payment_phone_bkash') || '');
  const [phoneNagad, setPhoneNagad] = useState(localStorage.getItem('payment_phone_nagad') || '');
  const [phoneRocket, setPhoneRocket] = useState(localStorage.getItem('payment_phone_rocket') || '');

  useEffect(() => {
    if (restaurant?.payment_qr_bkash) setQrBkash(restaurant.payment_qr_bkash);
    if (restaurant?.payment_qr_nagad) setQrNagad(restaurant.payment_qr_nagad);
    if (restaurant?.payment_qr_rocket) setQrRocket(restaurant.payment_qr_rocket);
    if (restaurant?.payment_phone_bkash) setPhoneBkash(restaurant.payment_phone_bkash);
    if (restaurant?.payment_phone_nagad) setPhoneNagad(restaurant.payment_phone_nagad);
    if (restaurant?.payment_phone_rocket) setPhoneRocket(restaurant.payment_phone_rocket);
  }, [restaurant]);

  const savePaymentSettings = async (payload) => {
    try {
      const res = await axios.put('/api/auth/payment-qr', payload);
      if (res.data.qr) {
        updateRestaurant({
          payment_qr_bkash: res.data.qr.payment_qr_bkash,
          payment_qr_nagad: res.data.qr.payment_qr_nagad,
          payment_qr_rocket: res.data.qr.payment_qr_rocket,
          payment_phone_bkash: res.data.qr.payment_phone_bkash,
          payment_phone_nagad: res.data.qr.payment_phone_nagad,
          payment_phone_rocket: res.data.qr.payment_phone_rocket,
        });
      }
    } catch {}
  };

  const handleQrUpload = (method, dataUrl) => {
    const payload = {};
    if (method === 'bKash') payload.bkash = dataUrl;
    if (method === 'Nagad') payload.nagad = dataUrl;
    if (method === 'Rocket') payload.rocket = dataUrl;
    savePaymentSettings(payload);
  };

  const readFileAsDataUrl = (file, setter, method) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target.result;
      setter(url);
      handleQrUpload(method, url);
      localStorage.setItem(`payment_qr_${method.toLowerCase()}`, url);
    };
    reader.readAsDataURL(file);
  };

  const handlePhoneChange = (method, value) => {
    const setter = method === 'bKash' ? setPhoneBkash : method === 'Nagad' ? setPhoneNagad : setPhoneRocket;
    setter(value);
    localStorage.setItem(`payment_phone_${method.toLowerCase()}`, value);
    const payload = {};
    if (method === 'bKash') payload.phone_bkash = value;
    if (method === 'Nagad') payload.phone_nagad = value;
    if (method === 'Rocket') payload.phone_rocket = value;
    savePaymentSettings(payload);
  };

  const clearQr = (item) => {
    item.setter('');
    localStorage.setItem(`payment_qr_${item.key}`, '');
    handleQrUpload(item.label, '');
  };

  const methods = [
    { key: 'bkash', label: 'bKash', color: '#E2136E', bg: '#FCE4EC', qr: qrBkash, qrSetter: setQrBkash, phone: phoneBkash, phoneSetter: setPhoneBkash },
    { key: 'nagad', label: 'Nagad', color: '#F58324', bg: '#FFF3E0', qr: qrNagad, qrSetter: setQrNagad, phone: phoneNagad, phoneSetter: setPhoneNagad },
    { key: 'rocket', label: 'Rocket', color: '#1565C0', bg: '#E3F2FD', qr: qrRocket, qrSetter: setQrRocket, phone: phoneRocket, phoneSetter: setPhoneRocket },
  ];

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2>Payments</h2>
      </div>

      {methods.map(m => (
        <div key={m.key} className="card" style={{ marginBottom: 16, border: `1px solid ${m.color}30` }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, marginBottom: 12, color: m.color }}>
            <CreditCard size={18} /> {m.label}
          </h3>

          {/* QR Code Upload */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 6, color: 'var(--gray-600)' }}>
              QR Code <span style={{ fontWeight: 400, color: 'var(--gray-400)' }}>(scan to pay)</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {m.qr ? (
                <img src={m.qr} alt={m.label} style={{ width: 60, height: 60, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--gray-200)' }} />
              ) : (
                <div style={{ width: 60, height: 60, borderRadius: 8, background: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)' }}>
                  <Image size={24} />
                </div>
              )}
              <label style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '8px', borderRadius: 8, border: '1px dashed var(--gray-300)',
                cursor: 'pointer', fontSize: 13, color: 'var(--gray-500)', background: 'var(--gray-50)',
              }}>
                <Upload size={16} /> {m.qr ? 'Change' : 'Upload'} QR
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) { readFileAsDataUrl(file, m.qrSetter, m.label); }
                }} />
              </label>
              {m.qr && (
                <button onClick={() => clearQr(m)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 18, padding: 4 }}>×</button>
              )}
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 6, color: 'var(--gray-600)' }}>
              <Phone size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Phone Number <span style={{ fontWeight: 400, color: 'var(--gray-400)' }}>(send money to number)</span>
            </label>
            <input
              value={m.phone}
              onChange={e => handlePhoneChange(m.label, e.target.value)}
              placeholder="01XXXXXXXXX"
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8, border: '2px solid var(--gray-200)',
                background: 'var(--white)', color: 'var(--gray-900)', fontWeight: 600, fontSize: 14,
                fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      ))}

      <div className="card" style={{ padding: '20px', textAlign: 'center', color: 'var(--gray-500)', fontSize: 13, lineHeight: 1.6 }}>
        <CreditCard size={24} style={{ display: 'block', margin: '0 auto 8px', color: 'var(--gray-300)' }} />
        Customers can scan the QR code or send money to the phone number when paying online.
      </div>
    </div>
  );
}
