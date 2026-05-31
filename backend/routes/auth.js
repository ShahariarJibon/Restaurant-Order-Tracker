import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { queryOne, execute } from '../db.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'restaurant-tracker-secret-key-2024';

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
  res.json({ token, restaurant: { id, name, email, currency: 'BDT' } });
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
  res.json({ token, restaurant: { id: restaurant.id, name: restaurant.name, email: restaurant.email, currency: restaurant.currency || 'BDT' } });
});

router.get('/me', authMiddleware, async (req, res) => {
  const restaurant = await queryOne('SELECT * FROM restaurants WHERE id = ?', [req.restaurant.id]);
  if (!restaurant) return res.status(401).json({ error: 'Not found' });
  res.json({ restaurant: { id: restaurant.id, name: restaurant.name, email: restaurant.email, currency: restaurant.currency || 'BDT' } });
});

router.put('/currency', authMiddleware, async (req, res) => {
  const { currency } = req.body;
  if (!currency) return res.status(400).json({ error: 'Currency is required' });
  await execute('UPDATE restaurants SET currency = ? WHERE id = ?', [currency, req.restaurant.id]);
  res.json({ success: true, currency });
});

export default router;
