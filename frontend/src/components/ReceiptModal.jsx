import { useEffect } from "react";
import { X, Download, Printer } from "lucide-react";
import { extractVat } from "../utils/vat.js";
import { downloadReceiptPdf, printReceiptPdf } from "../utils/generateReceiptPdf.js";
import "./ReceiptModal.css";

const RESTAURANT = {
  name: "SAVORA",
  tagline: "Restaurant & Café",
  address: "KG 11 Ave, Kigali, Rwanda",
  phone: "+250 788 000 000",
  tin: "TIN: 123456789",
  instagram: "@savora_rw",
  wifi: "savora2026",
};

function formatRWF(n) {
  return Number(n).toLocaleString("en-US");
}

export default function ReceiptModal({ order, onClose }) {
  useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const { subtotal, vat, total } = extractVat(order.total);
  const date = new Date(order.createdAt || Date.now());
  const dateStr = date.toLocaleString("en-GB", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).replace(",", "");

  return (
    <div className="receipt-modal-backdrop" onClick={onClose}>
      <div className="receipt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="receipt-modal-header">
          <h2>Receipt</h2>
          <button className="receipt-modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="receipt-modal-body">
          <div className="receipt-paper">
            <div className="receipt-center">
              <div className="receipt-title">{RESTAURANT.name}</div>
              <div className="receipt-tagline">{RESTAURANT.tagline}</div>
              <div className="receipt-small">{RESTAURANT.address}</div>
              <div className="receipt-small">Tel: {RESTAURANT.phone}</div>
              <div className="receipt-small">{RESTAURANT.tin}</div>
            </div>

            <div className="receipt-divider">{"=".repeat(40)}</div>

            <div className="receipt-row"><span>Order</span><span>#{order.id}</span></div>
            <div className="receipt-row">
              <span>{order.orderType === "dine-in" ? "Table" : "Takeaway"}</span>
              <span>{order.orderType === "dine-in" ? order.tableNumber : "—"}</span>
            </div>
            <div className="receipt-row"><span>Date</span><span>{dateStr}</span></div>
            {order.paymentMethod && (
              <div className="receipt-row">
                <span>Payment</span>
                <span>{order.paymentMethod.toUpperCase()}</span>
              </div>
            )}

            <div className="receipt-divider">{"=".repeat(40)}</div>

            {order.items.map((item, i) => (
              <div key={i} className="receipt-item">
                <div className="receipt-row">
                  <span className="receipt-item-name">
                    {item.quantity}× {item.name}
                  </span>
                  <span>{formatRWF(item.price * item.quantity)}</span>
                </div>
                {item.removedIngredients?.length > 0 && (
                  <div className="receipt-modifier">
                    -- no {item.removedIngredients.join(", ")}
                  </div>
                )}
              </div>
            ))}

            <div className="receipt-divider">{"-".repeat(40)}</div>

            <div className="receipt-row"><span>Subtotal</span><span>{formatRWF(subtotal)}</span></div>
            <div className="receipt-row"><span>VAT (18%)</span><span>{formatRWF(vat)}</span></div>

            <div className="receipt-divider">{"=".repeat(40)}</div>
            <div className="receipt-row receipt-row-bold">
              <span>TOTAL</span>
              <span>{formatRWF(total)} RWF</span>
            </div>
            <div className="receipt-divider">{"=".repeat(40)}</div>

            <div className="receipt-center" style={{ marginTop: 14 }}>
              <div className="receipt-thanks">THANK YOU</div>
              <div style={{ marginBottom: 10 }}>Murakoze cyane!</div>
              <div className="receipt-footer-note">Follow: {RESTAURANT.instagram}</div>
              <div className="receipt-footer-note">WiFi: {RESTAURANT.wifi}</div>
              <div className="receipt-footer-note" style={{ marginTop: 12 }}>
                Powered by Savora
              </div>
            </div>
          </div>
        </div>

        <div className="receipt-modal-actions">
          <button className="receipt-btn-download" onClick={() => downloadReceiptPdf(order)}>
            <Download size={16} style={{ marginRight: 6, verticalAlign: "-3px" }} />
            Download PDF
          </button>
          <button className="receipt-btn-print" onClick={() => printReceiptPdf(order)}>
            <Printer size={16} style={{ marginRight: 6, verticalAlign: "-3px" }} />
            Print
          </button>
        </div>
      </div>
    </div>
  );
}