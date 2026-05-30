import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getDB, queryOne, execute } from '../db.js';
import { generateToken } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'restaurant-tracker-secret-key-2024';

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  const existing = queryOne('SELECT id FROM restaurants WHERE email = ?', [email]);
  if (existing) {
    return res.status(400).json({ error: 'Email already registered' });
  }
  const id = uuidv4();
  const hashedPassword = await bcrypt.hash(password, 10);
  execute('INSERT INTO restaurants (id, name, email, password) VALUES (?, ?, ?, ?)', [id, name, email, hashedPassword]);
  const token = generateToken({ id, email, name });
  res.json({ token, restaurant: { id, name, email } });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const restaurant = queryOne('SELECT * FROM restaurants WHERE email = ?', [email]);
  if (!restaurant) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const valid = bcrypt.compareSync(password, restaurant.password);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = generateToken(restaurant);
  res.json({ token, restaurant: { id: restaurant.id, name: restaurant.name, email: restaurant.email } });
});

router.get('/me', (req, res) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token' });
  }
  try {
    const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET);
    res.json({ restaurant: { id: decoded.id, name: decoded.name, email: decoded.email } });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
