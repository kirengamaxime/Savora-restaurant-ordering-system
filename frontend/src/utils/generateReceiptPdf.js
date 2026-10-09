import jsPDF from "jspdf";
import { extractVat } from "./vat.js";

const RESTAURANT = {
  name: "SAVORA",
  tagline: "Restaurant & Café",
  address: "KG 11 Ave, Kigali, Rwanda",
  phone: "+250 788 000 000",
  tin: "TIN: 123456789",
  instagram: "@savora_rw",
  wifi: "savora2026",
};

// Thermal-receipt-style 80mm PDF. jsPDF uses mm units internally,
// so we build an 80mm-wide document of variable height.
export function generateReceiptPdf(order) {
  const doc = new jsPDF({
    unit: "mm",
    format: [80, 240], // width=80mm, tall enough for a full receipt
    orientation: "portrait",
  });

  const W = 80;
  const M = 5; // margin
  let y = 8;

  const center = (text, size = 9, style = "normal") => {
    doc.setFontSize(size);
    doc.setFont("courier", style);
    doc.text(text, W / 2, y, { align: "center" });
    y += size * 0.45;
  };

  const leftRight = (left, right, size = 9) => {
    doc.setFontSize(size);
    doc.setFont("courier", "normal");
    doc.text(left, M, y);
    doc.text(right, W - M, y, { align: "right" });
    y += size * 0.5;
  };

  const divider = (char = "-") => {
    doc.setFontSize(9);
    doc.setFont("courier", "normal");
    doc.text(char.repeat(48), W / 2, y, { align: "center" });
    y += 4;
  };

  const blank = () => { y += 3; };

  // ---- Header ----
  center(RESTAURANT.name, 13, "bold");
  center(RESTAURANT.tagline, 9);
  center(RESTAURANT.address, 8);
  center(`Tel: ${RESTAURANT.phone}`, 8);
  center(RESTAURANT.tin, 8);
  blank();
  divider("=");

  // ---- Order info ----
  leftRight("Order", `#${order.id}`);
  leftRight(
    order.orderType === "dine-in" ? "Table" : "Takeaway",
    order.orderType === "dine-in" ? String(order.tableNumber || "-") : "-"
  );
  const date = new Date(order.createdAt || Date.now());
  const dateStr = date.toLocaleString("en-GB", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).replace(",", "");
  leftRight("Date", dateStr);
  if (order.paymentMethod) {
    leftRight("Payment", order.paymentMethod.toUpperCase());
  }
  divider("=");

  // ---- Items ----
  order.items.forEach((item) => {
    const name = `${item.quantity}× ${item.name}`;
    const price = (item.price * item.quantity).toLocaleString("en-US");
    // Wrap long names onto a second line if needed
    const maxNameChars = 30;
    if (name.length <= maxNameChars) {
      leftRight(name, price);
    } else {
      doc.setFontSize(9);
      doc.setFont("courier", "normal");
      doc.text(name, M, y);
      y += 4;
      doc.text(price, W - M, y, { align: "right" });
      y += 4;
    }
    if (item.removedIngredients?.length) {
      doc.setFontSize(8);
      doc.setFont("courier", "italic");
      doc.text(`-- no ${item.removedIngredients.join(", ")}`, M + 4, y);
      y += 4;
    }
  });

  divider("-");

  // ---- Totals ----
  const { subtotal, vat, total } = extractVat(order.total);
  leftRight("Subtotal", subtotal.toLocaleString("en-US"));
  leftRight("VAT (18%)", vat.toLocaleString("en-US"));
  divider("=");
  leftRight("TOTAL", `${total.toLocaleString("en-US")} RWF`, 11);
  divider("=");

  blank();
  center("THANK YOU", 10, "bold");
  center("Murakoze cyane!", 9);
  blank();
  center(`Follow: ${RESTAURANT.instagram}`, 8);
  center(`WiFi: ${RESTAURANT.wifi}`, 8);
  blank();
  center("Powered by Savora", 8);

  return doc;
}

export function downloadReceiptPdf(order) {
  const doc = generateReceiptPdf(order);
  doc.save(`Savora-Receipt-${order.id}.pdf`);
}

export function printReceiptPdf(order) {
  const doc = generateReceiptPdf(order);
  doc.autoPrint();
  const url = doc.output("bloburl");
  window.open(url, "_blank");
}