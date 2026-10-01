import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { Utensils, ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=1600&q=80";

const LANGUAGES = ["EN", "KN", "FR"];

export default function Welcome() {
  const navigate = useNavigate();
  const { setOrderType, setTableNumber } = useCart();
  const { language, setLanguage, t } = useLanguage();
  const [params] = useSearchParams();

  const tableFromQr = params.get("table");

  useEffect(() => {
    if (tableFromQr) {
      setOrderType("dine-in");
      setTableNumber(tableFromQr);
    }
  }, [tableFromQr]); // eslint-disable-line react-hooks/exhaustive-deps

  function choose(type) {
    setOrderType(type);
    navigate("/menu");
  }

  return (
    <div className="hero" style={{ backgroundImage: `url(${HERO_IMAGE})` }}>
      <div className="hero-content">
        <h1 className="hero-title">Savora</h1>
        <div className="hero-rule" />
        <p className="hero-tagline">Karibu — Welcome — Bienvenue</p>
        <p className="hero-subtitle">
          {tableFromQr ? t("welcome.orderingForTable", { n: tableFromQr }) + " — " : ""}
          {t("welcome.subtitle")}
        </p>

        <div className="hero-lang">
          {LANGUAGES.map((l) => (
            <button
              key={l}
              className={`hero-lang-btn ${language === l ? "active" : ""}`}
              onClick={() => setLanguage(l)}
            >
              {l}
            </button>
          ))}
        </div>

        {!tableFromQr ? (
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => choose("dine-in")}>
              <Utensils size={18} /> {t("orderType.dineIn")}
            </button>
            <button className="btn btn-ghost" onClick={() => choose("takeaway")}>
              <ShoppingBag size={18} /> {t("orderType.takeAway")}
            </button>
          </div>
        ) : (
          <button className="btn btn-primary" onClick={() => navigate("/menu")}>
            <Utensils size={18} /> {t("welcome.startOrder")}
          </button>
        )}
      </div>
    </div>
  );
}
