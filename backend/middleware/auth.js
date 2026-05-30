import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'restaurant-tracker-secret-key-2024';

export function generateToken(restaurant) {
  return jwt.sign(
    { id: restaurant.id, email: restaurant.email, name: restaurant.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.restaurant = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
