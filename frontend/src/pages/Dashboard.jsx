import React, { useEffect, useState } from "react";
import { Api, ApiError } from "../api.js";
import { fmtCurrency } from "../utils.js";
import { IconBox, IconAlert, IconOrders, IconLayers, IconUsers, IconTag } from "../components/Icons.jsx";

const STAT_DEFS = [
  { key: "total_products", label: "Total Products", Icon: IconBox, tone: "" },
  { key: "low_stock_products", label: "Low Stock Items", Icon: IconAlert, tone: "warn" },
  { key: "total_orders", label: "Total Orders", Icon: IconOrders, tone: "" },
  { key: "pending_orders", label: "Pending Orders", Icon: IconLayers, tone: "accent" },
  { key: "total_customers", label: "Total Customers", Icon: IconUsers, tone: "" },
  { key: "total_revenue", label: "Total Revenue", Icon: IconTag, tone: "accent", currency: true },
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    Api.get("/api/dashboard/stats")
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Failed to load dashboard");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return (
    <section className="page">
      <div className="stat-grid">
        {loading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div className="stat-card skeleton-card" key={i}>
              <span className="skeleton-bar" style={{ width: "60%" }} />
              <span className="skeleton-bar" style={{ width: "40%", height: "22px", marginTop: "10px" }} />
            </div>
          ))}
        {!loading && error && (
          <div className="card error-msg">
            <div>Failed to load dashboard: {error}</div>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: "10px" }} onClick={() => setReloadKey((k) => k + 1)}>
              Retry
            </button>
          </div>
        )}
        {!loading &&
          !error &&
          stats &&
          STAT_DEFS.map((def) => (
            <div className={"stat-card" + (def.tone ? ` ${def.tone}` : "")} key={def.key}>
              <div className="stat-icon">
                <def.Icon width={16} height={16} />
              </div>
              <div className="label">{def.label}</div>
              <div className="value mono">
                {def.currency ? fmtCurrency(stats[def.key]) : stats[def.key]}
              </div>
            </div>
          ))}
      </div>
      <div className="card welcome-card">
        <h3>Welcome to InvenTrack</h3>
        <p className="muted">
          Use the navigation menu to manage products, categories, customers, and orders. Admin users can
          create/edit/delete catalog items; all users can place and track orders.
        </p>
      </div>
    </section>
  );
}
