"use client";

import * as React from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlatformId } from "@/lib/platforms";
import {
  type ReadinessReport,
  type ReadinessSeverity,
} from "@/lib/publishing/requirements";
import { PlatformAvatar } from "@/components/dashboard/platform-avatar";
import { PLATFORMS } from "@/lib/platforms";

interface RequirementsPanelProps {
  report: ReadinessReport;
  platformNames: Record<PlatformId, string>;
  onClose?: () => void;
  className?: string;
}

export function RequirementsPanel({
  report,
  platformNames,
  onClose,
  className,
}: RequirementsPanelProps) {
  if (report.perPlatform.length === 0) return null;

  return (
    <div
      className={cn(
        "rounded-lg border bg-white overflow-hidden",
        report.overall === "blocked"
          ? "border-red-200"
          : report.overall === "warning"
            ? "border-amber-200"
            : "border-green-200",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-sm font-semibold text-zinc-900">Platform Requirements</span>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Dismiss"
            className="size-6 inline-flex items-center justify-center rounded-md hover:bg-zinc-100 text-zinc-500"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      {/* Per-platform rows */}
      <div className="divide-y">
        {report.perPlatform.map((row) => (
          <PlatformRow
            key={row.platform}
            severity={row.severity}
            platformId={row.platform}
            platformName={platformNames[row.platform] ?? row.platform}
            summary={row.summary}
            issueCount={row.issues.length}
            issues={row.issues}
          />
        ))}
      </div>
    </div>
  );
}

function PlatformRow({
  severity,
  platformId,
  platformName,
  summary,
  issueCount,
  issues,
}: {
  severity: ReadinessSeverity;
  platformId: string;
  platformName: string;
  summary: string;
  issueCount: number;
  issues: { code: string; severity: "warning" | "blocked"; message: string; actionLabel?: string }[];
}) {
  const [expanded, setExpanded] = React.useState(severity !== "ready");
  const platform = PLATFORMS.find((p) => p.id === platformId);

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className={cn(
          "flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-zinc-50 transition-colors",
          severity === "ready" && "opacity-60"
        )}
      >
        {platform ? (
          <PlatformAvatar platform={platform} size={20} rounded="sm" className="shrink-0" />
        ) : (
          <div className="size-5 rounded bg-zinc-200 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold text-zinc-900">{platformName}</span>
          {expanded ? null : (
            <span className="text-xs text-zinc-500 ml-2">{summary}</span>
          )}
        </div>
        {severity === "ready" ? (
          <CheckCircle2 className="size-3.5 text-green-500 shrink-0" />
        ) : (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium shrink-0",
              severity === "blocked"
                ? "bg-red-50 text-red-700"
                : "bg-amber-50 text-amber-700"
            )}
          >
            {issueCount} issue{issueCount === 1 ? "" : "s"}
          </span>
        )}
      </button>
      {expanded && issueCount > 0 ? (
        <ul className="border-t bg-zinc-50/40 px-3 py-2 space-y-1.5">
          {issues.map((iss, idx) => (
            <li key={`${iss.code}-${idx}`} className="flex items-start gap-2 text-xs">
              <span
                className={cn(
                  "inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full mt-0.5",
                  iss.severity === "blocked" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                )}
              >
                <span className="text-[10px] font-bold">!</span>
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-zinc-700">{iss.message}</p>
                {iss.actionLabel ? (
                  <p className="text-zinc-500 inline-flex items-center gap-1 mt-0.5">
                    <Sparkles className="size-3" />
                    Suggested: {iss.actionLabel}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
