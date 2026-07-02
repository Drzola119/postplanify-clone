import * as React from "react";

type Radius = "md" | "lg" | "xl" | "2xl" | "3xl";
const RADIUS: Record<Radius, string> = {
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  "3xl": "rounded-3xl",
};

/**
 * Card — consistent surface styling.
 * 16px (2xl) or 24px (3xl) radius, subtle 1px border, no harsh shadow.
 */
export function Card({
  children,
  className,
  radius = "2xl",
  bordered = true,
  hover = false,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  radius?: Radius;
  bordered?: boolean;
  hover?: boolean;
  as?: "div" | "article";
}) {
  return (
    <Tag
      className={`${RADIUS[radius]} bg-card ${
        bordered ? "border border-zinc-200/70 dark:border-zinc-800" : ""
      } ${hover ? "transition-shadow hover:shadow-sm" : ""} ${className ?? ""}`}
    >
      {children}
    </Tag>
  );
}