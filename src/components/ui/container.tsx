import * as React from "react";

/**
 * Container — exact 1280px max-width with 24px horizontal padding,
 * matching the original PostPlanify site's content container.
 */
export function Container({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[1280px] px-6 ${className ?? ""}`}>
      {children}
    </div>
  );
}