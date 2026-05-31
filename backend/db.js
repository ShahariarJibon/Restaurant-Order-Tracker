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
        password TEXT NOT NULL, currency TEXT DEFAULT 'BDT', created_at TIMESTAMP DEFAULT NOW()
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
        total REAL DEFAULT 0, created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY, order_id TEXT NOT NULL,
        item_name TEXT NOT NULL, quantity INTEGER NOT NULL, price REAL NOT NULL
      )
    `);
    try { await pgPool.query('ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT \'BDT\''); } catch {}
    console.log('Using PostgreSQL');
  } else {
    const SQL = await initSqlJs();
    if (fs.existsSync(DB_PATH)) {
      db = new SQL.Database(fs.readFileSync(DB_PATH));
    } else {
      db = new SQL.Database();
    }
    db.run('PRAGMA foreign_keys = ON');
    setInterval(() => sqliteSave(), 5000);
    db.run(`CREATE TABLE IF NOT EXISTS restaurants (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, currency TEXT DEFAULT 'BDT', created_at TEXT DEFAULT (datetime('now')))`);
    db.run(`CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, restaurant_id TEXT NOT NULL, name TEXT NOT NULL, sort_order INTEGER DEFAULT 0)`);
    db.run(`CREATE TABLE IF NOT EXISTS menu_items (id TEXT PRIMARY KEY, restaurant_id TEXT NOT NULL, category_id TEXT, name TEXT NOT NULL, price REAL NOT NULL, description TEXT DEFAULT '', image TEXT DEFAULT '', available INTEGER DEFAULT 1, created_at TEXT DEFAULT (datetime('now')))`);
    db.run(`CREATE TABLE IF NOT EXISTS tables_tbl (id TEXT PRIMARY KEY, restaurant_id TEXT NOT NULL, table_number INTEGER NOT NULL, qr_code TEXT DEFAULT '')`);
    db.run(`CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, restaurant_id TEXT NOT NULL, table_id TEXT, customer_name TEXT DEFAULT 'Guest', status TEXT DEFAULT 'pending', total REAL DEFAULT 0, created_at TEXT DEFAULT (datetime('now')))`);
    db.run(`CREATE TABLE IF NOT EXISTS order_items (id TEXT PRIMARY KEY, order_id TEXT NOT NULL, item_name TEXT NOT NULL, quantity INTEGER NOT NULL, price REAL NOT NULL)`);
    try { db.run("ALTER TABLE restaurants ADD COLUMN currency TEXT DEFAULT 'BDT'"); } catch {}
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
