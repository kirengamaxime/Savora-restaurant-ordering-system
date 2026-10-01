import { db } from "./db.js";

function toHelpRequestJSON(row) {
  return {
    id: String(row.id),
    orderType: row.order_type,
    tableNumber: row.table_number,
    status: row.status,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at
  };
}

export function createHelpRequest({ orderType, tableNumber }) {
  const createdAt = new Date().toISOString();
  const info = db
    .prepare("INSERT INTO help_requests (order_type, table_number, status, created_at) VALUES (?, ?, 'pending', ?)")
    .run(orderType, tableNumber || null, createdAt);

  const row = db.prepare("SELECT * FROM help_requests WHERE id = ?").get(info.lastInsertRowid);
  return toHelpRequestJSON(row);
}

export function listPendingHelpRequests() {
  return db
    .prepare("SELECT * FROM help_requests WHERE status = 'pending' ORDER BY created_at ASC")
    .all()
    .map(toHelpRequestJSON);
}

export function resolveHelpRequest(id) {
  const existing = db.prepare("SELECT id FROM help_requests WHERE id = ?").get(id);
  if (!existing) return null;

  db.prepare("UPDATE help_requests SET status = 'resolved', resolved_at = ? WHERE id = ?").run(
    new Date().toISOString(),
    id
  );

  const row = db.prepare("SELECT * FROM help_requests WHERE id = ?").get(id);
  return toHelpRequestJSON(row);
}
