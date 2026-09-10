"use client";

import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { getOverrideHeaders } from "@/lib/security/client-overrides";

export function VideoWorkerRefreshButton() {
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    if (running) return;
    setRunning(true);
    setMessage(null);
    try {
      const response = await fetch("/api/videos/run-worker", {
        method: "POST",
        credentials: "include",
        headers: getOverrideHeaders(),
      });
      const body = (await response.json().catch(() => ({}))) as {
        result?: { scanned?: number };
        error?: string;
      };
      if (!response.ok) throw new Error(body.error ?? `Refresh failed (${response.status})`);
      setMessage(`${body.result?.scanned ?? 0} queued video(s) processed`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Refresh failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => void run()}
        disabled={running}
        className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 h-9 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
      >
        {running ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
        {running ? "Processing…" : "Refresh queued videos"}
      </button>
      {message ? <span className="text-xs text-zinc-500" role="status">{message}</span> : null}
    </div>
  );
}
