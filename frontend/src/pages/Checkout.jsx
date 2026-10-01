import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useIdleReset } from "../hooks/useIdleReset.js";
import { placeOrder, requestPayment, getOrder } from "../api.js";
import { formatRWF, isValidRwandaPhone } from "../utils.js";
import { addOrderToHistory } from "../orderHistory.js";
import Navbar from "../components/Navbar.jsx";
import PaymentBadge from "../components/PaymentBadge.jsx";

export default function Checkout() {
  const { items, orderType, tableNumber, total } = useCart();
  const { t } = useLanguage();
  const navigate = useNavigate();
  useIdleReset();

  const METHODS = [
    { id: "momo", label: t("checkout.momo"), sublabel: t("checkout.momoSub") },
    { id: "airtel", label: t("checkout.airtel"), sublabel: t("checkout.airtelSub") },
    { id: "card", label: t("checkout.card"), sublabel: t("checkout.cardSub") },
    { id: "cash", label: t("checkout.cash"), sublabel: t("checkout.cashSub") }
  ];

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [method, setMethod] = useState("momo");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [stage, setStage] = useState("form"); // form | waiting | failed
  const pollRef = useRef(null);

  useEffect(() => {
    if (items.length === 0) navigate("/menu");
    return () => clearInterval(pollRef.current);
  }, [items, navigate]);

  const needsPhone = method === "momo" || method === "airtel";
  const phoneValid = !needsPhone || isValidRwandaPhone(method, customerPhone);
  const canSubmit = orderType === "takeaway" ? customerName.trim().length > 0 : true;
  const readyToPay = canSubmit && phoneValid && (!needsPhone || customerPhone.trim().length > 0);

  async function handlePay() {
    setStage("waiting");
    const order = await placeOrder({
      items: items.map((it) => ({
        dishId: it.dishId,
        image: it.image,
        name: it.name,
        price: it.price,
        quantity: it.quantity,
        removedIngredients: it.removedIngredients,
        note: it.note
      })),
      orderType,
      tableNumber,
      customerName,
      customerPhone,
      paymentMethod: method
    });

    await requestPayment(method, order.id);

    pollRef.current = setInterval(async () => {
      const updated = await getOrder(order.id);
      if (updated.paymentStatus === "paid") {
        clearInterval(pollRef.current);
        addOrderToHistory(order.id);
        navigate(`/confirmation/${order.id}`);
      } else if (updated.paymentStatus === "failed") {
        clearInterval(pollRef.current);
        setStage("failed");
      }
    }, 1200);
  }

  if (stage === "waiting") {
    return (
      <div className="screen" style={{ justifyContent: "center", alignItems: "center", textAlign: "center", padding: 24 }}>
        <p className="eyebrow">{t("checkout.confirmingPayment")}</p>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 26, maxWidth: 320 }}>
          {method === "cash" || method === "card"
            ? t("checkout.processing")
            : t("checkout.checkPhone", {
                amount: formatRWF(total),
                method: method === "momo" ? "MoMo" : "Airtel Money"
              })}
        </h2>
      </div>
    );
  }

  return (
    <div className="screen">
      <Navbar />

      <div className="container" style={{ paddingTop: 20 }}>
        <button className="back-link" onClick={() => navigate("/cart")}>
          <ArrowLeft size={16} /> {t("checkout.backToOrder")}
        </button>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, margin: "0 0 20px" }}>{t("checkout.title")}</h1>
        {stage === "failed" && (
          <div className="card-surface" style={{ padding: 16, marginBottom: 16, borderLeft: "4px solid var(--alert)" }}>
            {t("checkout.paymentFailed")}
          </div>
        )}

        {orderType === "takeaway" && (
          <div className="card-surface" style={{ padding: 20, marginBottom: 16 }}>
            <label htmlFor="name">{t("checkout.nameForPickup")}</label>
            <input
              id="name"
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder={t("checkout.namePlaceholder")}
            />
          </div>
        )}

        <div className="card-surface" style={{ padding: 20, marginBottom: 16 }}>
          <p style={{ fontWeight: 700, marginBottom: 12 }}>{t("checkout.paymentMethod")}</p>

          <div className="payment-method-list">
            {METHODS.map((m) => (
              <div
                key={m.id}
                className={`payment-method-row ${method === m.id ? "selected" : ""}`}
                onClick={() => {
                  setMethod(m.id);
                  setPhoneTouched(false);
                }}
                role="radio"
                aria-checked={method === m.id}
                tabIndex={0}
              >
                <PaymentBadge method={m.id} />
                <div className="payment-method-info">
                  <div className="payment-method-label">{m.label}</div>
                  <div className="payment-method-sublabel">{m.sublabel}</div>
                </div>
                <div className={`payment-radio-dot ${method === m.id ? "selected" : ""}`} />
              </div>
            ))}
          </div>

          {needsPhone && (
            <div style={{ marginTop: 14 }}>
              <label htmlFor="phone">{t("checkout.phoneForPayment")}</label>
              <input
                id="phone"
                type="tel"
                placeholder={t("checkout.phonePlaceholder")}
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                onBlur={() => setPhoneTouched(true)}
              />
              {phoneTouched && customerPhone.trim().length > 0 && !phoneValid && (
                <p className="phone-input-error">
                  {method === "momo" ? t("checkout.invalidMomoPhone") : t("checkout.invalidAirtelPhone")}
                </p>
              )}
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 4px 20px", fontSize: 18, fontWeight: 700 }}>
          <span>{t("checkout.total")}</span>
          <span>{formatRWF(total)}</span>
        </div>

        <button className="btn btn-primary btn-block" disabled={!readyToPay} onClick={handlePay}>
          {t("checkout.pay", { amount: formatRWF(total) })}
        </button>
      </div>
    </div>
  );
}
