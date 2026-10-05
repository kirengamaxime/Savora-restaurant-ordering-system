import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, RotateCcw } from "lucide-react";
import { io } from "socket.io-client";
import { API_BASE, getOrder } from "../api.js";
import { getOrderHistory } from "../orderHistory.js";
import { useCart } from "../context/CartContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { formatRWF } from "../utils.js";
import Navbar from "../components/Navbar.jsx";

export default function Orders() {
  const [orders, setOrders] = useState(null); // null = loading
  const { addItem } = useCart();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const STATUS_LABEL = {
    received: t("orders.statusReceived"),
    preparing: t("orders.statusPreparing"),
    ready: t("orders.statusReady"),
    served: t("orders.statusServed")
  };

  async function loadOrders() {
    const ids = getOrderHistory();
    if (ids.length === 0) {
      setOrders([]);
      return;
    }
    const results = await Promise.all(
      ids.map((id) =>
        getOrder(id)
          .then((o) => o)
          .catch(() => null) // order may no longer exist if the backend restarted
      )
    );
    const loaded = results.filter(Boolean);
    setOrders(loaded);

    // Live-update each order's status as the kitchen progresses it, instead
    // of requiring a manual refresh.
    socketRef.current?.disconnect();
    const socket = io(API_BASE);
    socketRef.current = socket;
    loaded.forEach((o) => socket.emit("join-order", o.id));
    socket.on("track-update", (updated) => {
      setOrders((prev) => (prev ? prev.map((o) => (o.id === updated.id ? updated : o)) : prev));
    });
  }

  useEffect(() => {
    loadOrders();
    return () => socketRef.current?.disconnect();
  }, []);

  function handleOrderAgain(order) {
    order.items.forEach((item) => {
      addItem({
        dishId: item.dishId,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: item.quantity,
        removedIngredients: item.removedIngredients || [],
        note: item.note || ""
      });
    });
    navigate("/cart");
  }

  return (
    <div className="screen">
      <Navbar />
      <div className="container" style={{ paddingTop: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, margin: 0 }}>{t("orders.title")}</h1>
          <button
            className="icon-btn"
            onClick={loadOrders}
            aria-label="Refresh"
            title="Refresh status"
          >
            <RefreshCw size={17} />
          </button>
        </div>

        {orders === null && <p style={{ color: "rgba(251,247,238,0.5)" }}>{t("orders.loading")}</p>}

        {orders !== null && orders.length === 0 && (
          <div style={{ textAlign: "center", marginTop: 60 }}>
            <p style={{ color: "rgba(251,247,238,0.6)", marginBottom: 20 }}>
              {t("orders.empty")}
            </p>
            <button className="btn btn-primary" onClick={() => navigate("/")}>
              {t("orders.startOrder")}
            </button>
          </div>
        )}

        {orders?.map((order) => {
          const statusKey = order.paymentStatus !== "paid" ? order.paymentStatus : order.kitchenStatus;
          const statusLabel =
            order.paymentStatus === "pending"
              ? t("orders.statusAwaitingPayment")
              : order.paymentStatus === "failed"
              ? t("orders.statusPaymentFailed")
              : STATUS_LABEL[order.kitchenStatus];

          return (
            <div className="order-history-card" key={order.id}>
              <div className="order-history-top">
                <div>
                  <p style={{ fontWeight: 700, margin: 0, fontSize: 16 }}>
                    Order #{order.id} ·{" "}
                    {order.orderType === "dine-in" ? `${t("common.table")} ${order.tableNumber}` : t("orderType.takeAway")}
                  </p>
                  <p style={{ color: "rgba(251,247,238,0.5)", fontSize: 13, margin: "2px 0 0" }}>
                    {new Date(order.createdAt).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                </div>
                <span className={`order-status-pill order-status-${statusKey}`}>{statusLabel}</span>
              </div>

              <ul style={{ margin: "10px 0", paddingLeft: 18, color: "rgba(251,247,238,0.75)", fontSize: 14 }}>
                {order.items.map((item, i) => (
                  <li key={i} style={{ marginBottom: 3 }}>
                    {item.quantity}× {item.name}
                    {item.removedIngredients?.length > 0 && (
                      <span style={{ color: "var(--accent)" }}> — {t("common.without").toLowerCase()} {item.removedIngredients.join(", ")}</span>
                    )}
                  </li>
                ))}
              </ul>

              {order.kitchenStatus === "cancelled" && order.cancellationReason && (
                <p style={{ color: "var(--alert)", fontSize: 13.5, margin: "0 0 12px", fontStyle: "italic" }}>
                  {t("track.statusCancelledReason", { reason: order.cancellationReason })}
                </p>
              )}

              <p style={{ fontWeight: 700, margin: "0 0 12px" }}>{formatRWF(order.total)}</p>

              <button className="btn btn-ghost" style={{ minHeight: 38, padding: "8px 16px", fontSize: 13.5 }} onClick={() => handleOrderAgain(order)}>
                <RotateCcw size={14} /> {t("orders.orderAgain")}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
