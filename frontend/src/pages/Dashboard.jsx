import React, { useEffect, useState } from "react";
import { Api, ApiError } from "../api.js";
import { fmtCurrency } from "../utils.js";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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
  }, []);

  return (
    <section className="page">
      <div className="stat-grid">
        {loading && <div className="card">Loading dashboard…</div>}
        {!loading && error && <div className="card error-msg">Failed to load dashboard: {error}</div>}
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
