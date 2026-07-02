import * as React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, type LucideIcon } from "lucide-react";

type Variant = "primary" | "outline" | "secondary" | "pill";

const RADIUS: Record<Variant, string> = {
  primary: "rounded-md",
  outline: "rounded-md",
  secondary: "rounded-md",
  pill: "rounded-full",
};

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100",
  outline:
    "border border-zinc-200 bg-background hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900",
  secondary:
    "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700",
  pill: "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900",
};

type Size = "md" | "lg" | "xl";

const SIZE: Record<Size, string> = {
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
  xl: "h-[52px] px-8 text-base",
};

// Original PostPlanify CTA: 6px radius (rounded-md), 500 weight, exact heights 40/48/52.
// Note: rounded-md MUST be in each variant — putting it in BASE caused the pill variant's
// rounded-full to lose in Tailwind v4 CSS ordering.
const BASE =
  "inline-flex items-center justify-center gap-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 whitespace-nowrap";

type Common = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
  Icon?: LucideIcon;
  showArrow?: boolean;
};

type AsButton = Common & React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type AsLink = Common & { href: string; external?: boolean };

/**
 * CTAButton — exact PostPlanify CTA styling:
 * - 6px radius (rounded-md), 500 weight, 16px font, exact heights (40/48/52)
 * - Primary bg: zinc-900 (#171717)
 * - Variant="pill" overrides to fully rounded (used in Founder, API)
 */
export function CTAButton(props: AsButton | AsLink) {
  const {
    variant = "primary",
    size = "lg",
    className,
    children,
    Icon,
    showArrow = false,
    ...rest
  } = props as Common & { href?: string };

  const classes = `${BASE} ${SIZE[size]} ${RADIUS[variant]} ${VARIANT[variant]} ${className ?? ""}`;
  const inner = (
    <>
      {Icon && <Icon className="size-4" />}
      {children}
      {showArrow && <ArrowRight className="size-4" />}
    </>
  );

  if ("href" in rest && rest.href) {
    const external = (rest as AsLink).external;
    if (external) {
      return (
        <a
          href={rest.href}
          target="_blank"
          rel="noopener noreferrer"
          className={classes}
        >
          {inner}
        </a>
      );
    }
    return (
      <Link href={rest.href} className={classes}>
        {inner}
      </Link>
    );
  }

  return (
    <button className={classes} {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
      {inner}
    </button>
  );
}
