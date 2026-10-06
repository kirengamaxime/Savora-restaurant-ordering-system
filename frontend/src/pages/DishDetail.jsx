import { resolveImageUrl } from "../api";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getMenu } from "../api.js";
import { useCart } from "../context/CartContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useIdleReset } from "../hooks/useIdleReset.js";
import { formatRWF } from "../utils.js";
import Navbar from "../components/Navbar.jsx";

function ingredientIcon(name) {
  const n = name.toLowerCase();
  if (n.includes("onion")) return "🧅";
  if (n.includes("chili") || n.includes("pili") || n.includes("spicy") || n.includes("spice")) return "🌶️";
  if (n.includes("coriander") || n.includes("greens") || n.includes("herb")) return "🌿";
  if (n.includes("plantain") || n.includes("banana") || n.includes("matoke")) return "🍌";
  if (n.includes("garlic")) return "🧄";
  if (n.includes("lemon") || n.includes("lime")) return "🍋";
  if (n.includes("sugar")) return "🧂";
  if (n.includes("milk")) return "🥛";
  if (n.includes("honey")) return "🍯";
  if (n.includes("sauce")) return "🍶";
  return "🍽️";
}

export default function DishDetail() {
  const { dishId } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { t } = useLanguage();
  useIdleReset();

  const [dish, setDish] = useState(null);
  const [removed, setRemoved] = useState(new Set());
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");

  useEffect(() => {
    getMenu().then((categories) => {
      const found = categories.flatMap((c) => c.dishes).find((d) => d.id === dishId);
      setDish(found || null);
    });
  }, [dishId]);

  if (!dish) return null;

  const removableIngredients = dish.ingredients.filter((i) => i.removable);

  function toggleIngredient(ingredientId) {
    setRemoved((prev) => {
      const next = new Set(prev);
      next.has(ingredientId) ? next.delete(ingredientId) : next.add(ingredientId);
      return next;
    });
  }

  function handleAdd() {
    const removedNames = dish.ingredients.filter((i) => removed.has(i.id)).map((i) => i.name);

    addItem({
      dishId: dish.id,
      name: dish.name,
      price: dish.price,
      image: dish.image,
      quantity,
      removedIngredients: removedNames,
      note
    });
    navigate("/menu");
  }

  return (
    <div className="screen">
      <Navbar />
      <img className="dish-hero-img" src={resolveImageUrl(dish.image)} alt={dish.name} />

      <div className="container" style={{ paddingTop: 20 }}>
        <button className="back-link" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> {t("dish.backToMenu")}
        </button>

        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 40, margin: "0 0 10px" }}>{dish.name}</h1>

        <div className="meta-row">
          <span>{formatRWF(dish.price)}</span>
          <span className="sep">·</span>
          <span className="time">{dish.prepMinutes} min</span>
        </div>

        <p style={{ color: "rgba(251,247,238,0.75)", marginBottom: 28, maxWidth: 560 }}>{dish.description}</p>

        {removableIngredients.length > 0 && (
          <div className="ingredient-panel">
            <p className="ingredient-panel-title">{t("dish.customize")}</p>
            {removableIngredients.map((ing) => {
              const isRemoved = removed.has(ing.id);
              return (
                <div className="ingredient-row" key={ing.id}>
                  <span className="ingredient-icon">{ingredientIcon(ing.name)}</span>
                  <span className="ingredient-name">
                    {ing.name}
                    {isRemoved && <span className="ingredient-removed-tag">— {t("dish.removed")}</span>}
                  </span>
                  <div className="ingredient-controls">
                    <span className={`state-pill ${isRemoved ? "removed" : ""}`}>
                      {isRemoved ? t("dish.removed") : t("dish.included")}
                    </span>
                    <div
                      className={`toggle ${!isRemoved ? "on" : ""}`}
                      onClick={() => toggleIngredient(ing.id)}
                      role="switch"
                      aria-checked={!isRemoved}
                    >
                      <div className="knob" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="dish-footer" style={{ marginTop: 8, marginBottom: 28 }}>
          <div className="qty-block">
            <label>{t("dish.quantity")}</label>
            <div className="qty-control">
              <button className="qty-btn" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                −
              </button>
              <span style={{ fontSize: 18, fontWeight: 700, minWidth: 20, textAlign: "center" }}>{quantity}</span>
              <button className="qty-btn" onClick={() => setQuantity((q) => q + 1)}>
                +
              </button>
            </div>
          </div>

          <div className="note-block">
            <label htmlFor="note">{t("dish.specialInstructions")}</label>
            <input
              id="note"
              className="dark-input"
              type="text"
              placeholder={t("dish.specialInstructionsPlaceholder")}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <button className="btn btn-primary btn-block" onClick={handleAdd}>
          {t("dish.addToOrder")} — {formatRWF(dish.price * quantity)}
        </button>
      </div>
    </div>
  );
}
