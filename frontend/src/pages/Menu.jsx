import { useEffect, useMemo, useState } from "react";
import DishSkeleton from "../components/DishSkeleton.jsx";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { getMenu } from "../api.js";
import { useCart } from "../context/CartContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useIdleReset } from "../hooks/useIdleReset.js";
import Navbar from "../components/Navbar.jsx";
import DishRow from "../components/DishRow.jsx";
import CartBar from "../components/CartBar.jsx";

// Fixed table inventory — the restaurant has 15 physical tables, so
// customers pick from a real list instead of typing an arbitrary number
// that might not exist or might have a typo.
const TABLE_NUMBERS = Array.from({ length: 15 }, (_, i) => i + 1);

export default function Menu() {
  const [menu, setMenu] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { orderType, tableNumber, setTableNumber } = useCart();
  const { t } = useLanguage();
  const navigate = useNavigate();
  useIdleReset();

  useEffect(() => {
  if (!orderType) {
    navigate("/");
    return;
  }
  getMenu()
    .then((data) => {
      setMenu(data);
      setActiveCategory(data[0]?.id);
    })
    .finally(() => setLoading(false));
}, [orderType]); // eslint-disable-line react-hooks/exhaustive-deps // eslint-disable-line react-hooks/exhaustive-deps

  const category = menu.find((c) => c.id === activeCategory);

  const visibleDishes = useMemo(() => {
    if (!category) return [];
    if (!query.trim()) return category.dishes;
    const q = query.toLowerCase();
    return category.dishes.filter((d) => d.name.toLowerCase().includes(q));
  }, [category, query]);

  if (!orderType) return null;

  const needsTable = orderType === "dine-in" && !tableNumber;

  return (
    <div className="screen">
      <Navbar />

      {needsTable ? (
        <div className="container" style={{ paddingTop: 40, maxWidth: 560 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <p className="eyebrow">{t("orderType.dineIn")}</p>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, margin: "0 0 8px" }}>
              {t("menu.tableNumberPrompt")}
            </h1>
            <p style={{ color: "rgba(251,247,238,0.6)", fontSize: 14 }}>{t("menu.tableNumberHint")}</p>
          </div>

          <div className="table-select-grid">
            {TABLE_NUMBERS.map((n) => (
              <button key={n} className="table-select-btn" onClick={() => setTableNumber(String(n))}>
                <span className="table-select-label">{t("common.table")}</span>
                <span className="table-select-number">{n}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div style={{ padding: "16px 24px 0" }}>
            <div className="search-bar">
              <Search size={16} />
              <input
                placeholder={t("menu.searchPlaceholder")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="category-tabs">
            {menu.map((c) => (
              <button
                key={c.id}
                className={`tab ${activeCategory === c.id ? "active" : ""}`}
                onClick={() => setActiveCategory(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>

         <div className="container">
  <div className="dish-grid">
    {loading
      ? Array.from({ length: 4 }).map((_, i) => <DishSkeleton key={i} />)
      : visibleDishes.map((dish) => <DishRow key={dish.id} dish={dish} />)}
  </div>
  {!loading && visibleDishes.length === 0 && (
    <p style={{ textAlign: "center", color: "rgba(251,247,238,0.5)", marginTop: 40 }}>
      {t("menu.noMatch", { query })}
    </p>
  )}
</div>

          <CartBar />
        </>
      )}
    </div>
  );
}
