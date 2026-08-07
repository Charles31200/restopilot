"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, XCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";
type Toast = { id: number; message: string; variant: ToastVariant };

const ToastContext = createContext<((message: string, variant?: ToastVariant) => void) | null>(
  null
);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, variant }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4">
        {toasts.map((toast) => {
          const Icon =
            toast.variant === "success" ? CheckCircle2 : toast.variant === "error" ? XCircle : Info;
          return (
            <div
              key={toast.id}
              role="status"
              className={cn(
                "pointer-events-auto flex items-center gap-2.5 rounded-(--radius-md) border px-4 py-3 text-[13.5px] font-medium shadow-[0_16px_40px_-16px_rgba(16,17,19,0.35)] transition-opacity duration-300",
                toast.variant === "success" && "border-success-text/20 bg-success-soft text-success-text",
                toast.variant === "error" && "border-danger-text/20 bg-danger-soft text-danger-text",
                toast.variant === "info" && "border-line-strong bg-surface text-ink"
              )}
            >
              <Icon size={16} className="shrink-0" />
              {toast.message}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const push = useContext(ToastContext);
  if (!push) throw new Error("useToast must be used within ToastProvider");
  return push;
}
