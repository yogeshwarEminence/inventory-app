import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { BRANCH, APP_VERSION } from "../branch.js";

const NAV_ITEMS = [
  { to: "/dashboard", label: "📊 Dashboard", title: "Dashboard" },
  { to: "/products", label: "🛒 Products", title: "Products" },
  { to: "/categories", label: "🏷️ Categories", title: "Categories" },
  { to: "/customers", label: "👥 Customers", title: "Customers" },
  { to: "/orders", label: "📦 Orders", title: "Orders" },
];

// BRANCH is a hardcoded per-branch constant (see src/branch.js) rather than
// an env var, so the two branches are always visually distinct regardless
// of how .env is configured on a given deployment.
const IS_DEV_BRANCH = BRANCH === "development";
const THEME = IS_DEV_BRANCH ? "development" : "production";

export default function AppShell() {
  const { currentUser, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const active = NAV_ITEMS.find((n) => location.pathname.startsWith(n.to));
  const pageTitle = active ? active.title : "Dashboard";

  // Real-world touch: keep the browser tab title in sync with the page,
  // so refreshing, bookmarking, or switching tabs is meaningful.
  useEffect(() => {
    document.title = `${pageTitle} · InvenTrack${IS_DEV_BRANCH ? " (Dev)" : ""}`;
  }, [pageTitle]);

  return (
    <div className={"app-shell" + (IS_DEV_BRANCH ? " app-shell-dev" : "")}>
      <aside className={"sidebar sidebar-" + THEME + (sidebarOpen ? " open" : "")}>
        <div className="brand-mini">
          📦 InvenTrack
          <span className={"env-badge env-badge-" + THEME}>{IS_DEV_BRANCH ? "DEV" : "PROD"}</span>
        </div>

        {IS_DEV_BRANCH && (
          <div className="dev-branch-banner" title="You are viewing the development branch">
            🛠️ Development Branch
          </div>
        )}

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
          <div className="build-tag">v{APP_VERSION}</div>
        </div>
      </aside>

      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

      <main className="content">
        <header className="topbar">
          <button className="hamburger" onClick={() => setSidebarOpen((o) => !o)} aria-label="Toggle menu">
            ☰
          </button>
          <h2>{pageTitle}</h2>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
