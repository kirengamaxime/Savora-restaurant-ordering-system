import { Inbox, ChefHat, BellRing, CheckCircle2 } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";

export default function OrderProgress({ status, pickupLabel }) {
  const { t } = useLanguage();

  const steps = [
    { key: "received", label: t("orders.statusReceived"), icon: Inbox },
    { key: "preparing", label: t("orders.statusPreparing"), icon: ChefHat },
    { key: "ready", label: t("orders.statusReady"), icon: BellRing },
    { key: "served", label: t("orders.statusServed"), icon: CheckCircle2 }
  ];

  const currentIndex = steps.findIndex((s) => s.key === status);

  return (
    <div className="progress-track">
      {steps.map((step, i) => {
        const Icon = step.icon;
        const done = i < currentIndex;
        const current = i === currentIndex;
        return (
          <div className={`progress-step ${done ? "done" : ""} ${current ? "current" : ""}`} key={step.key}>
            <div className="progress-dot">
              <Icon size={18} />
            </div>
            <span className="progress-label">
              {step.key === "served" && pickupLabel ? pickupLabel : step.label}
            </span>
            {i < steps.length - 1 && <div className="progress-line" />}
          </div>
        );
      })}
    </div>
  );
}
