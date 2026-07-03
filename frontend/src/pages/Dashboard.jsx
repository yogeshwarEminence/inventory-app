import React, { useEffect, useState } from "react";
import { Api, ApiError } from "../api.js";
import { fmtCurrency } from "../utils.js";

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
        {!loading && !error && stats && (
          <>
            <div className="stat-card">
              <div className="label">Total Products</div>
              <div className="value">{stats.total_products}</div>
            </div>
            <div className="stat-card warn">
              <div className="label">Low Stock Items</div>
              <div className="value">{stats.low_stock_products}</div>
            </div>
            <div className="stat-card">
              <div className="label">Total Orders</div>
              <div className="value">{stats.total_orders}</div>
            </div>
            <div className="stat-card accent">
              <div className="label">Pending Orders</div>
              <div className="value">{stats.pending_orders}</div>
            </div>
            <div className="stat-card">
              <div className="label">Total Customers</div>
              <div className="value">{stats.total_customers}</div>
            </div>
            <div className="stat-card accent">
              <div className="label">Total Revenue</div>
              <div className="value">{fmtCurrency(stats.total_revenue)}</div>
            </div>
          </>
        )}
      </div>
      <div className="card">
        <h3>Welcome to InvenTrack</h3>
        <p className="muted">
          Use the navigation menu to manage products, categories, customers, and orders. Admin users can
          create/edit/delete catalog items; all users can place and track orders.
        </p>
      </div>
    </section>
  );
}
