import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useIdleReset } from "../hooks/useIdleReset.js";
import { formatRWF } from "../utils.js";
import Navbar from "../components/Navbar.jsx";

export default function Cart() {
  const { items, updateQuantity, removeItem, total } = useCart();
  const { t } = useLanguage();
  const navigate = useNavigate();
  useIdleReset();

  return (
    <div className="screen">
      <Navbar />

      <div className="container" style={{ paddingTop: 20 }}>
        <button className="back-link" onClick={() => navigate("/menu")}>
          <ArrowLeft size={16} /> {t("dish.backToMenu")}
        </button>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, margin: "0 0 20px" }}>{t("cart.title")}</h1>
        {items.length === 0 && (
          <p style={{ color: "rgba(251,247,238,0.6)", textAlign: "center", marginTop: 60 }}>
            {t("cart.empty")}
          </p>
        )}

        {items.map((item) => (
          <div key={item.key} className="card-surface" style={{ display: "flex", gap: 12, padding: 12, marginBottom: 12 }}>
            <img src={item.image} alt={item.name} style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover" }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, marginBottom: 2 }}>{item.name}</p>
              {item.removedIngredients.length > 0 && (
                <p style={{ fontSize: 13, color: "var(--alert)" }}>{t("common.without")} {item.removedIngredients.join(", ")}</p>
              )}
              {item.note && <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>"{item.note}"</p>}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                <div className="qty-control">
                  <button className="qty-btn" onClick={() => updateQuantity(item.key, item.quantity - 1)}>
                    −
                  </button>
                  <span style={{ fontWeight: 700, minWidth: 16, textAlign: "center" }}>{item.quantity}</span>
                  <button className="qty-btn" onClick={() => updateQuantity(item.key, item.quantity + 1)}>
                    +
                  </button>
                </div>
                <strong style={{ color: "var(--accent-dark)" }}>{formatRWF(item.price * item.quantity)}</strong>
              </div>
            </div>
          </div>
        ))}

        {items.length > 0 && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 4px", fontSize: 18, fontWeight: 700 }}>
              <span>{t("cart.total")}</span>
              <span>{formatRWF(total)}</span>
            </div>
            <button className="btn btn-primary btn-block" onClick={() => navigate("/checkout")}>
              {t("cart.checkout")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
