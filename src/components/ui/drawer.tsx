"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  width?: "sm" | "md" | "lg";
}

const widths = {
  sm: "w-[400px] sm:w-[400px]",
  md: "w-[400px] sm:w-[450px]",
  lg: "w-[500px] sm:w-[550px]",
};

export function Drawer({ open, onClose, title, icon, children, className, width = "md" }: DrawerProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    // Focus the panel itself or the first focusable element
    const t = window.setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      first?.focus();
    }, 30);

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      window.clearTimeout(t);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <div
        className="absolute inset-0 bg-black/40 animate-in fade-in-0 duration-200"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex flex-col bg-background p-6 shadow-lg border-l",
          "transition ease-in-out",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
          "data-[state=open]:duration-500 data-[state=closed]:duration-300",
          "max-w-sm overflow-y-auto",
          widths[width],
          className
        )}
        data-state="open"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        {title ? (
          <div className="flex flex-col text-center sm:text-left space-y-6">
            <h2 className="font-semibold text-foreground flex items-center gap-2 text-lg">
              {icon}
              {title}
            </h2>
          </div>
        ) : null}
        <div className={cn("flex-1", title ? "mt-6" : "")}>{children}</div>
      </div>
    </div>
  );
}
