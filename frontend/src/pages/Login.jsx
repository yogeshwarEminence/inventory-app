import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";

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
    <section className="auth-screen">
      <div className="auth-card">
        <h1 className="brand">📦 InvenTrack</h1>
        <p className="muted">Inventory &amp; Order Management System</p>
        <div style={{
          display: "inline-block", background: "#d97b29", color: "#fff", fontWeight: 700,
          fontSize: "11px", letterSpacing: "0.05em", textTransform: "uppercase",
          padding: "3px 10px", borderRadius: "20px", marginBottom: "14px",
        }}>
          Dev Branch
        </div>

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
    </section>
  );
}
