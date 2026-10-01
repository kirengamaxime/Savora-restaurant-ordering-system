const KEY = "savora_order_history";
const MAX_HISTORY = 20;

export function getOrderHistory() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addOrderToHistory(orderId) {
  const current = getOrderHistory();
  const next = [orderId, ...current.filter((id) => id !== orderId)].slice(0, MAX_HISTORY);
  localStorage.setItem(KEY, JSON.stringify(next));
}

// On a shared kiosk, this browser/device is reused by every customer — clear
// the previous customer's order history so the next person can't see it.
export function clearOrderHistory() {
  localStorage.removeItem(KEY);
}
