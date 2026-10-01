import { useEffect, useState } from "react";
import QRCodeLib from "qrcode";

export default function QRCode({ value, size = 160 }) {
  const [dataUrl, setDataUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;
    QRCodeLib.toDataURL(value, { width: size, margin: 1, color: { dark: "#1f2a24", light: "#fbf7ee" } })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (!dataUrl) return <div style={{ width: size, height: size }} />;

  return <img src={dataUrl} alt="QR code to track your order" width={size} height={size} style={{ borderRadius: 10 }} />;
}
