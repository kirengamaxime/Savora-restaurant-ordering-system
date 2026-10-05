import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { ShoppingBag, ClipboardList, ChevronDown, Utensils, ShoppingBasket, BellRing, Check } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { sendHelpRequest } from "../api.js";

const LANGUAGES = [
  { code: "EN", label: "English" },
  { code: "KN", label: "Kinyarwanda" },
  { code: "FR", label: "Français" }
];

const HELP_COOLDOWN_SECONDS = 30;

export default function Navbar() {
  const { itemCount, total, orderType, tableNumber } = useCart();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [langOpen, setLangOpen] = useState(false);
  const [helpState, setHelpState] = useState("idle"); // idle | sending | sent
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function handleCallHelp() {
    if (!orderType || helpState !== "idle" || cooldown > 0) return;
    setHelpState("sending");
    try {
      await sendHelpRequest(orderType, tableNumber);
      setHelpState("sent");
      setCooldown(HELP_COOLDOWN_SECONDS);
      setTimeout(() => setHelpState("idle"), 4000);
    } catch {
      setHelpState("idle");
    }
  }

  const helpDisabled = helpState !== "idle" || cooldown > 0;

  return (
    <div className="navbar">
      <div className="nav-left">
        <span className="brand">Savora</span>
        <div className="nav-links">
          <NavLink to="/menu" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            <Utensils size={16} /> {t("nav.menu")}
          </NavLink>
          <NavLink to="/orders" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            <ClipboardList size={16} /> {t("nav.orders")}
          </NavLink>
        </div>
      </div>

      <div className="nav-right">
        {orderType && (
          <button className="help-pill" onClick={handleCallHelp} disabled={helpDisabled}>
            {helpState === "sent" ? <Check size={15} /> : <BellRing size={15} />}
            {helpState === "sending"
              ? t("help.sending")
              : helpState === "sent"
              ? t("help.sent")
              : t("help.callButton")}
          </button>
        )}

        <button className="icon-btn" onClick={() => navigate("/cart")} aria-label="View cart">
          <ShoppingBag size={19} />
          {itemCount > 0 && <span className="icon-badge">{itemCount}</span>}
        </button>

        <div className="lang-selector">
          <button className="lang-trigger" onClick={() => setLangOpen((o) => !o)}>
            {language} <ChevronDown size={14} />
          </button>
          {langOpen && (
            <div className="lang-menu" onMouseLeave={() => setLangOpen(false)}>
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  className={`lang-option ${language === l.code ? "active" : ""}`}
                  onClick={() => {
                    setLanguage(l.code);
                    setLangOpen(false);
                  }}
                >
                  {l.code} · {l.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {orderType && (
          <span className="order-type-pill">
            <ShoppingBasket size={15} />
            {orderType === "dine-in" ? t("orderType.dineIn") : t("orderType.takeAway")}
          </span>
        )}

        {itemCount > 0 && (
          <span className="order-type-pill" style={{ background: "rgba(232,100,31,0.15)", borderColor: "rgba(232,100,31,0.4)", color: "var(--accent)" }}>
            {itemCount} {itemCount > 1 ? t("menu.items") : t("menu.item")} · {total.toLocaleString()} RWF
          </span>
        )}
      </div>
    </div>
  );
}
