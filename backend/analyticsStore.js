import { db } from "./db.js";

// All revenue/order figures exclude cancelled orders — a cancelled order was
// paid but voided, so it shouldn't count as real business. This module is
// read-only — it just queries data store.js already writes.
const PAID_NOT_CANCELLED = "payment_status = 'paid' AND kitchen_status != 'cancelled'";

export function getSalesAnalytics() {
  const allTime = db
    .prepare(`SELECT COUNT(*) as orders, COALESCE(SUM(total), 0) as revenue FROM orders WHERE ${PAID_NOT_CANCELLED}`)
    .get();

  const cancelledCount = db
    .prepare("SELECT COUNT(*) as count FROM orders WHERE kitchen_status = 'cancelled'")
    .get().count;

  // Daily revenue/order count for the last 14 days that had at least one paid
  // order — oldest first, so the frontend can draw a left-to-right trend.
  const daily = db
    .prepare(
      `SELECT date(paid_at) as day, COUNT(*) as orders, SUM(total) as revenue
       FROM orders
       WHERE ${PAID_NOT_CANCELLED} AND paid_at IS NOT NULL
       GROUP BY day
       ORDER BY day DESC
       LIMIT 14`
    )
    .all()
    .reverse();

  const topDishes = db
    .prepare(
      `SELECT oi.name as name, SUM(oi.quantity) as quantity, SUM(oi.price * oi.quantity) as revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.payment_status = 'paid' AND o.kitchen_status != 'cancelled'
       GROUP BY oi.name
       ORDER BY quantity DESC
       LIMIT 8`
    )
    .all();

  const byPaymentMethod = db
    .prepare(
      `SELECT payment_method as method, COUNT(*) as orders, SUM(total) as revenue
       FROM orders
       WHERE ${PAID_NOT_CANCELLED}
       GROUP BY payment_method`
    )
    .all();

  return {
    allTimeRevenue: allTime.revenue || 0,
    allTimeOrders: allTime.orders || 0,
    cancelledCount,
    daily,
    topDishes,
    byPaymentMethod
  };
}
