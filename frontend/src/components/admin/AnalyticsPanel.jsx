import { useEffect, useState } from "react";
import { TrendingUp, ShoppingBag, Wallet } from "lucide-react";
import { getSalesAnalytics } from "../../api.js";
import { formatRWF } from "../../utils.js";

export default function AnalyticsPanel() {
  const [data, setData] = useState(null);

  useEffect(() => {
    getSalesAnalytics().then(setData);
  }, []);

  if (!data) return <p style={{ padding: 32, color: "var(--kb-ink-soft)" }}>Loading analytics…</p>;

  const maxDailyRevenue = Math.max(1, ...data.daily.map((d) => d.revenue || 0));
  const avgOrderValue = data.allTimeOrders ? Math.round(data.allTimeRevenue / data.allTimeOrders) : 0;

  return (
    <div className="mm-container" style={{ maxWidth: 1000 }}>
      <div className="analytics-kpi-row">
        <div className="analytics-kpi-card">
          <Wallet size={20} color="var(--accent-dark)" />
          <p className="analytics-kpi-value">{formatRWF(data.allTimeRevenue)}</p>
          <p className="analytics-kpi-label">All-time revenue</p>
        </div>
        <div className="analytics-kpi-card">
          <ShoppingBag size={20} color="var(--accent-dark)" />
          <p className="analytics-kpi-value">{data.allTimeOrders}</p>
          <p className="analytics-kpi-label">All-time orders</p>
        </div>
        <div className="analytics-kpi-card">
          <TrendingUp size={20} color="var(--accent-dark)" />
          <p className="analytics-kpi-value">{formatRWF(avgOrderValue)}</p>
          <p className="analytics-kpi-label">Average order value</p>
        </div>
      </div>

      <div className="analytics-section">
        <p className="analytics-section-title">Revenue — last 14 days with sales</p>
        {data.daily.length === 0 ? (
          <p style={{ color: "var(--kb-ink-soft)", fontSize: 14 }}>No paid orders yet.</p>
        ) : (
          <div className="analytics-bar-chart">
            {data.daily.map((d) => (
              <div className="analytics-bar-col" key={d.day}>
                <div
                  className="analytics-bar"
                  style={{ height: `${Math.max(6, (d.revenue / maxDailyRevenue) * 120)}px` }}
                  title={`${formatRWF(d.revenue)} · ${d.orders} order${d.orders === 1 ? "" : "s"}`}
                />
                <span className="analytics-bar-label">
                  {new Date(d.day).toLocaleDateString([], { month: "short", day: "numeric" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="analytics-columns">
        <div className="analytics-section" style={{ flex: 1 }}>
          <p className="analytics-section-title">Top dishes</p>
          {data.topDishes.length === 0 && <p style={{ color: "var(--kb-ink-soft)", fontSize: 14 }}>No sales yet.</p>}
          {data.topDishes.map((d, i) => (
            <div className="analytics-list-row" key={d.name}>
              <span>
                {i + 1}. {d.name}
              </span>
              <span style={{ color: "var(--kb-ink-soft)" }}>{d.quantity}×</span>
              <strong>{formatRWF(d.revenue)}</strong>
            </div>
          ))}
        </div>

        <div className="analytics-section" style={{ flex: 1 }}>
          <p className="analytics-section-title">By payment method</p>
          {data.byPaymentMethod.length === 0 && <p style={{ color: "var(--kb-ink-soft)", fontSize: 14 }}>No paid orders yet.</p>}
          {data.byPaymentMethod.map((p) => (
            <div className="analytics-list-row" key={p.method}>
              <span style={{ textTransform: "capitalize" }}>{p.method}</span>
              <span style={{ color: "var(--kb-ink-soft)" }}>
                {p.orders} order{p.orders === 1 ? "" : "s"}
              </span>
              <strong>{formatRWF(p.revenue)}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
