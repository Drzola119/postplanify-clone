import { cn } from "@/lib/utils";
import * as React from "react";

interface PPInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export const PPInput = React.forwardRef<HTMLInputElement, PPInputProps>(
  ({ className, label, hint, id, ...props }, ref) => {
    const reactId = React.useId();
    const inputId = id ?? reactId;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-muted-foreground mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full rounded-md border border-input bg-background px-3 h-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring",
            className
          )}
          {...props}
        />
        {hint && <p className="text-xs text-muted-foreground mt-1.5">{hint}</p>}
      </div>
    );
  }
);
PPInput.displayName = "PPInput";

interface PPTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
}

export const PPTextarea = React.forwardRef<HTMLTextAreaElement, PPTextareaProps>(
  ({ className, label, hint, id, ...props }, ref) => {
    const reactId = React.useId();
    const inputId = id ?? reactId;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-muted-foreground mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring resize-y",
            className
          )}
          {...props}
        />
        {hint && <p className="text-xs text-muted-foreground mt-1.5">{hint}</p>}
      </div>
    );
  }
);
PPTextarea.displayName = "PPTextarea";
