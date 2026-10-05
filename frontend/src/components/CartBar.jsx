import { useNavigate } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { formatRWF } from "../utils.js";

export default function CartBar() {
  const { itemCount, total } = useCart();
  const { t } = useLanguage();
  const navigate = useNavigate();

  if (itemCount === 0) return null;

  return (
    <div className="cart-bar" onClick={() => navigate("/cart")}>
      <ShoppingCart size={19} />
      {t("menu.viewOrder")} · {itemCount} {itemCount > 1 ? t("menu.items") : t("menu.item")} — {formatRWF(total)}
    </div>
  );
}
