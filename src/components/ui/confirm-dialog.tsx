"use client";

import { Modal } from "@/components/ui/modal";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "destructive" | "default";
}

/**
 * Lightweight confirmation modal. Uses the standard Modal primitive so
 * keyboard handling + backdrop click are consistent across the app.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={
        <span className="inline-flex items-center gap-2">
          {tone === "destructive" ? (
            <AlertTriangle className="size-4 text-red-500" />
          ) : null}
          {title}
        </span>
      }
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white px-4 h-9 text-sm font-medium hover:bg-zinc-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={
              tone === "destructive"
                ? "inline-flex items-center justify-center rounded-md bg-red-600 hover:bg-red-700 text-white px-4 h-9 text-sm font-medium"
                : "inline-flex items-center justify-center rounded-md bg-zinc-950 hover:bg-zinc-800 text-white px-4 h-9 text-sm font-medium"
            }
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      {description ? <p className="text-sm text-zinc-600">{description}</p> : null}
    </Modal>
  );
}