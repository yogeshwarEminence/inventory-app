import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { BRANCH, APP_VERSION } from "../branch.js";
import {
  IconDashboard,
  IconBox,
  IconTag,
  IconUsers,
  IconOrders,
  IconLogout,
  IconMenu,
  IconClose,
  IconWrench,
} from "./Icons.jsx";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", title: "Dashboard", Icon: IconDashboard },
  { to: "/products", label: "Products", title: "Products", Icon: IconBox },
  { to: "/categories", label: "Categories", title: "Categories", Icon: IconTag },
  { to: "/customers", label: "Customers", title: "Customers", Icon: IconUsers },
  { to: "/orders", label: "Orders", title: "Orders", Icon: IconOrders },
];

// BRANCH is a hardcoded per-branch constant (see src/branch.js) rather than
// an env var, so the two branches are always visually distinct regardless
// of how .env is configured on a given deployment.
const IS_DEV_BRANCH = BRANCH === "development";
const THEME = IS_DEV_BRANCH ? "development" : "production";

function initialsOf(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
}

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
        <div className="sidebar-brand">
          <span className="brand-icon">
            <IconBox width={19} height={19} />
          </span>
          <span className="brand-text">InvenTrack</span>
          <span className={"env-badge env-badge-" + THEME}>{IS_DEV_BRANCH ? "DEV" : "PROD"}</span>
          <button className="hamburger sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <IconClose width={18} height={18} />
          </button>
        </div>

        {IS_DEV_BRANCH && (
          <div className="dev-branch-banner" title="You are viewing the development branch">
            <IconWrench width={14} height={14} />
            Development Branch
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
              <item.Icon className="nav-icon" width={17} height={17} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <span className="avatar">{initialsOf(currentUser?.full_name)}</span>
            <div className="user-meta">
              <b>{currentUser?.full_name}</b>
              <span>
                {currentUser?.role} · {currentUser?.email}
              </span>
            </div>
          </div>
          <button className="btn btn-ghost nav-logout" onClick={logout}>
            <IconLogout width={15} height={15} />
            Logout
          </button>
          <div className="build-tag">v{APP_VERSION}</div>
        </div>
      </aside>

      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

      <main className="content">
        <header className="topbar">
          <button className="hamburger" onClick={() => setSidebarOpen((o) => !o)} aria-label="Toggle menu">
            <IconMenu width={20} height={20} />
          </button>
          <h2>{pageTitle}</h2>
          {IS_DEV_BRANCH && <span className="topbar-env-chip">Development environment</span>}
        </header>
        <Outlet />
      </main>
    </div>
  );
}
