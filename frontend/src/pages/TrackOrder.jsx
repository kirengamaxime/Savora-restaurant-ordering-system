import TrackSkeleton from "../components/TrackSkeleton.jsx";
import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import { XCircle } from "lucide-react";
import { API_BASE, getOrderByToken } from "../api.js";
import { formatRWF } from "../utils.js";
import OrderProgress from "../components/OrderProgress.jsx";
import { LanguageProvider, useLanguage } from "../context/LanguageContext.jsx";

const LANGUAGES = ["EN", "KN", "FR"];

function TrackOrderInner() {
  const { token } = useParams();
  const { language, setLanguage, t } = useLanguage();
  const [order, setOrder] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    getOrderByToken(token)
      .then((data) => {
        setOrder(data);
        const socket = io(API_BASE);
        socketRef.current = socket;
        socket.emit("join-order", data.id);
        socket.on("track-update", (updated) => {
          if (String(updated.id) === String(data.id)) setOrder(updated);
        });
      })
      .catch(() => setNotFound(true));

    return () => socketRef.current?.disconnect();
  }, [token]);

  const langSwitcher = (
    <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 24 }}>
      {LANGUAGES.map((l) => (
        <button
          key={l}
          className={`tab ${language === l ? "active" : ""}`}
          onClick={() => setLanguage(l)}
          style={{ padding: "6px 16px", fontSize: 13 }}
        >
          {l}
        </button>
      ))}
    </div>
  );

  if (notFound) {
    return (
      <div className="screen" style={{ justifyContent: "center", alignItems: "center", textAlign: "center", padding: 24 }}>
        {langSwitcher}
        <p className="eyebrow">{t("track.notFoundTitle")}</p>
        <h2 style={{ fontFamily: "var(--font-display)" }}>{t("track.notFoundTitle")}</h2>
        <p style={{ color: "rgba(251,247,238,0.6)" }}>{t("track.notFoundBody")}</p>
      </div>
    );
  }

  if (!order) {
  return (
    <div className="screen">
      <TrackSkeleton />
    </div>
  );
}

  const isCancelled = order.kitchenStatus === "cancelled";
  const pickupLabel = order.orderType === "dine-in" ? t("track.served") : t("track.pickedUp");
  const statusMessage =
    {
      received: t("track.statusReceived"),
      preparing: t("track.statusPreparing"),
      ready: order.orderType === "dine-in" ? t("track.statusReadyDineIn") : t("track.statusReadyTakeaway"),
      served: order.orderType === "dine-in" ? t("track.statusServedDineIn") : t("track.statusServedTakeaway")
    }[order.kitchenStatus] || "";

  return (
    <div className="screen">
      <div className="container" style={{ paddingTop: 40, maxWidth: 480 }}>
        {langSwitcher}

        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <p className="eyebrow">Order #{order.id}</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, margin: "0 0 6px" }}>
            {order.orderType === "dine-in" ? `${t("common.table")} ${order.tableNumber}` : t("orderType.takeAway")}
          </h1>
          {!isCancelled && <p style={{ color: "rgba(251,247,238,0.7)" }}>{statusMessage}</p>}
        </div>

        {isCancelled ? (
          <div className="track-cancelled-card">
            <XCircle size={28} color="var(--alert)" />
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, margin: "10px 0 6px" }}>
              {t("track.statusCancelledTitle")}
            </h2>
            {order.cancellationReason && (
              <p style={{ margin: "0 0 8px" }}>{t("track.statusCancelledReason", { reason: order.cancellationReason })}</p>
            )}
            <p style={{ color: "rgba(251,247,238,0.65)", fontSize: 13.5, margin: 0 }}>{t("track.statusCancelledApology")}</p>
          </div>
        ) : (
          <OrderProgress status={order.kitchenStatus} pickupLabel={pickupLabel} />
        )}

        <div className="card-surface" style={{ padding: 18, marginTop: 12 }}>
          <p style={{ fontWeight: 700, marginBottom: 10 }}>{t("track.orderDetails")}</p>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, color: "var(--ink-soft)" }}>
            {order.items.map((item, i) => (
              <li key={i} style={{ marginBottom: 4 }}>
                {item.quantity}× {item.name}
                {item.removedIngredients?.length > 0 && (
                  <span style={{ color: "var(--accent-dark)" }}> — {t("common.without").toLowerCase()} {item.removedIngredients.join(", ")}</span>
                )}
              </li>
            ))}
          </ul>
          <p style={{ fontWeight: 700, marginTop: 10, marginBottom: 0 }}>{formatRWF(order.total)}</p>
        </div>

        <p style={{ textAlign: "center", fontSize: 12.5, color: "rgba(251,247,238,0.4)", marginTop: 20 }}>
          {t("track.closeNote")}
        </p>
      </div>
    </div>
  );
}

export default function TrackOrder() {
  const [params] = useSearchParams();
  const initialLanguage = ["EN", "KN", "FR"].includes(params.get("lang")) ? params.get("lang") : "EN";

  return (
    <LanguageProvider initialLanguage={initialLanguage}>
      <TrackOrderInner />
    </LanguageProvider>
  );
}
