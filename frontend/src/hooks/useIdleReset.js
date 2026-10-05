import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";

const IDLE_SECONDS = 90;
const ACTIVITY_EVENTS = ["click", "touchstart", "keydown", "mousemove", "scroll"];

// Call this in any screen between Welcome and Confirmation (Menu, Dish Detail,
// Cart, Checkout). If nobody interacts with the kiosk for IDLE_SECONDS, it
// wipes the in-progress cart and returns to Welcome — otherwise an abandoned
// browse/cart sits there forever, blocking the next customer on a shared
// kiosk. Confirmation has its own shorter, always-firing countdown instead
// of this hook, since that screen is expected to end in a reset regardless.
export function useIdleReset() {
  const navigate = useNavigate();
  const { resetForNextCustomer } = useCart();
  const { setLanguage } = useLanguage();
  const timerRef = useRef(null);

  useEffect(() => {
    function resetTimer() {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        resetForNextCustomer();
        setLanguage("EN");
        navigate("/");
      }, IDLE_SECONDS * 1000);
    }

    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
