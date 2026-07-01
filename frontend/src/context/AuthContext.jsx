import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Api, safeGet, safeSet, safeRemove } from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const savedToken = safeGet("invtrack_token");
    const savedUser = safeGet("invtrack_user");
    if (savedToken && savedUser) {
      Api.setToken(savedToken);
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        setCurrentUser(null);
      }
    }
    setReady(true);
  }, []);

  const onAuthSuccess = useCallback((result) => {
    Api.setToken(result.token);
    safeSet("invtrack_user", JSON.stringify(result.user));
    setCurrentUser(result.user);
    return result.user;
  }, []);

  const login = useCallback(
    async (email, password) => {
      const result = await Api.post("/api/auth/login", { email, password });
      return onAuthSuccess(result);
    },
    [onAuthSuccess]
  );

  const register = useCallback(
    async (full_name, email, password, role) => {
      const result = await Api.post("/api/auth/register", { full_name, email, password, role });
      return onAuthSuccess(result);
    },
    [onAuthSuccess]
  );

  const logout = useCallback(() => {
    Api.clearToken();
    safeRemove("invtrack_user");
    setCurrentUser(null);
  }, []);

  const isAdmin = currentUser && currentUser.role === "admin";

  return (
    <AuthContext.Provider value={{ currentUser, ready, login, register, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
