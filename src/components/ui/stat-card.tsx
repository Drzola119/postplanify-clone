import { cn } from "@/lib/utils";
import * as React from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  iconClassName?: string;
  className?: string;
  footer?: React.ReactNode;
}

export function StatCard({ label, value, icon, iconClassName, className, footer }: StatCardProps) {
  return (
    <div className={cn("rounded-xl border border-zinc-200 bg-white p-5", className)}>
      <div className="flex items-center gap-3 mb-3">
        {icon && (
          <span className={cn("inline-flex items-center justify-center size-9 rounded-lg", iconClassName ?? "bg-zinc-100 text-zinc-700")}>
            {icon}
          </span>
        )}
        <p className="text-xs font-semibold text-zinc-500">{label}</p>
      </div>
      <p className="text-2xl font-bold text-zinc-900">{value}</p>
      {footer && <div className="mt-2">{footer}</div>}
    </div>
  );
}