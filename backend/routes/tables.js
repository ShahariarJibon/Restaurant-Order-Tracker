import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { queryAll, execute } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, (req, res) => {
  const tables = queryAll('SELECT * FROM tables_tbl WHERE restaurant_id = ? ORDER BY table_number', [req.restaurant.id]);
  res.json(tables);
});

router.post('/', authMiddleware, async (req, res) => {
  const { table_number } = req.body;
  if (!table_number) return res.status(400).json({ error: 'Table number is required' });
  const id = uuidv4();
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const menuUrl = `${baseUrl}/menu/${req.restaurant.id}?table=${id}`;
  let qrCode = '';
  try {
    qrCode = await QRCode.toDataURL(menuUrl);
  } catch {
    qrCode = '';
  }
  execute('INSERT INTO tables_tbl (id, restaurant_id, table_number, qr_code) VALUES (?, ?, ?, ?)',
    [id, req.restaurant.id, parseInt(table_number), qrCode]);
  res.json({ id, table_number: parseInt(table_number), qr_code: qrCode, menu_url: menuUrl });
});

router.delete('/:id', authMiddleware, (req, res) => {
  execute('DELETE FROM tables_tbl WHERE id = ? AND restaurant_id = ?', [req.params.id, req.restaurant.id]);
  res.json({ success: true });
});

export default router;
