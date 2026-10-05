import { Order } from "./models.js";

// All revenue/order figures exclude cancelled orders (paid but voided).
// Read-only: just queries data store.js already writes.
//
// Totals are summed in JavaScript from a slim projection (only paidAt, total,
// paymentMethod) rather than with MongoDB $group/$sum — it behaves identically
// on MongoDB Atlas, local MongoDB and MongoDB-compatible servers, and is
// instant at restaurant scale (tens of thousands of orders). Top dishes still
// use an aggregation because order items are nested arrays.
const PAID_NOT_CANCELLED = { paymentStatus: "paid", kitchenStatus: { $ne: "cancelled" } };

export async function getSalesAnalytics() {
  const [paidRows, cancelledCount, dishRows] = await Promise.all([
    Order.find(PAID_NOT_CANCELLED, { paidAt: 1, total: 1, paymentMethod: 1, _id: 0 }).lean(),
    Order.countDocuments({ kitchenStatus: "cancelled" }),
    Order.aggregate([
      { $match: PAID_NOT_CANCELLED },
      { $unwind: "$items" },
      // Grouped by name + unit price (a dish's price may change over time).
      { $group: { _id: { name: "$items.name", price: "$items.price" }, quantity: { $sum: "$items.quantity" } } }
    ])
  ]);

  return {
    allTimeRevenue: paidRows.reduce((sum, r) => sum + r.total, 0),
    allTimeOrders: paidRows.length,
    cancelledCount,
    daily: rollUpDaily(paidRows),
    topDishes: rollUpTopDishes(dishRows),
    byPaymentMethod: rollUpPaymentMethods(paidRows)
  };
}

// Last 14 days that had at least one paid order, oldest first. paidAt is an
// ISO string, so its first 10 characters are the (UTC) date.
function rollUpDaily(rows) {
  const byDay = new Map();
  for (const r of rows) {
    if (!r.paidAt) continue;
    const day = r.paidAt.slice(0, 10);
    const cur = byDay.get(day) || { day, orders: 0, revenue: 0 };
    cur.orders += 1;
    cur.revenue += r.total;
    byDay.set(day, cur);
  }
  return [...byDay.values()].sort((a, b) => (a.day < b.day ? -1 : 1)).slice(-14);
}

function rollUpTopDishes(rows) {
  const byName = new Map();
  for (const r of rows) {
    const cur = byName.get(r._id.name) || { name: r._id.name, quantity: 0, revenue: 0 };
    cur.quantity += r.quantity;
    cur.revenue += r._id.price * r.quantity;
    byName.set(r._id.name, cur);
  }
  return [...byName.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 8);
}

function rollUpPaymentMethods(rows) {
  const byMethod = new Map();
  for (const r of rows) {
    const cur = byMethod.get(r.paymentMethod) || { method: r.paymentMethod, orders: 0, revenue: 0 };
    cur.orders += 1;
    cur.revenue += r.total;
    byMethod.set(r.paymentMethod, cur);
  }
  return [...byMethod.values()];
}
