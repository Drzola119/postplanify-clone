"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

export function Modal({ open, onClose, title, description, children, footer, size = "md", className }: ModalProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in-0 duration-200" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative w-full max-h-[calc(100vh-2rem)] flex flex-col rounded-xl bg-white shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200",
          sizes[size],
          className
        )}
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-zinc-200 shrink-0">
          <div>
            {title && <h2 className="text-base font-semibold text-zinc-900">{title}</h2>}
            {description && <p className="text-xs text-zinc-500 mt-1">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-7 inline-flex items-center justify-center rounded-md hover:bg-zinc-100 text-zinc-500"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        {children && <div className="p-5 overflow-y-auto flex-1 min-h-0">{children}</div>}
        {footer && <div className="px-5 py-3 border-t border-zinc-200 flex items-center justify-end gap-2 bg-zinc-50 rounded-b-xl shrink-0">{footer}</div>}
      </div>
    </div>
  );
}