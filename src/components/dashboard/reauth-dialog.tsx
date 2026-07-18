"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Modal } from "@/components/ui/modal";

interface ReAuthDialogProps {
  open: boolean;
  onClose: () => void;
  onVerified: () => void | Promise<void>;
  title?: string;
  description?: string;
}

export function ReAuthDialog({
  open,
  onClose,
  onVerified,
  title = "Confirm your password",
  description = "For security, please re-enter your password to continue.",
}: ReAuthDialogProps) {
  const auth = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    setError("");
    setBusy(true);
    try {
      await auth.reauthenticate(password);
      setPassword("");
      await onVerified();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white px-3 h-9 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!password || busy}
            className="flex-1 inline-flex items-center justify-center rounded-md bg-zinc-900 px-3 h-9 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? "Verifying…" : "Confirm"}
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
        )}
        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && password && !busy) handleConfirm();
          }}
          autoFocus
          className="w-full rounded-md border border-zinc-200 bg-white px-3 h-10 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
        />
      </div>
    </Modal>
  );
}
