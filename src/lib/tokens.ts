// Design tokens extracted from postplanify.com — 2026-06-26
// Source of truth: docs/audit/design-tokens.json

export const colors = {
  // Neutral (zinc scale)
  zinc50: "#FAFAFA",
  zinc100: "#F5F5F5",
  zinc200: "#E5E5E5",
  zinc300: "#D4D4D4",
  zinc400: "#A1A1AA",
  zinc500: "#737373",
  zinc600: "#52525B",
  zinc700: "#3F3F46",
  zinc800: "#27272A",
  zinc900: "#18181B",
  zinc950: "#0A0A0A",
  white: "#FFFFFF",
  black: "#000000",

  // Primary action — near-black zinc-950
  primary: "#0A0A0A",
  primaryHover: "#18181B",

  // Brand blue (calendar highlight, link, info)
  blue50: "#EFF6FF",
  blue100: "#DBEAFE",
  blue200: "#BFDBFE",
  blue300: "#93C5FD",
  blue400: "#60A5FA",
  blue500: "#3B82F6",
  blue600: "#2563EB",
  blue700: "#1D4ED8",
  blue800: "#1E40AF",

  // Status — green (success / approved)
  green50: "#F0FDF4",
  green100: "#DCFCE7",
  green500: "#22C55E",
  green600: "#16A34A",
  green700: "#15803D",

  // Status — red (danger)
  red50: "#FEF2F2",
  red500: "#EF4444",
  red600: "#DC2626",

  // Status — amber (warning / orange CTA)
  amber50: "#FFFBEB",
  amber300: "#FCD34D",
  amber400: "#FBBF24",
  amber500: "#F59E0B",
  amber600: "#D97706",
  orange500: "#F97316",

  // Status — pink / violet (accent)
  pink500: "#EC4899",
  violet500: "#8B5CF6",
  violet600: "#7C3AED",
  violet700: "#6D28D9",

  // Cyan (avatar/secondary gradient)
  cyan400: "#22D3EE",
  cyan500: "#06B6D4",

  // Yellow band (highlight strip)
  yellow200: "#FEF08A",
  yellow300: "#FDE047",

  // Slate
  slate400: "#94A3B8",
  slate500: "#475569",
} as const;

export const radii = {
  xs: "4px",
  sm: "6px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  "2xl": "20px",
  "3xl": "24px",
  pill: "9999px",
  circle: "50%",
} as const;

export const shadows = {
  xs: "0 1px 2px 0 rgba(0,0,0,0.05)",
  sm: "0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)",
  DEFAULT: "0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)",
  md: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
  lg: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)",
  card: "0 1px 6px 0 rgba(0,0,0,0.06), 0 2px 32px 0 rgba(0,0,0,0.16)",
  none: "none",
} as const;

export const typography = {
  fontFamily: {
    sans: "Inter, 'Inter Fallback', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },
  size: {
    xs: "12px",
    sm: "14px",
    base: "16px",
    lg: "18px",
    xl: "20px",
    "2xl": "24px",
    "3xl": "30px",
  },
  weight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
  },
  leading: {
    tight: "15px",
    snug: "20px",
    normal: "24px",
    relaxed: "28px",
    loose: "32px",
  },
} as const;

export const spacing = {
  sidebarWidth: 240,
  sidebarCollapsedWidth: 64,
  headerHeight: 56,
  pagePadding: 24,
  cardRadius: 12,
  buttonHeight: {
    sm: 28,
    md: 36,
    lg: 40,
    xl: 48,
  },
  inputHeight: 36,
} as const;

export const motion = {
  duration: {
    fast: "150ms",
    base: "200ms",
    slow: "300ms",
    slower: "500ms",
  },
  easing: {
    out: "cubic-bezier(0.16, 1, 0.3, 1)",
    inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
} as const;

export const zIndex = {
  base: 0,
  dropdown: 50,
  sticky: 60,
  modalBackdrop: 70,
  modal: 80,
  toast: 90,
  tooltip: 100,
  sidebar: 40,
} as const;