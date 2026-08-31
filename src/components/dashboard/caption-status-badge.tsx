"use client";

import React, { useState } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

interface CaptionStatusBadgeProps {
  status?: "pending" | "generating" | "processing" | "ready" | "completed" | "failed" | "skipped" | string | null;
  jobId?: string | null;
  className?: string;
  onRetrySuccess?: () => void;
}

export function CaptionStatusBadge({
  status,
  jobId,
  className,
  onRetrySuccess,
}: CaptionStatusBadgeProps) {
  const { toast } = useToast();
  const [retrying, setRetrying] = useState(false);

  if (!status || status === "skipped") return null;

  const handleRetry = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!jobId || retrying) return;
    setRetrying(true);

    try {
      const res = await fetch(`/api/caption-jobs/${jobId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "retry" }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to requeue caption generation");
      }

      toast({ title: "Caption generation requeued", tone: "success" });
      onRetrySuccess?.();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Failed to retry caption", tone: "error" });
    } finally {
      setRetrying(false);
    }
  };

  switch (status) {
    case "pending":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md bg-zinc-800/80 px-2 py-0.5 text-xs text-zinc-300 border border-zinc-700/60",
            className
          )}
          title="AI caption generation queued prior to scheduled publishing"
        >
          <Sparkles className="w-3 h-3 text-zinc-400" />
          ✨ Caption scheduled
        </span>
      );

    case "generating":
    case "processing":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300 border border-amber-500/30 animate-pulse",
            className
          )}
          title="AI caption currently generating"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
          ◐ Generating
        </span>
      );

    case "ready":
    case "completed":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400 border border-emerald-500/30",
            className
          )}
          title="AI caption generated and ready"
        >
          ✓ Ready
        </span>
      );

    case "failed":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md bg-red-500/10 px-2 py-0.5 text-xs text-red-400 border border-red-500/30",
            className
          )}
        >
          <span>⚠ Retry needed</span>
          {jobId && (
            <button
              type="button"
              onClick={handleRetry}
              disabled={retrying}
              className="inline-flex items-center gap-0.5 rounded px-1 py-0.2 hover:bg-red-500/20 text-red-300 underline font-medium cursor-pointer"
            >
              <RefreshCw className={cn("w-2.5 h-2.5", retrying && "animate-spin")} />
              {retrying ? "Retrying..." : "Retry"}
            </button>
          )}
        </span>
      );

    default:
      return null;
  }
}
