import { CreditCard, Banknote } from "lucide-react";

// These are stylized, brand-colored text badges — not reproductions of the
// actual MTN/Airtel logo artwork — used the same way most payment selectors
// identify a provider (color + wordmark) without copying their logo image.
export default function PaymentBadge({ method }) {
  if (method === "momo") {
    return (
      <div className="payment-badge payment-badge-mtn" aria-hidden="true">
        MTN
      </div>
    );
  }
  if (method === "airtel") {
    return (
      <div className="payment-badge payment-badge-airtel" aria-hidden="true">
        airtel
      </div>
    );
  }
  if (method === "card") {
    return (
      <div className="payment-badge payment-badge-card" aria-hidden="true">
        <CreditCard size={20} />
      </div>
    );
  }
  return (
    <div className="payment-badge payment-badge-cash" aria-hidden="true">
      <Banknote size={20} />
    </div>
  );
}
