import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={
        "rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center " +
        (className ?? "")
      }
    >
      <div className="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
        {icon ?? <Inbox className="size-5" />}
      </div>
      <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
      {description ? (
        <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}