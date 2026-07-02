import { cn } from "@/lib/utils";
import * as React from "react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-12 px-6", className)}>
      {icon && (
        <div className="size-12 rounded-full bg-zinc-100 text-zinc-500 inline-flex items-center justify-center mb-3">
          {icon}
        </div>
      )}
      <p className="text-sm font-semibold text-zinc-900">{title}</p>
      {description && <p className="text-xs text-zinc-500 mt-1 max-w-md">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}