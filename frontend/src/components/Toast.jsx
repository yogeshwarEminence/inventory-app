import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { IconCheck, IconAlert } from "./Icons.jsx";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({ message: "", type: "", visible: false });
  const timerRef = useRef(null);

  const showToast = useCallback((message, type = "") => {
    setToast({ message, type, visible: true });
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setToast((t) => ({ ...t, visible: false }));
    }, 3200);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className={"toast" + (toast.type ? ` ${toast.type}` : "") + (toast.visible ? "" : " hidden")}>
        {toast.type === "success" && <IconCheck width={16} height={16} />}
        {toast.type === "error" && <IconAlert width={16} height={16} />}
        <span>{toast.message}</span>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
