import * as React from "react";

/**
 * SectionHeading — consistent H2 styling across the site.
 * Original PostPlanify uses 36px / 700 / 40px / tracking-normal for most H2s.
 */
export function SectionHeading({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={`text-[36px] font-bold leading-[40px] tracking-normal text-center ${className ?? ""}`}
    >
      {children}
    </h2>
  );
}

export function SectionSubtitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`text-base md:text-lg text-muted-foreground text-center max-w-xl mx-auto ${className ?? ""}`}
    >
      {children}
    </p>
  );
}
