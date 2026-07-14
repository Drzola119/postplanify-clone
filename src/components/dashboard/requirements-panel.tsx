"use client";

import * as React from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlatformId } from "@/lib/platforms";
import {
  type ReadinessReport,
  type ReadinessSeverity,
} from "@/lib/publishing/requirements";

interface RequirementsPanelProps {
  report: ReadinessReport;
  platformNames: Record<PlatformId, string>;
  /** When true, shows compact summary only (used in sticky action bar). */
  compact?: boolean;
  className?: string;
}

/**
 * Renders the publish readiness report for the current composer state.
 * When compact, shows just the count + overall tone; otherwise expands
 * into per-platform status rows with issues + suggested actions.
 */
export function RequirementsPanel({
  report,
  platformNames,
  compact = false,
  className,
}: RequirementsPanelProps) {
  const [open, setOpen] = React.useState(!compact);
  if (report.perPlatform.length === 0) return null;

  const ToneIcon = report.overall === "blocked"
    ? AlertCircle
    : report.overall === "warning"
      ? AlertTriangle
      : CheckCircle2;
  const toneText = report.overall === "blocked"
    ? `${report.blockedCount} platform${report.blockedCount === 1 ? "" : "s"} blocked`
    : report.overall === "warning"
      ? `${report.warningCount} warning${report.warningCount === 1 ? "" : "s"}`
      : `Ready to publish to ${report.readyCount} platform${report.readyCount === 1 ? "" : "s"}`;

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
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-zinc-50 transition-colors"
      >
        <span className="inline-flex items-center gap-2">
          <ToneIcon
            className={cn(
              "size-4 flex-shrink-0",
              report.overall === "blocked"
                ? "text-red-500"
                : report.overall === "warning"
                  ? "text-amber-500"
                  : "text-green-500"
            )}
          />
          <span className="text-sm font-medium">{toneText}</span>
        </span>
        {open ? (
          <ChevronDown className="size-4 text-zinc-500" />
        ) : (
          <ChevronRight className="size-4 text-zinc-500" />
        )}
      </button>
      {open ? (
        <div className="border-t divide-y">
          {report.perPlatform.map((row) => (
            <PlatformRow
              key={row.platform}
              severity={row.severity}
              platformName={platformNames[row.platform] ?? row.platform}
              summary={row.summary}
              issueCount={row.issues.length}
              issues={row.issues}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PlatformRow({
  severity,
  platformName,
  summary,
  issueCount,
  issues,
}: {
  severity: ReadinessSeverity;
  platformName: string;
  summary: string;
  issueCount: number;
  issues: { code: string; severity: "warning" | "blocked"; message: string; actionLabel?: string }[];
}) {
  const [expanded, setExpanded] = React.useState(severity !== "ready");
  const Icon = severity === "blocked" ? AlertCircle : severity === "warning" ? AlertTriangle : CheckCircle2;
  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-start justify-between gap-2 px-3 py-2 text-left hover:bg-zinc-50 transition-colors"
      >
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <Icon
            className={cn(
              "size-3.5 mt-0.5 flex-shrink-0",
              severity === "blocked"
                ? "text-red-500"
                : severity === "warning"
                  ? "text-amber-500"
                  : "text-green-500"
            )}
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-zinc-900">{platformName}</p>
            <p className="text-xs text-zinc-500 truncate">{summary}</p>
          </div>
        </div>
        {issueCount > 0 ? (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium flex-shrink-0",
              severity === "blocked"
                ? "bg-red-50 text-red-700"
                : "bg-amber-50 text-amber-700"
            )}
          >
            {issueCount} issue{issueCount === 1 ? "" : "s"}
          </span>
        ) : null}
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