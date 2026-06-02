import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'restaurant.db');

let db = null;
let pgPool = null;
let usingPg = false;

function convertSql(sql) {
  let idx = 0;
  return sql.replace(/\?/g, () => `$${++idx}`);
}

// --- SQLite helpers ---
function sqliteQueryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function sqliteQueryOne(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  let row = null;
  if (stmt.step()) row = stmt.getAsObject();
  stmt.free();
  return row;
}

function sqliteExecute(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  stmt.step();
  stmt.free();
}

function sqliteSave() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// --- Init ---
export async function initDB() {
  if (process.env.DATABASE_URL) {
    usingPg = true;
    pgPool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS restaurants (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL, currency TEXT DEFAULT 'BDT', logo TEXT DEFAULT '',
        payment_qr_bkash TEXT DEFAULT '', payment_qr_nagad TEXT DEFAULT '',
        payment_qr_rocket TEXT DEFAULT '', created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY, restaurant_id TEXT NOT NULL, name TEXT NOT NULL, sort_order INTEGER DEFAULT 0
      )
    `);
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id TEXT PRIMARY KEY, restaurant_id TEXT NOT NULL, category_id TEXT,
        name TEXT NOT NULL, price REAL NOT NULL, description TEXT DEFAULT '',
        image TEXT DEFAULT '', available INTEGER DEFAULT 1, created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS tables_tbl (
        id TEXT PRIMARY KEY, restaurant_id TEXT NOT NULL, table_number INTEGER NOT NULL, qr_code TEXT DEFAULT ''
      )
    `);
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY, restaurant_id TEXT NOT NULL, table_id TEXT,
        customer_name TEXT DEFAULT 'Guest', status TEXT DEFAULT 'pending',
        total REAL DEFAULT 0, created_at TIMESTAMP DEFAULT NOW(),
        payment_method TEXT DEFAULT '', trx_id TEXT DEFAULT '',
        payment_screenshot TEXT DEFAULT '', customer_phone TEXT DEFAULT '',
        payment_status TEXT DEFAULT ''
      )
    `);
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY, order_id TEXT NOT NULL,
        item_name TEXT NOT NULL, quantity INTEGER NOT NULL, price REAL NOT NULL
      )
    `);
    try { await pgPool.query('ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT \'BDT\''); } catch {}
    try { await pgPool.query('ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS logo TEXT DEFAULT \'\''); } catch {}
    try { await pgPool.query('ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT \'free\''); } catch {}
    try { await pgPool.query('ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS status TEXT DEFAULT \'active\''); } catch {}
    try { await pgPool.query('ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS plan_expiry TEXT DEFAULT \'\''); } catch {}
    try { await pgPool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT ''"); } catch {}
    try { await pgPool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS trx_id TEXT DEFAULT ''"); } catch {}
    try { await pgPool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_screenshot TEXT DEFAULT ''"); } catch {}
    try { await pgPool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone TEXT DEFAULT ''"); } catch {}
    try { await pgPool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT ''"); } catch {}
    try { await pgPool.query("ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS payment_qr_bkash TEXT DEFAULT ''"); } catch {}
    try { await pgPool.query("ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS payment_qr_nagad TEXT DEFAULT ''"); } catch {}
    try { await pgPool.query("ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS payment_qr_rocket TEXT DEFAULT ''"); } catch {}
    try { await pgPool.query("ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS payment_phone_bkash TEXT DEFAULT ''"); } catch {}
    try { await pgPool.query("ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS payment_phone_nagad TEXT DEFAULT ''"); } catch {}
    try { await pgPool.query("ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS payment_phone_rocket TEXT DEFAULT ''"); } catch {}
    try {
      await pgPool.query(`
        CREATE TABLE IF NOT EXISTS ratings (
          id TEXT PRIMARY KEY, restaurant_id TEXT NOT NULL,
          table_id TEXT, rating INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
    } catch {}
    try {
      await pgPool.query(`
        CREATE TABLE IF NOT EXISTS payments (
          id TEXT PRIMARY KEY, restaurant_id TEXT NOT NULL,
          method TEXT NOT NULL, trx_id TEXT NOT NULL,
          sender_number TEXT DEFAULT '', amount REAL NOT NULL,
          plan_type TEXT NOT NULL, status TEXT DEFAULT 'pending',
          screenshot TEXT DEFAULT '', created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      try { await pgPool.query("ALTER TABLE payments ADD COLUMN IF NOT EXISTS screenshot TEXT DEFAULT ''"); } catch {}
    } catch {}
    try {
      await pgPool.query(`
        CREATE TABLE IF NOT EXISTS feedback (
          id TEXT PRIMARY KEY, restaurant_id TEXT NOT NULL,
          customer_name TEXT DEFAULT 'Anonymous', message TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
    } catch {}
    try {
      await pgPool.query(`
        CREATE TABLE IF NOT EXISTS staff (
          id TEXT PRIMARY KEY, restaurant_id TEXT NOT NULL,
          name TEXT NOT NULL, email TEXT NOT NULL,
          password TEXT NOT NULL, role TEXT DEFAULT 'chef',
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
    } catch {}
  } else {
    const SQL = await initSqlJs();
    if (fs.existsSync(DB_PATH)) {
      db = new SQL.Database(fs.readFileSync(DB_PATH));
    } else {
      db = new SQL.Database();
    }
    db.run('PRAGMA foreign_keys = ON');
    setInterval(() => sqliteSave(), 5000);
    db.run(`CREATE TABLE IF NOT EXISTS restaurants (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, currency TEXT DEFAULT 'BDT', logo TEXT DEFAULT '', payment_qr_bkash TEXT DEFAULT '', payment_qr_nagad TEXT DEFAULT '', payment_qr_rocket TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now')))`);
    db.run(`CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, restaurant_id TEXT NOT NULL, name TEXT NOT NULL, sort_order INTEGER DEFAULT 0)`);
    db.run(`CREATE TABLE IF NOT EXISTS menu_items (id TEXT PRIMARY KEY, restaurant_id TEXT NOT NULL, category_id TEXT, name TEXT NOT NULL, price REAL NOT NULL, description TEXT DEFAULT '', image TEXT DEFAULT '', available INTEGER DEFAULT 1, created_at TEXT DEFAULT (datetime('now')))`);
    db.run(`CREATE TABLE IF NOT EXISTS tables_tbl (id TEXT PRIMARY KEY, restaurant_id TEXT NOT NULL, table_number INTEGER NOT NULL, qr_code TEXT DEFAULT '')`);
    db.run(`CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, restaurant_id TEXT NOT NULL, table_id TEXT, customer_name TEXT DEFAULT 'Guest', status TEXT DEFAULT 'pending', total REAL DEFAULT 0, created_at TEXT DEFAULT (datetime('now')), payment_method TEXT DEFAULT '', trx_id TEXT DEFAULT '', payment_screenshot TEXT DEFAULT '', customer_phone TEXT DEFAULT '', payment_status TEXT DEFAULT '')`);
    db.run(`CREATE TABLE IF NOT EXISTS order_items (id TEXT PRIMARY KEY, order_id TEXT NOT NULL, item_name TEXT NOT NULL, quantity INTEGER NOT NULL, price REAL NOT NULL)`);
    try { db.run("ALTER TABLE restaurants ADD COLUMN currency TEXT DEFAULT 'BDT'"); } catch {}
    try { db.run("ALTER TABLE restaurants ADD COLUMN logo TEXT DEFAULT ''"); } catch {}
    try { db.run("ALTER TABLE restaurants ADD COLUMN plan TEXT DEFAULT 'free'"); } catch {}
    try { db.run("ALTER TABLE restaurants ADD COLUMN status TEXT DEFAULT 'active'"); } catch {}
    try { db.run("ALTER TABLE restaurants ADD COLUMN plan_expiry TEXT DEFAULT ''"); } catch {}
    try { db.run("ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT ''"); } catch {}
    try { db.run("ALTER TABLE orders ADD COLUMN trx_id TEXT DEFAULT ''"); } catch {}
    try { db.run("ALTER TABLE orders ADD COLUMN payment_screenshot TEXT DEFAULT ''"); } catch {}
    try { db.run("ALTER TABLE orders ADD COLUMN customer_phone TEXT DEFAULT ''"); } catch {}
    try { db.run("ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT ''"); } catch {}
    try { db.run("ALTER TABLE restaurants ADD COLUMN payment_qr_bkash TEXT DEFAULT ''"); } catch {}
    try { db.run("ALTER TABLE restaurants ADD COLUMN payment_qr_nagad TEXT DEFAULT ''"); } catch {}
    try { db.run("ALTER TABLE restaurants ADD COLUMN payment_qr_rocket TEXT DEFAULT ''"); } catch {}
    try { db.run("ALTER TABLE restaurants ADD COLUMN payment_phone_bkash TEXT DEFAULT ''"); } catch {}
    try { db.run("ALTER TABLE restaurants ADD COLUMN payment_phone_nagad TEXT DEFAULT ''"); } catch {}
    try { db.run("ALTER TABLE restaurants ADD COLUMN payment_phone_rocket TEXT DEFAULT ''"); } catch {}
    try { db.run("CREATE TABLE IF NOT EXISTS ratings (id TEXT PRIMARY KEY, restaurant_id TEXT NOT NULL, table_id TEXT, rating INTEGER NOT NULL, created_at TEXT DEFAULT (datetime('now')))"); } catch {}
    try { db.run("CREATE TABLE IF NOT EXISTS payments (id TEXT PRIMARY KEY, restaurant_id TEXT NOT NULL, method TEXT NOT NULL, trx_id TEXT NOT NULL, sender_number TEXT DEFAULT '', amount REAL NOT NULL, plan_type TEXT NOT NULL, status TEXT DEFAULT 'pending', screenshot TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now')))"); } catch {}
    try { db.run("ALTER TABLE payments ADD COLUMN screenshot TEXT DEFAULT ''"); } catch {}
    try { db.run("CREATE TABLE IF NOT EXISTS feedback (id TEXT PRIMARY KEY, restaurant_id TEXT NOT NULL, customer_name TEXT DEFAULT 'Anonymous', message TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')))"); } catch {}
    try { db.run("CREATE TABLE IF NOT EXISTS staff (id TEXT PRIMARY KEY, restaurant_id TEXT NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL, password TEXT NOT NULL, role TEXT DEFAULT 'chef', created_at TEXT DEFAULT (datetime('now')))"); } catch {}
    sqliteSave();
    console.log('Using SQLite');
  }
}

export function getDB() {
  return usingPg ? pgPool : db;
}

export async function queryAll(sql, params = []) {
  if (usingPg) {
    const result = await pgPool.query(convertSql(sql), params);
    return result.rows;
  }
  return sqliteQueryAll(sql, params);
}

export async function queryOne(sql, params = []) {
  if (usingPg) {
    const result = await pgPool.query(convertSql(sql), params);
    return result.rows[0] || null;
  }
  return sqliteQueryOne(sql, params);
}

export async function execute(sql, params = []) {
  if (usingPg) {
    await pgPool.query(convertSql(sql), params);
  } else {
    sqliteExecute(sql, params);
  }
}
