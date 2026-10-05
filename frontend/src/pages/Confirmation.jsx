import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Smartphone, ExternalLink, Copy, Check } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { getOrder } from "../api.js";
import QRCode from "../components/QRCode.jsx";

const RESET_SECONDS = 20;

export default function Confirmation() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { resetForNextCustomer } = useCart();
  const { t, language, setLanguage } = useLanguage();
  const [order, setOrder] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(RESET_SECONDS);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getOrder(orderId).then(setOrder);
  }, [orderId]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      resetForNextCustomer();
      setLanguage("EN"); // shared kiosk — back to the default language for the next customer
      navigate("/");
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  function newOrderNow() {
    resetForNextCustomer();
    setLanguage("EN");
    navigate("/");
  }

  const trackingUrl = order ? `${window.location.origin}/track/${order.trackingToken}?lang=${language}` : "";

  // Opens in a NEW tab deliberately, rather than navigating this one away —
  // this screen might be a shared kiosk (where leaving would strand it on a
  // stranger's tracking page and skip the auto-reset) or the customer's own
  // phone (where a plain link, not a QR code, is what's actually usable —
  // you can't scan your own phone's screen with its own camera).
  function handleOpenTracking() {
    window.open(trackingUrl, "_blank", "noopener,noreferrer");
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(trackingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // clipboard API can be unavailable (older browsers, non-HTTPS) — the
      // QR code and Open button still work either way, so fail quietly.
    }
  }

  return (
    <div className="screen" style={{ justifyContent: "center", alignItems: "center", textAlign: "center", padding: 24 }}>
      <p className="eyebrow">{t("confirmation.orderPlaced")}</p>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 34, margin: "0 0 8px" }}>{t("confirmation.thankYou")}</h1>
      <p style={{ color: "rgba(251,247,238,0.75)", marginBottom: 4 }}>
        {t("confirmation.sentToKitchen", { id: orderId })}
      </p>
      {order && (
        <p style={{ color: "rgba(251,247,238,0.75)", marginBottom: 8 }}>
          {order.orderType === "dine-in"
            ? t("confirmation.bringToTable", { n: order.tableNumber })
            : t("confirmation.callForPickup")}
        </p>
      )}

      {order && (
        <div className="track-qr-card">
          <QRCode value={trackingUrl} size={100} />
          <div style={{ textAlign: "left" }}>
            <p style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 6, margin: "0 0 4px" }}>
              <Smartphone size={16} /> {t("confirmation.trackTitle")}
            </p>
            <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "0 0 10px" }}>{t("confirmation.trackHint")}</p>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                className="btn btn-primary"
                style={{ minHeight: 38, padding: "8px 14px", fontSize: 13 }}
                onClick={handleOpenTracking}
              >
                <ExternalLink size={14} /> {t("confirmation.trackOpenButton")}
              </button>
              <button
                className="btn btn-ghost"
                style={{ minHeight: 38, padding: "8px 14px", fontSize: 13, borderColor: "var(--border-dark)", color: "var(--ink)" }}
                onClick={handleCopyLink}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? t("confirmation.trackCopied") : t("confirmation.trackCopyButton")}
              </button>
            </div>
          </div>
        </div>
      )}

      <button className="btn btn-primary" onClick={newOrderNow} style={{ marginTop: 8 }}>
        {t("confirmation.newOrder")}
      </button>
      <p style={{ marginTop: 16, fontSize: 13, color: "rgba(251,247,238,0.5)" }}>
        {t("confirmation.returning", { n: secondsLeft })}
      </p>
    </div>
  );
}
