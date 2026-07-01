/* src/api.js — thin fetch wrapper that attaches JWT auth and handles errors */

// API base can be overridden at build time with VITE_API_BASE (see .env.example).
// Falls back to the same auto-detection behaviour as the original vanilla-JS app.
const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (window.location.origin.includes(":500")
    ? window.location.origin.replace(/:\d+$/, ":5000")
    : "http://localhost:5000");

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

class ApiClient {
  constructor() {
    this.token = safeGet("invtrack_token") || null;
  }

  setToken(token) {
    this.token = token;
    if (token) safeSet("invtrack_token", token);
  }

  clearToken() {
    this.token = null;
    safeRemove("invtrack_token");
  }

  async request(method, path, body) {
    const headers = { "Content-Type": "application/json" };
    if (this.token) headers["Authorization"] = `Bearer ${this.token}`;

    let res;
    try {
      res = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (err) {
      throw new ApiError("Cannot reach the server. Is the backend running?", 0);
    }

    let data = null;
    try {
      data = await res.json();
    } catch (e) {
      /* no body */
    }

    if (!res.ok) {
      const message =
        (data && (data.error || (data.errors && data.errors.join(", ")))) ||
        "Request failed";
      throw new ApiError(message, res.status, data);
    }
    return data;
  }

  get(path) {
    return this.request("GET", path);
  }
  post(path, body) {
    return this.request("POST", path, body);
  }
  put(path, body) {
    return this.request("PUT", path, body);
  }
  patch(path, body) {
    return this.request("PATCH", path, body);
  }
  del(path) {
    return this.request("DELETE", path);
  }
}

export const Api = new ApiClient();

// localStorage guarded helpers (mirrors original localStorage_safe_* behaviour)
export function safeSet(key, val) {
  try {
    localStorage.setItem(key, val);
  } catch (e) {
    /* ignore */
  }
}
export function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}
export function safeRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    /* ignore */
  }
}
