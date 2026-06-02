import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'restaurant-tracker-secret-key-2024';

export function generateStaffToken(staff) {
  return jwt.sign(
    { id: staff.id, restaurant_id: staff.restaurant_id, role: staff.role, name: staff.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function staffAuthMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.restaurant_id) return res.status(401).json({ error: 'Invalid staff token' });
    req.staff = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
