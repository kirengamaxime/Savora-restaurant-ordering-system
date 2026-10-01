import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { BellRing, Check } from "lucide-react";
import { API_BASE, getActiveOrders } from "../../api.js";
import { formatRWF } from "../../utils.js";

const STATUS_LABEL = {
  received: "Received",
  preparing: "Preparing",
  ready: "Ready",
  served: "Served",
  cancelled: "Cancelled"
};

export default function TablesPanel({ helpRequests, onResolveHelp }) {
  const [orders, setOrders] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    getActiveOrders().then((all) => setOrders(all.filter((o) => o.orderType === "dine-in")));

    const socket = io(API_BASE);
    socketRef.current = socket;

    socket.on("new-order", (order) => {
      if (order.orderType === "dine-in") setOrders((prev) => [order, ...prev]);
    });

    socket.on("order-updated", (updated) => {
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    });

    return () => socket.disconnect();
  }, []);

  const dineInHelp = helpRequests.filter((r) => r.orderType === "dine-in");

  // Build one entry per table number that has either an active order or a
  // pending help request, so a table only shows up here while something
  // actually needs attention at it.
  const tableNumbers = Array.from(
    new Set([...orders.map((o) => o.tableNumber), ...dineInHelp.map((r) => r.tableNumber)])
  )
    .filter(Boolean)
    .sort((a, b) => Number(a) - Number(b) || a.localeCompare(b));

  return (
    <div className="mm-container">
      {tableNumbers.length === 0 && (
        <p className="kb-empty" style={{ marginTop: 40 }}>
          No active tables right now — they'll appear here once a dine-in order comes in or a customer calls for help.
        </p>
      )}

      <div className="tables-grid">
        {tableNumbers.map((tableNumber) => {
          const tableOrders = orders
            .filter((o) => o.tableNumber === tableNumber)
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          const help = dineInHelp.find((r) => r.tableNumber === tableNumber);

          return (
            <div className={`table-card ${help ? "needs-help" : ""}`} key={tableNumber}>
              <div className="table-card-header">
                <span className="table-card-title">Table {tableNumber}</span>
                {help && (
                  <button className="table-help-badge" onClick={() => onResolveHelp(help.id)}>
                    <BellRing size={13} /> Needs Help <Check size={13} />
                  </button>
                )}
              </div>

              {tableOrders.length === 0 && <p className="kb-empty" style={{ padding: "8px 0" }}>No active order yet.</p>}

              {tableOrders.map((order) => (
                <div className="table-order-line" key={order.id}>
                  <span>
                    #{order.id} · {order.items.reduce((sum, it) => sum + it.quantity, 0)} items ·{" "}
                    {formatRWF(order.total)}
                  </span>
                  <span className={`table-status-pill table-status-${order.kitchenStatus}`}>{STATUS_LABEL[order.kitchenStatus]}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
