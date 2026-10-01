import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { ChevronDown, ChevronUp } from "lucide-react";
import { API_BASE, getActiveOrders, getStats, updateOrderStatus, cancelOrder } from "../../api.js";
import OrderCard from "../OrderCard.jsx";

const COLUMNS = [
  { key: "received", label: "Received" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready" },
  { key: "served", label: "Served" },
  { key: "cancelled", label: "Cancelled" }
];

const PAGE_SIZE = 4;

// Kitchen accounts can't call the (manager-only) /api/admin/stats endpoint,
// so for them we compute the same order-count/avg-prep figures locally from
// the order list they already have — just without any revenue figure.
// Cancelled orders are excluded from both, matching how the server computes
// the manager-facing figures (a voided order isn't real business volume).
function computeOpsStats(orders) {
  const active = orders.filter((o) => o.kitchenStatus !== "cancelled");
  const prepTimes = active
    .filter((o) => o.readyAt)
    .map((o) => (new Date(o.readyAt) - new Date(o.createdAt)) / 60000);
  const avgPrepMinutes = prepTimes.length
    ? Math.round(prepTimes.reduce((a, b) => a + b, 0) / prepTimes.length)
    : null;
  return { orderCount: active.length, avgPrepMinutes };
}

export default function KitchenBoard({ showRevenue, canManage = true, canCancel = false }) {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ orderCount: 0, revenue: 0, avgPrepMinutes: null });
  const [newestId, setNewestId] = useState(null);
  const [expanded, setExpanded] = useState({});
  const socketRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    getActiveOrders().then(setOrders);
    if (showRevenue) getStats().then(setStats);

    const socket = io(API_BASE);
    socketRef.current = socket;

    socket.on("new-order", (order) => {
      setOrders((prev) => [order, ...prev]);
      setNewestId(order.id);
      audioRef.current?.play().catch(() => {});
      setTimeout(() => setNewestId((id) => (id === order.id ? null : id)), 6000);
    });

    socket.on("order-updated", (updated) => {
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    });

    if (showRevenue) socket.on("stats-updated", setStats);

    return () => socket.disconnect();
  }, [showRevenue]);

  const opsStats = useMemo(() => computeOpsStats(orders), [orders]);

  async function handleAdvance(id, nextStatus) {
    await updateOrderStatus(id, nextStatus);
  }

  async function handleCancel(id) {
    const reason = prompt("Reason for cancelling this order (at least 3 characters):");
    if (reason === null) return; // they hit Cancel on the prompt itself
    if (reason.trim().length < 3) {
      alert("Please enter a reason of at least 3 characters.");
      return;
    }
    try {
      await cancelOrder(id, reason.trim());
    } catch (err) {
      alert(err.response?.data?.error || "Couldn't cancel that order.");
    }
  }

  function toggleExpanded(colKey) {
    setExpanded((prev) => ({ ...prev, [colKey]: !prev[colKey] }));
  }

  return (
    <div>
      <audio ref={audioRef} src="/notify.mp3" />

      <div className="kb-stats" style={{ padding: "0 32px 16px", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {showRevenue ? (
            <>
              Today: <strong>{stats.orderCount} orders</strong>
              <span>·</span>
              <span className="highlight">{stats.revenue.toLocaleString()} RWF</span>
              <span>·</span>
              Avg prep <strong>{stats.avgPrepMinutes ?? "—"} min</strong>
              {stats.cancelledCount > 0 && (
                <>
                  <span>·</span>
                  <span style={{ color: "var(--alert)" }}>{stats.cancelledCount} cancelled</span>
                </>
              )}
            </>
          ) : (
            <>
              Today: <strong>{opsStats.orderCount} orders</strong>
              <span>·</span>
              Avg prep <strong>{opsStats.avgPrepMinutes ?? "—"} min</strong>
            </>
          )}
        </div>
        {!canManage && !canCancel && <span className="kb-viewonly-tag">Viewing only — kitchen manages order status</span>}
      </div>

      <div className="kb-board">
        {COLUMNS.map((col) => {
          const colOrders = orders
            .filter((o) => o.kitchenStatus === col.key)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          const isExpanded = expanded[col.key];
          const visible = isExpanded ? colOrders : colOrders.slice(0, PAGE_SIZE);
          const remaining = colOrders.length - visible.length;

          return (
            <div className={`kb-column ${col.key}`} key={col.key}>
              <div className="kb-column-header">
                <span className="kb-column-title">{col.label}</span>
                <span className="kb-count">{colOrders.length}</span>
              </div>

              {visible.length === 0 && <p className="kb-empty">No orders here.</p>}

              {visible.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onAdvance={handleAdvance}
                  onCancel={handleCancel}
                  isNewest={order.id === newestId}
                  canManage={canManage}
                  canCancel={canCancel}
                />
              ))}

              {remaining > 0 && (
                <button className="kb-more-link" onClick={() => toggleExpanded(col.key)}>
                  +{remaining} more order{remaining > 1 ? "s" : ""} <ChevronDown size={14} />
                </button>
              )}
              {isExpanded && colOrders.length > PAGE_SIZE && (
                <button className="kb-more-link" onClick={() => toggleExpanded(col.key)}>
                  Show less <ChevronUp size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
