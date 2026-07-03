import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";
import { BRANCH, APP_VERSION } from "../branch.js";
import { IconBox, IconWrench, IconLayers } from "../components/Icons.jsx";

const IS_DEV_BRANCH = BRANCH === "development";

export default function Login() {
  const { login, register } = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState("login-form");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState("staff");
  const [registerError, setRegisterError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError("");
    try {
      const user = await login(loginEmail.trim(), loginPassword);
      showToast(`Welcome, ${user.full_name.split(" ")[0]}!`, "success");
      navigate("/dashboard");
    } catch (err) {
      setLoginError(err.message);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setRegisterError("");
    try {
      const user = await register(regName.trim(), regEmail.trim(), regPassword, regRole);
      showToast(`Welcome, ${user.full_name.split(" ")[0]}!`, "success");
      navigate("/dashboard");
    } catch (err) {
      setRegisterError(err.message);
    }
  }

  return (
    <section className={"auth-screen" + (IS_DEV_BRANCH ? " auth-screen-dev" : "")}>
      {IS_DEV_BRANCH && (
        <div className="dev-strip">
          <IconWrench width={14} height={14} />
          You're signing in to the <strong>development</strong> build of InvenTrack — data here is
          separate from production.
        </div>
      )}

      <div className="auth-split">
        <div className="auth-visual">
          <div className="auth-visual-brand">
            <span className="auth-visual-icon">
              <IconBox width={26} height={26} />
            </span>
            InvenTrack
          </div>
          <h1>
            {IS_DEV_BRANCH ? "Development workspace" : "Run your stockroom like clockwork"}
          </h1>
          <p>
            {IS_DEV_BRANCH
              ? "You're on the development branch. Try out new features safely before they ship to production."
              : "Track products, stock levels, categories, customers, and orders — all in one calm, fast place."}
          </p>
          <ul className="auth-visual-points">
            <li>
              <IconLayers width={16} height={16} /> Real-time stock &amp; low-stock alerts
            </li>
            <li>
              <IconLayers width={16} height={16} /> Order lifecycle from pending to shipped
            </li>
            <li>
              <IconLayers width={16} height={16} /> One catalog for every category and customer
            </li>
          </ul>
          {IS_DEV_BRANCH && (
            <div className="auth-visual-badge">
              <IconWrench width={13} height={13} />
              Development build · v{APP_VERSION}
            </div>
          )}
        </div>

        <div className="auth-form-panel">
          <div className="auth-card">
            <h1 className="brand">
              <IconBox width={22} height={22} /> InvenTrack
              {IS_DEV_BRANCH && <span className="env-badge env-badge-development">DEV</span>}
            </h1>
            <p className="muted">Inventory &amp; Order Management System</p>

            <div className="tabs">
              <button
                className={"tab-btn" + (tab === "login-form" ? " active" : "")}
                onClick={() => setTab("login-form")}
              >
                Sign In
              </button>
              <button
                className={"tab-btn" + (tab === "register-form" ? " active" : "")}
                onClick={() => setTab("register-form")}
              >
                Register
              </button>
            </div>

            {tab === "login-form" && (
              <form className="auth-form" onSubmit={handleLogin}>
                <label>Email</label>
                <input
                  type="email"
                  required
                  placeholder="admin@inventory.local"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
                <label>Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">
                  Sign In
                </button>
                <p className="error-msg">{loginError}</p>
                <p className="hint">Demo: admin@inventory.local / Admin@123</p>
              </form>
            )}

            {tab === "register-form" && (
              <form className="auth-form" onSubmit={handleRegister}>
                <label>Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Jane Doe"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                />
                <label>Email</label>
                <input
                  type="email"
                  required
                  placeholder="jane@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                />
                <label>Password</label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                />
                <label>Role</label>
                <select value={regRole} onChange={(e) => setRegRole(e.target.value)}>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
                <button type="submit" className="btn btn-primary">
                  Create Account
                </button>
                <p className="error-msg">{registerError}</p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
