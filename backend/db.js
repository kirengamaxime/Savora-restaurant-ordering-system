// Real embedded SQL database via Node's built-in `node:sqlite` (SQLite) —
// no native compilation, no extra service to run. It's still a single-file
// database, so for a multi-location or high-concurrency deployment you'd
// eventually want a client/server database (PostgreSQL) instead — but this
// gives you real schema, foreign keys, and transactions instead of hand-
// rolled JSON files.
//
// Note: node:sqlite is marked experimental in Node 22. If you're on an
// older Node version, swap this file's `DatabaseSync` import for the
// `better-sqlite3` package (same synchronous API shape) with minimal changes.

import { DatabaseSync } from "node:sqlite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { menu as seedMenu } from "./data/menu.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "savora.db");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

export const db = new DatabaseSync(DB_FILE);

db.exec("PRAGMA foreign_keys = ON");
db.exec("PRAGMA journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS dishes (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    prep_minutes INTEGER,
    image TEXT,
    sold_out INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS ingredients (
    id TEXT PRIMARY KEY,
    dish_id TEXT NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    removable INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_type TEXT NOT NULL,
    table_number TEXT,
    customer_name TEXT,
    customer_phone TEXT,
    payment_method TEXT,
    total INTEGER NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'pending',
    kitchen_status TEXT NOT NULL DEFAULT 'received',
    created_at TEXT NOT NULL,
    paid_at TEXT,
    preparing_at TEXT,
    ready_at TEXT,
    served_at TEXT,
    cancelled_at TEXT,
    cancellation_reason TEXT,
    cancelled_by_staff_id TEXT
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    dish_id TEXT,
    image TEXT,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    removed_ingredients TEXT,
    note TEXT
  );

  CREATE TABLE IF NOT EXISTS help_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_type TEXT NOT NULL,
    table_number TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL,
    resolved_at TEXT
  );

  CREATE TABLE IF NOT EXISTS staff (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

// Migration: add tracking_token to orders created before this column existed.
// (customer-facing order tracking — see store.js / server.js "/api/track/:token")
const orderColumns = db.prepare("PRAGMA table_info(orders)").all().map((c) => c.name);
if (!orderColumns.includes("tracking_token")) {
  db.exec("ALTER TABLE orders ADD COLUMN tracking_token TEXT");
}

// Migration: add order-cancellation columns to orders created before this
// feature existed. (manager-only order voiding — see store.js / server.js
// "PATCH /api/admin/orders/:id/cancel")
if (!orderColumns.includes("cancelled_at")) {
  db.exec("ALTER TABLE orders ADD COLUMN cancelled_at TEXT");
}
if (!orderColumns.includes("cancellation_reason")) {
  db.exec("ALTER TABLE orders ADD COLUMN cancellation_reason TEXT");
}
if (!orderColumns.includes("cancelled_by_staff_id")) {
  db.exec("ALTER TABLE orders ADD COLUMN cancelled_by_staff_id TEXT");
}

// Migration: add dish_id/image to order_items created before these columns
// existed. (enables "Order Again" — see store.js / Orders.jsx)
const orderItemColumns = db.prepare("PRAGMA table_info(order_items)").all().map((c) => c.name);
if (!orderItemColumns.includes("dish_id")) {
  db.exec("ALTER TABLE order_items ADD COLUMN dish_id TEXT");
}
if (!orderItemColumns.includes("image")) {
  db.exec("ALTER TABLE order_items ADD COLUMN image TEXT");
}

// Cosmetic: make order numbers start around #201 like the earlier demo data,
// instead of #1. Only takes effect if the table has never had a row.
db.exec(
  "INSERT INTO sqlite_sequence (name, seq) SELECT 'orders', 200 WHERE NOT EXISTS (SELECT 1 FROM sqlite_sequence WHERE name = 'orders')"
);

// Seed the menu tables from the mock data file, but only on a fresh database
// — once real edits happen through the Menu Manager, this never overwrites them.
const { count: categoryCount } = db.prepare("SELECT COUNT(*) as count FROM categories").get();
if (categoryCount === 0) {
  const insertCategory = db.prepare("INSERT INTO categories (id, name, sort_order) VALUES (?, ?, ?)");
  const insertDish = db.prepare(
    "INSERT INTO dishes (id, category_id, name, description, price, prep_minutes, image, sold_out) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  );
  const insertIngredient = db.prepare(
    "INSERT INTO ingredients (id, dish_id, name, removable) VALUES (?, ?, ?, ?)"
  );

  seedMenu.forEach((category, index) => {
    insertCategory.run(category.id, category.name, index);
    category.dishes.forEach((dish) => {
      insertDish.run(
        dish.id,
        category.id,
        dish.name,
        dish.description || "",
        dish.price,
        dish.prepMinutes || 10,
        dish.image || "",
        dish.soldOut ? 1 : 0
      );
      (dish.ingredients || []).forEach((ing) => {
        insertIngredient.run(ing.id, dish.id, ing.name, ing.removable ? 1 : 0);
      });
    });
  });
}

// Seed two default staff accounts on a fresh database — one per role, so
// the app is usable immediately. Passwords are hashed even for these
// defaults; override the seed values via env vars before the first run if
// you don't want the well-known demo passwords ever touching the database.
// Once staff exist, this never runs again — add/remove real accounts via
// the Manager dashboard's Staff tab instead of editing env vars later.
const { count: staffCount } = db.prepare("SELECT COUNT(*) as count FROM staff").get();
if (staffCount === 0) {
  const insertStaff = db.prepare(
    "INSERT INTO staff (id, username, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)"
  );
  const now = new Date().toISOString();
  const defaults = [
    { username: process.env.MANAGER_USER || "manager", password: process.env.MANAGER_PASS || "manager123", role: "manager" },
    { username: process.env.KITCHEN_USER || "kitchen", password: process.env.KITCHEN_PASS || "kitchen123", role: "kitchen" }
  ];
  defaults.forEach((account) => {
    insertStaff.run(`staff-${nanoid(8)}`, account.username, bcrypt.hashSync(account.password, 10), account.role, now);
  });
}
