import { useNavigate } from "react-router-dom";
import { resolveImageUrl } from "../api";
import { formatRWF } from "../utils.js";
import { useLanguage } from "../context/LanguageContext.jsx";

export default function DishRow({ dish }) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div
      className={`dish-row ${dish.soldOut ? "sold-out" : ""}`}
      onClick={() => !dish.soldOut && navigate(`/dish/${dish.id}`)}
    >
      <img className="dish-row-img" src={resolveImageUrl(dish.image)} alt={dish.name} />
      <div className="dish-row-body">
        <p className="dish-row-name">{dish.name}</p>
        <p className="dish-row-desc">{dish.description}</p>
        {dish.soldOut ? (
          <span className="sold-out-label">{t("menu.soldOut")}</span>
        ) : (
          <span className="dish-row-price">{formatRWF(dish.price)}</span>
        )}
      </div>
    </div>
  );
}
