import { nanoid } from "nanoid";
import { db } from "./db.js";

function loadOrder(id) {
  const row = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
  if (!row) return null;
  const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(id);
  return toOrderJSON(row, items);
}

function toOrderJSON(row, itemRows) {
  return {
    id: String(row.id),
    items: itemRows.map((it) => ({
      dishId: it.dish_id || null,
      image: it.image || null,
      name: it.name,
      price: it.price,
      quantity: it.quantity,
      removedIngredients: it.removed_ingredients ? JSON.parse(it.removed_ingredients) : [],
      note: it.note || ""
    })),
    orderType: row.order_type,
    tableNumber: row.table_number,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    paymentMethod: row.payment_method,
    total: row.total,
    paymentStatus: row.payment_status,
    kitchenStatus: row.kitchen_status,
    createdAt: row.created_at,
    paidAt: row.paid_at,
    preparingAt: row.preparing_at,
    readyAt: row.ready_at,
    servedAt: row.served_at,
    trackingToken: row.tracking_token,
    cancelledAt: row.cancelled_at,
    cancellationReason: row.cancellation_reason,
    cancelledByStaffId: row.cancelled_by_staff_id
  };
}

export function createOrder({ items, orderType, tableNumber, customerName, customerPhone, paymentMethod, total }) {
  const createdAt = new Date().toISOString();
  const trackingToken = nanoid(16);

  const info = db
    .prepare(
      `INSERT INTO orders
        (order_type, table_number, customer_name, customer_phone, payment_method, total, payment_status, kitchen_status, created_at, tracking_token)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', 'received', ?, ?)`
    )
    .run(
      orderType,
      tableNumber || null,
      customerName || null,
      customerPhone || null,
      paymentMethod,
      total,
      createdAt,
      trackingToken
    );

  const orderId = info.lastInsertRowid;

  const insertItem = db.prepare(
    "INSERT INTO order_items (order_id, dish_id, image, name, price, quantity, removed_ingredients, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  );
  items.forEach((item) => {
    insertItem.run(
      orderId,
      item.dishId || null,
      item.image || null,
      item.name,
      item.price,
      item.quantity,
      JSON.stringify(item.removedIngredients || []),
      item.note || ""
    );
  });

  return loadOrder(orderId);
}

export function getOrder(id) {
  return loadOrder(id);
}

// Looked up via the customer-facing tracking link (/track/:token) — uses an
// unguessable random token instead of the sequential order id, so a customer
// sharing or bookmarking their tracking link doesn't expose other orders.
export function getOrderByToken(token) {
  const row = db.prepare("SELECT * FROM orders WHERE tracking_token = ?").get(token);
  if (!row) return null;
  const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(row.id);
  return toOrderJSON(row, items);
}

export function updatePaymentStatus(id, status) {
  const existing = db.prepare("SELECT id FROM orders WHERE id = ?").get(id);
  if (!existing) return null;

  if (status === "paid") {
    db.prepare("UPDATE orders SET payment_status = ?, paid_at = ? WHERE id = ?").run(
      status,
      new Date().toISOString(),
      id
    );
  } else {
    db.prepare("UPDATE orders SET payment_status = ? WHERE id = ?").run(status, id);
  }

  return loadOrder(id);
}

export function updateKitchenStatus(id, status) {
  const existing = db.prepare("SELECT id FROM orders WHERE id = ?").get(id);
  if (!existing) return null;

  const column = { preparing: "preparing_at", ready: "ready_at", served: "served_at" }[status];
  if (column) {
    db.prepare(`UPDATE orders SET kitchen_status = ?, ${column} = ? WHERE id = ?`).run(
      status,
      new Date().toISOString(),
      id
    );
  } else {
    db.prepare("UPDATE orders SET kitchen_status = ? WHERE id = ?").run(status, id);
  }

  return loadOrder(id);
}

// Manager-only voiding of an order — a business/financial decision (affects
// revenue reporting, may need a real-world refund) rather than a kitchen
// operation, so this is deliberately separate from updateKitchenStatus and
// gated differently server-side (see server.js "requireManager"). Can't
// cancel an order that's already been served (the food went out — that's a
// completed transaction, not a live one) or one that's already cancelled.
export function cancelOrder(id, reason, staffId) {
  const existing = db.prepare("SELECT kitchen_status FROM orders WHERE id = ?").get(id);
  if (!existing) return { error: "Order not found" };
  if (existing.kitchen_status === "served") return { error: "Can't cancel an order that's already been served" };
  if (existing.kitchen_status === "cancelled") return { error: "Order is already cancelled" };

  db.prepare(
    "UPDATE orders SET kitchen_status = 'cancelled', cancelled_at = ?, cancellation_reason = ?, cancelled_by_staff_id = ? WHERE id = ?"
  ).run(new Date().toISOString(), reason, staffId, id);

  return { order: loadOrder(id) };
}

function isToday(isoString) {
  if (!isoString) return false;
  const d = new Date(isoString);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

// All of today's paid orders, across every kitchen status — the dashboard
// groups these into its Received / Preparing / Ready / Served columns.
export function listTodayOrders() {
  const paidOrders = db.prepare("SELECT * FROM orders WHERE payment_status = 'paid'").all();
  const todays = paidOrders.filter((row) => isToday(row.paid_at));

  return todays
    .map((row) => {
      const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(row.id);
      return toOrderJSON(row, items);
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getTodayStats() {
  const todays = listTodayOrders();
  const cancelled = todays.filter((o) => o.kitchenStatus === "cancelled");
  const active = todays.filter((o) => o.kitchenStatus !== "cancelled");

  const revenue = active.reduce((sum, o) => sum + o.total, 0);

  const prepTimes = active
    .filter((o) => o.readyAt)
    .map((o) => (new Date(o.readyAt) - new Date(o.createdAt)) / 60000);

  const avgPrepMinutes = prepTimes.length
    ? Math.round(prepTimes.reduce((a, b) => a + b, 0) / prepTimes.length)
    : null;

  return {
    orderCount: active.length,
    revenue,
    avgPrepMinutes,
    cancelledCount: cancelled.length
  };
}
