"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

type ToastTone = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  title: string;
  description?: string;
  tone?: ToastTone;
  duration?: number;
}

interface ToastContextValue {
  toast: (t: Omit<Toast, "id">) => string;
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((curr) => curr.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback(
    (t: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).slice(2);
      const next: Toast = { id, tone: "info", duration: 4000, ...t };
      setToasts((curr) => [...curr, next]);
      if (next.duration) {
        setTimeout(() => dismiss(id), next.duration);
      }
      return id;
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[360px] max-w-[calc(100vw-32px)] flex-col gap-2">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const iconMap = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
  };
  const toneMap = {
    success: "bg-emerald-50 text-emerald-900 border-emerald-200",
    error: "bg-red-50 text-red-900 border-red-200",
    warning: "bg-amber-50 text-amber-900 border-amber-200",
    info: "bg-blue-50 text-blue-900 border-blue-200",
  };
  const iconTone = {
    success: "text-emerald-600",
    error: "text-red-600",
    warning: "text-amber-600",
    info: "text-blue-600",
  };
  const Icon = iconMap[toast.tone ?? "info"];
  return (
    <div
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded-lg border p-3 shadow-lg animate-in slide-in-from-right-full duration-200",
        toneMap[toast.tone ?? "info"]
      )}
    >
      <Icon className={cn("size-4 mt-0.5 shrink-0", iconTone[toast.tone ?? "info"])} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.description && <p className="text-xs mt-0.5 opacity-80">{toast.description}</p>}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="size-5 inline-flex items-center justify-center rounded hover:bg-black/5"
        aria-label="Dismiss"
      >
        <X className="size-3" />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    return { toast: () => "", dismiss: () => {} };
  }
  return ctx;
}