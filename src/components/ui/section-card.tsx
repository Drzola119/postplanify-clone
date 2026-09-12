import { cn } from "@/lib/utils";
import * as React from "react";

interface SectionCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  noPadding?: boolean;
}

export function SectionCard({ title, subtitle, action, noPadding, className, children, ...props }: SectionCardProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-card overflow-hidden", className)} {...props}>
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/50">
          <div>
            {title && <h3 className="text-sm font-semibold text-foreground">{title}</h3>}
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={cn(noPadding ? "" : "p-5")}>{children}</div>
    </div>
  );
}
