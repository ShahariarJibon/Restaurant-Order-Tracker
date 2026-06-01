import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { CreditCard, Upload, Image } from '../components/Icons';

export default function AdminPayments() {
  const { restaurant, updateRestaurant } = useAuth();
  const [qrBkash, setQrBkash] = useState(localStorage.getItem('payment_qr_bkash') || '');
  const [qrNagad, setQrNagad] = useState(localStorage.getItem('payment_qr_nagad') || '');
  const [qrRocket, setQrRocket] = useState(localStorage.getItem('payment_qr_rocket') || '');

  useEffect(() => {
    if (restaurant?.payment_qr_bkash) setQrBkash(restaurant.payment_qr_bkash);
    if (restaurant?.payment_qr_nagad) setQrNagad(restaurant.payment_qr_nagad);
    if (restaurant?.payment_qr_rocket) setQrRocket(restaurant.payment_qr_rocket);
  }, [restaurant]);

  const handleQrUpload = async (method, dataUrl) => {
    const payload = {};
    if (method === 'bKash') payload.bkash = dataUrl;
    if (method === 'Nagad') payload.nagad = dataUrl;
    if (method === 'Rocket') payload.rocket = dataUrl;
    try {
      const res = await axios.put('/api/auth/payment-qr', payload);
      if (res.data.qr) {
        updateRestaurant({
          payment_qr_bkash: res.data.qr.payment_qr_bkash,
          payment_qr_nagad: res.data.qr.payment_qr_nagad,
          payment_qr_rocket: res.data.qr.payment_qr_rocket,
        });
      }
    } catch {}
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

  const qrItems = [
    { key: 'bkash', label: 'bKash', img: qrBkash, setter: setQrBkash },
    { key: 'nagad', label: 'Nagad', img: qrNagad, setter: setQrNagad },
    { key: 'rocket', label: 'Rocket', img: qrRocket, setter: setQrRocket },
  ];

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2>Payments</h2>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
          <CreditCard size={18} style={{ color: 'var(--orange)' }} /> Payment QR Codes
        </h3>
        <p style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 12 }}>
          Upload your bKash, Nagad, and Rocket QR codes. Customers will scan these to pay.
        </p>
        {qrItems.map(item => (
          <div key={item.key} style={{ marginBottom: 10 }}>
            <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 4 }}>{item.label}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {item.img ? (
                <img src={item.img} alt={item.label} style={{ width: 60, height: 60, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--gray-200)' }} />
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
                <Upload size={16} /> {item.img ? 'Change' : 'Upload'} QR
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) { readFileAsDataUrl(file, item.setter, item.label); }
                }} />
              </label>
              {item.img && (
                <button onClick={() => { item.setter(''); localStorage.setItem(`payment_qr_${item.key}`, ''); handleQrUpload(item.label, ''); }} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 18, padding: 4 }}>×</button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: '20px', textAlign: 'center', color: 'var(--gray-500)', fontSize: 13, lineHeight: 1.6 }}>
        <CreditCard size={24} style={{ display: 'block', margin: '0 auto 8px', color: 'var(--gray-300)' }} />
        After uploading QR codes, customers can pay online via their preferred method when placing orders.
      </div>
    </div>
  );
}
