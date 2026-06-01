import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { queryOne, execute } from '../db.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'restaurant-tracker-secret-key-2024';

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `logo-${req.restaurant.id}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  const existing = await queryOne('SELECT id FROM restaurants WHERE email = ?', [email]);
  if (existing) {
    return res.status(400).json({ error: 'Email already registered' });
  }
  const id = uuidv4();
  const hashedPassword = await bcrypt.hash(password, 10);
  await execute('INSERT INTO restaurants (id, name, email, password) VALUES (?, ?, ?, ?)', [id, name, email, hashedPassword]);
  const token = generateToken({ id, email, name });
  res.json({ token, restaurant: { id, name, email, currency: 'BDT', logo: '', plan: 'free', status: 'active', payment_qr_bkash: '', payment_qr_nagad: '', payment_qr_rocket: '', payment_phone_bkash: '', payment_phone_nagad: '', payment_phone_rocket: '' } });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const restaurant = await queryOne('SELECT * FROM restaurants WHERE email = ?', [email]);
  if (!restaurant) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const valid = bcrypt.compareSync(password, restaurant.password);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = generateToken(restaurant);
  res.json({ token, restaurant: { id: restaurant.id, name: restaurant.name, email: restaurant.email, currency: restaurant.currency || 'BDT', logo: restaurant.logo || '', plan: restaurant.plan || 'free', status: restaurant.status || 'active', payment_qr_bkash: restaurant.payment_qr_bkash || '', payment_qr_nagad: restaurant.payment_qr_nagad || '', payment_qr_rocket: restaurant.payment_qr_rocket || '', payment_phone_bkash: restaurant.payment_phone_bkash || '', payment_phone_nagad: restaurant.payment_phone_nagad || '', payment_phone_rocket: restaurant.payment_phone_rocket || '' } });
});

router.get('/me', authMiddleware, async (req, res) => {
  const restaurant = await queryOne('SELECT * FROM restaurants WHERE id = ?', [req.restaurant.id]);
  if (!restaurant) return res.status(401).json({ error: 'Not found' });
  res.json({
    restaurant: {
      id: restaurant.id, name: restaurant.name, email: restaurant.email,
      currency: restaurant.currency || 'BDT', logo: restaurant.logo || '',
      plan: restaurant.plan || 'free', status: restaurant.status || 'active',
      payment_qr_bkash: restaurant.payment_qr_bkash || '',
      payment_qr_nagad: restaurant.payment_qr_nagad || '',
      payment_qr_rocket: restaurant.payment_qr_rocket || '',
      payment_phone_bkash: restaurant.payment_phone_bkash || '',
      payment_phone_nagad: restaurant.payment_phone_nagad || '',
      payment_phone_rocket: restaurant.payment_phone_rocket || '',
    }
  });
});

router.put('/currency', authMiddleware, async (req, res) => {
  const { currency } = req.body;
  if (!currency) return res.status(400).json({ error: 'Currency is required' });
  await execute('UPDATE restaurants SET currency = ? WHERE id = ?', [currency, req.restaurant.id]);
  res.json({ success: true, currency });
});

router.post('/logo', authMiddleware, upload.single('logo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const logoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  await execute('UPDATE restaurants SET logo = ? WHERE id = ?', [logoUrl, req.restaurant.id]);
  res.json({ success: true, logo: logoUrl });
});

router.put('/payment-qr', authMiddleware, async (req, res) => {
  const { bkash, nagad, rocket, phone_bkash, phone_nagad, phone_rocket } = req.body;
  const updates = [];
  const params = [];
  if (bkash !== undefined) { updates.push('payment_qr_bkash = ?'); params.push(bkash); }
  if (nagad !== undefined) { updates.push('payment_qr_nagad = ?'); params.push(nagad); }
  if (rocket !== undefined) { updates.push('payment_qr_rocket = ?'); params.push(rocket); }
  if (phone_bkash !== undefined) { updates.push('payment_phone_bkash = ?'); params.push(phone_bkash); }
  if (phone_nagad !== undefined) { updates.push('payment_phone_nagad = ?'); params.push(phone_nagad); }
  if (phone_rocket !== undefined) { updates.push('payment_phone_rocket = ?'); params.push(phone_rocket); }
  if (updates.length === 0) return res.status(400).json({ error: 'No data provided' });
  params.push(req.restaurant.id);
  await execute(`UPDATE restaurants SET ${updates.join(', ')} WHERE id = ?`, params);
  const updated = await queryOne(
    'SELECT payment_qr_bkash, payment_qr_nagad, payment_qr_rocket, payment_phone_bkash, payment_phone_nagad, payment_phone_rocket FROM restaurants WHERE id = ?',
    [req.restaurant.id]
  );
  res.json({ success: true, qr: updated });
});

router.get('/payment-info', authMiddleware, async (req, res) => {
  const r = await queryOne(
    'SELECT payment_qr_bkash, payment_qr_nagad, payment_qr_rocket, payment_phone_bkash, payment_phone_nagad, payment_phone_rocket FROM restaurants WHERE id = ?',
    [req.restaurant.id]
  );
  res.json({
    bkash: r?.payment_qr_bkash || '',
    nagad: r?.payment_qr_nagad || '',
    rocket: r?.payment_qr_rocket || '',
    phone_bkash: r?.payment_phone_bkash || '',
    phone_nagad: r?.payment_phone_nagad || '',
    phone_rocket: r?.payment_phone_rocket || '',
  });
});

export default router;
