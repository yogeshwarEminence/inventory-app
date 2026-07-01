import React, { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const NAV_ITEMS = [
  { to: "/dashboard", label: "📊 Dashboard", title: "Dashboard" },
  { to: "/products", label: "🛒 Products", title: "Products" },
  { to: "/categories", label: "🏷️ Categories", title: "Categories" },
  { to: "/customers", label: "👥 Customers", title: "Customers" },
  { to: "/orders", label: "📦 Orders", title: "Orders" },
];

const APP_ENV = import.meta.env.VITE_APP_ENV === "production" ? "production" : "development";
const ENV_LABEL = APP_ENV === "production" ? "PROD" : "DEV";

export default function AppShell() {
  const { currentUser, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const active = NAV_ITEMS.find((n) => location.pathname.startsWith(n.to));
  const pageTitle = active ? active.title : "Dashboard";

  return (
    <div className="app-shell">
      <aside className={"sidebar sidebar-" + APP_ENV + (sidebarOpen ? " open" : "")}>
        <div className="brand-mini">
          📦 InvenTrack <span className={"env-badge env-badge-" + APP_ENV}>{ENV_LABEL}</span>
        </div>
        <nav>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => "nav-btn" + (isActive ? " active" : "")}
              onClick={() => setSidebarOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-badge">
            <b>{currentUser?.full_name}</b>
            {currentUser?.role} · {currentUser?.email}
          </div>
          <button className="btn btn-ghost" onClick={logout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="content">
        <header className="topbar">
          <button className="hamburger" onClick={() => setSidebarOpen((o) => !o)}>
            ☰
          </button>
          <h2>{pageTitle}</h2>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
