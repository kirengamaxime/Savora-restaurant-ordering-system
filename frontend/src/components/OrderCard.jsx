import { ChefHat, BellRing, CheckCircle2, CircleCheck, XCircle, Eye, Ban } from "lucide-react";

const PAYMENT_LABEL = { momo: "MoMo", airtel: "Airtel Money", cash: "Cash" };

const READONLY_STATUS_TEXT = {
  received: "Waiting for kitchen to start",
  preparing: "Kitchen is preparing this",
  ready: "Ready — awaiting pickup/serve"
};

function timeAgo(iso) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  return `${mins} min ago`;
}

// canManage (kitchen) controls the advance-status buttons. canCancel
// (manager) controls a separate "Cancel Order" action — the two are
// independent capabilities, not opposite ends of one toggle: kitchen runs
// the cooking, manager can void the order as a business/financial call, and
// neither role can do the other's job from this card.
export default function OrderCard({ order, onAdvance, onCancel, isNewest, canManage = false, canCancel = false }) {
  const orderLabel =
    order.orderType === "dine-in"
      ? `Table ${order.tableNumber}`
      : `Takeaway${order.customerName ? ` — ${order.customerName}` : ""}`;
  const isCancelled = order.kitchenStatus === "cancelled";

  return (
    <div className={`kb-order-card ${order.kitchenStatus} ${isNewest ? "newest" : ""}`}>
      <div className="kb-order-top">
        <span className="kb-order-id">
          Order #{order.id} · {orderLabel}
        </span>
        {isNewest && <span className="kb-new-badge">NEW</span>}
        {order.kitchenStatus === "served" && <CircleCheck size={18} color="#8b8378" />}
        {isCancelled && <XCircle size={18} color="var(--alert)" />}
      </div>

      <ul className="kb-order-items" style={{ listStyle: "none", padding: 0 }}>
        {order.items.map((item, i) => (
          <li key={i}>
            <strong>{item.quantity}×</strong> {item.name}
            {item.removedIngredients?.length > 0 && (
              <span className="kb-order-mod"> — no {item.removedIngredients.join(", ")}</span>
            )}
            {item.note && <span className="kb-order-mod"> ("{item.note}")</span>}
          </li>
        ))}
      </ul>

      <div className="kb-order-meta">
        Paid · {PAYMENT_LABEL[order.paymentMethod] || order.paymentMethod} · {timeAgo(order.createdAt)}
      </div>

      {isCancelled ? (
        <div className="kb-cancelled-info">
          <p style={{ margin: "0 0 4px" }}>
            <strong>Cancelled</strong>
            {order.cancelledByUsername ? ` by ${order.cancelledByUsername}` : ""}
          </p>
          {order.cancellationReason && <p style={{ margin: 0, fontStyle: "italic" }}>"{order.cancellationReason}"</p>}
        </div>
      ) : (
        <>
          {canManage && (
            <>
              {order.kitchenStatus === "received" && (
                <button className="kb-action-btn preparing-action" onClick={() => onAdvance(order.id, "preparing")}>
                  <ChefHat size={16} /> Start Preparing
                </button>
              )}
              {order.kitchenStatus === "preparing" && (
                <button className="kb-action-btn preparing-action" onClick={() => onAdvance(order.id, "ready")}>
                  <BellRing size={16} /> Mark Ready
                </button>
              )}
              {order.kitchenStatus === "ready" && (
                <button className="kb-action-btn ready-action" onClick={() => onAdvance(order.id, "served")}>
                  <CheckCircle2 size={16} /> {order.orderType === "dine-in" ? "Serve" : "Picked up"}
                </button>
              )}
            </>
          )}

          {!canManage && READONLY_STATUS_TEXT[order.kitchenStatus] && (
            <div className="kb-readonly-status">
              <Eye size={14} /> {READONLY_STATUS_TEXT[order.kitchenStatus]}
            </div>
          )}

          {canCancel && (
            <button className="kb-cancel-btn" onClick={() => onCancel(order.id)}>
              <Ban size={14} /> Cancel Order
            </button>
          )}
        </>
      )}
    </div>
  );
}
