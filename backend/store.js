import { nanoid } from "nanoid";
import { Order } from "./models.js";
import { nextSequence } from "./db.js";

function toOrderJSON(o) {
  return {
    id: String(o.orderNumber),
    items: o.items.map((it) => ({
      dishId: it.dishId || null,
      image: it.image || null,
      name: it.name,
      price: it.price,
      quantity: it.quantity,
      removedIngredients: it.removedIngredients ? [...it.removedIngredients] : [],
      note: it.note || ""
    })),
    orderType: o.orderType,
    tableNumber: o.tableNumber ?? null,
    customerName: o.customerName ?? null,
    customerPhone: o.customerPhone ?? null,
    paymentMethod: o.paymentMethod ?? null,
    total: o.total,
    paymentStatus: o.paymentStatus,
    kitchenStatus: o.kitchenStatus,
    createdAt: o.createdAt,
    paidAt: o.paidAt ?? null,
    preparingAt: o.preparingAt ?? null,
    readyAt: o.readyAt ?? null,
    servedAt: o.servedAt ?? null,
    trackingToken: o.trackingToken ?? null,
    cancelledAt: o.cancelledAt ?? null,
    cancellationReason: o.cancellationReason ?? null,
    cancelledByStaffId: o.cancelledByStaffId ?? null
  };
}

// Public order ids are the sequential order numbers (#201, #202, …).
function parseId(id) {
  const n = Number(id);
  return Number.isInteger(n) ? n : null;
}

async function loadOrder(id) {
  const n = parseId(id);
  if (n === null) return null;
  const doc = await Order.findOne({ orderNumber: n }).lean();
  return doc ? toOrderJSON(doc) : null;
}

export async function createOrder({ items, orderType, tableNumber, customerName, customerPhone, paymentMethod, total }) {
  const created = await Order.create({
    orderNumber: await nextSequence("orderNumber"),
    orderType,
    tableNumber: tableNumber || null,
    customerName: customerName || null,
    customerPhone: customerPhone || null,
    paymentMethod,
    total,
    paymentStatus: "pending",
    kitchenStatus: "received",
    createdAt: new Date().toISOString(),
    trackingToken: nanoid(16),
    items: items.map((item) => ({
      dishId: item.dishId || null,
      image: item.image || null,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      removedIngredients: item.removedIngredients || [],
      note: item.note || ""
    }))
  });
  return toOrderJSON(created);
}

export function getOrder(id) {
  return loadOrder(id);
}

// Customer tracking links use an unguessable token, not the sequential id.
export async function getOrderByToken(token) {
  if (typeof token !== "string") return null;
  const doc = await Order.findOne({ trackingToken: token }).lean();
  return doc ? toOrderJSON(doc) : null;
}

async function updateFields(id, fields) {
  const n = parseId(id);
  if (n === null) return null;
  const doc = await Order.findOneAndUpdate({ orderNumber: n }, { $set: fields }, { returnDocument: "after" }).lean();
  return doc ? toOrderJSON(doc) : null;
}

export function updatePaymentStatus(id, status) {
  const fields = { paymentStatus: status };
  if (status === "paid") fields.paidAt = new Date().toISOString();
  return updateFields(id, fields);
}

export function updateKitchenStatus(id, status) {
  const fields = { kitchenStatus: status };
  const column = { preparing: "preparingAt", ready: "readyAt", served: "servedAt" }[status];
  if (column) fields[column] = new Date().toISOString();
  return updateFields(id, fields);
}

// Manager-only voiding. Can't cancel a served or already-cancelled order.
// The status guard is part of the update filter, so two simultaneous requests
// can't both succeed.
export async function cancelOrder(id, reason, staffId) {
  const n = parseId(id);
  if (n === null) return { error: "Order not found" };

  const updated = await Order.findOneAndUpdate(
    { orderNumber: n, kitchenStatus: { $nin: ["served", "cancelled"] } },
    {
      $set: {
        kitchenStatus: "cancelled",
        cancelledAt: new Date().toISOString(),
        cancellationReason: reason,
        cancelledByStaffId: staffId
      }
    },
    { returnDocument: "after" }
  ).lean();
  if (updated) return { order: toOrderJSON(updated) };

  const existing = await Order.findOne({ orderNumber: n }).lean();
  if (!existing) return { error: "Order not found" };
  if (existing.kitchenStatus === "served") return { error: "Can't cancel an order that's already been served" };
  return { error: "Order is already cancelled" };
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

// All of today's paid orders across every kitchen status.
export async function listTodayOrders() {
  const paid = await Order.find({ paymentStatus: "paid" }).lean();
  return paid
    .filter((o) => isToday(o.paidAt))
    .map(toOrderJSON)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getTodayStats() {
  const todays = await listTodayOrders();
  const cancelled = todays.filter((o) => o.kitchenStatus === "cancelled");
  const active = todays.filter((o) => o.kitchenStatus !== "cancelled");

  const revenue = active.reduce((sum, o) => sum + o.total, 0);

  const prepTimes = active
    .filter((o) => o.readyAt)
    .map((o) => (new Date(o.readyAt) - new Date(o.createdAt)) / 60000);

  const avgPrepMinutes = prepTimes.length
    ? Math.round(prepTimes.reduce((a, b) => a + b, 0) / prepTimes.length)
    : null;

  return { orderCount: active.length, revenue, avgPrepMinutes, cancelledCount: cancelled.length };
}
