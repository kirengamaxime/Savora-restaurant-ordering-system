import { createContext, useContext, useState, useCallback, useMemo } from "react";
import { clearOrderHistory } from "../orderHistory.js";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [orderType, setOrderType] = useState(null); // "dine-in" | "takeaway"
  const [tableNumber, setTableNumber] = useState("");
  const [items, setItems] = useState([]);

  const addItem = useCallback((newItem) => {
    setItems((prev) => {
      // Two cart lines are "the same" only if same dish AND same removed ingredients.
      const existingIndex = prev.findIndex(
        (it) =>
          it.dishId === newItem.dishId &&
          JSON.stringify([...it.removedIngredients].sort()) ===
            JSON.stringify([...newItem.removedIngredients].sort()) &&
          it.note === newItem.note
      );
      if (existingIndex >= 0) {
        const copy = [...prev];
        copy[existingIndex] = {
          ...copy[existingIndex],
          quantity: copy[existingIndex].quantity + newItem.quantity
        };
        return copy;
      }
      return [...prev, { ...newItem, key: `${newItem.dishId}-${Date.now()}` }];
    });
  }, []);

  const updateQuantity = useCallback((key, quantity) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((it) => it.key !== key)
        : prev.map((it) => (it.key === key ? { ...it, quantity } : it))
    );
  }, []);

  const removeItem = useCallback((key) => {
    setItems((prev) => prev.filter((it) => it.key !== key));
  }, []);

  // Called after a successful, confirmed payment — wipes everything so the
  // screen is a clean slate for the next customer. This is a shared kiosk
  // device, so this also clears this browser's order history — otherwise
  // the next customer could see the previous customer's past orders.
  const resetForNextCustomer = useCallback(() => {
    setItems([]);
    setOrderType(null);
    setTableNumber("");
    clearOrderHistory();
  }, []);

  const total = useMemo(
    () => items.reduce((sum, it) => sum + it.price * it.quantity, 0),
    [items]
  );

  const itemCount = useMemo(() => items.reduce((sum, it) => sum + it.quantity, 0), [items]);

  const value = {
    orderType,
    setOrderType,
    tableNumber,
    setTableNumber,
    items,
    addItem,
    updateQuantity,
    removeItem,
    resetForNextCustomer,
    total,
    itemCount
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
