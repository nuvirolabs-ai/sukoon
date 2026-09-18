"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { cx } from "@/lib/utils";

type Toast = { id: string; message: string; tone: "success" | "error" };
type ToastContextValue = {
  notify: (message: string, tone?: Toast["tone"]) => void;
};

const ToastContext = createContext<ToastContextValue>({ notify: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let toastSeq = 0;

/**
 * ToastProvider — compact transient status pills ("✓ Payment recorded").
 * No giant success pages; errors stay close to the action via `tone="error"`.
 * Auto-dismisses; respects reduced motion (no slide).
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, number>>(new Map());

  const notify = useCallback((message: string, tone: Toast["tone"] = "success") => {
    const id = `toast-${++toastSeq}-${Date.now()}`;
    setToasts((current) => [...current.slice(-2), { id, message, tone }]);
    const timer = window.setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
      timers.current.delete(id);
    }, 2800);
    timers.current.set(id, timer);
  }, []);

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div aria-live="polite" aria-atomic="false" className="motion-toast-viewport">
        {toasts.map((toast) => (
          <p
            key={toast.id}
            role={toast.tone === "error" ? "alert" : "status"}
            className={cx("motion-toast", toast.tone === "error" && "is-error")}
          >
            {toast.tone === "error" ? (
              <AlertCircle size={15} aria-hidden="true" />
            ) : (
              <CheckCircle2 size={15} aria-hidden="true" />
            )}
            {toast.message}
          </p>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
