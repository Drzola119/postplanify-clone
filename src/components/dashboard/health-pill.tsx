import { cn } from "@/lib/utils";

export type HealthStatus = "ok" | "warning" | "error" | "idle";

interface HealthPillProps {
  status: HealthStatus;
  label?: string;
  className?: string;
}

const META: Record<
  HealthStatus,
  { dot: string; text: string; defaultLabel: string }
> = {
  ok: { dot: "bg-emerald-500", text: "text-emerald-700", defaultLabel: "Healthy" },
  warning: { dot: "bg-amber-500", text: "text-amber-700", defaultLabel: "Degraded" },
  error: { dot: "bg-red-500", text: "text-red-700", defaultLabel: "Disconnected" },
  idle: { dot: "bg-zinc-400", text: "text-zinc-700", defaultLabel: "Idle" },
};

export function HealthPill({ status, label, className }: HealthPillProps) {
  const meta = META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium",
        meta.text,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", meta.dot)} />
      {label ?? meta.defaultLabel}
    </span>
  );
}