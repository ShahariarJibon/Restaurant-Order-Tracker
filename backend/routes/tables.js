import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { queryAll, execute } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
  const tables = await queryAll('SELECT * FROM tables_tbl WHERE restaurant_id = ? ORDER BY table_number', [req.restaurant.id]);
  res.json(tables);
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { table_number } = req.body;
    if (!table_number) return res.status(400).json({ error: 'Table number is required' });
    const id = uuidv4();
    const baseUrl = process.env.FRONTEND_URL || `https://${req.get('host')}`.replace('api.', '');
    const menuUrl = `${baseUrl}/menu/${req.restaurant.id}?table=${id}`;
    let qrCode = '';
    try {
      qrCode = await QRCode.toDataURL(menuUrl, { errorCorrectionLevel: 'L', margin: 1, width: 300 });
    } catch {
      try {
        qrCode = await QRCode.toString(menuUrl, { type: 'svg', margin: 1 });
        qrCode = 'data:image/svg+xml;base64,' + Buffer.from(qrCode).toString('base64');
      } catch {
        qrCode = '';
      }
    }
    await execute('INSERT INTO tables_tbl (id, restaurant_id, table_number, qr_code) VALUES (?, ?, ?, ?)',
      [id, req.restaurant.id, parseInt(table_number), qrCode]);
    res.json({ id, table_number: parseInt(table_number), qr_code: qrCode, menu_url: menuUrl });
  } catch (e) {
    console.error('Add table error:', e);
    res.status(500).json({ error: 'Failed to add table' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  await execute('DELETE FROM tables_tbl WHERE id = ? AND restaurant_id = ?', [req.params.id, req.restaurant.id]);
  res.json({ success: true });
});

export default router;
