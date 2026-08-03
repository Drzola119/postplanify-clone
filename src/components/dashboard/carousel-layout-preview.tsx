"use client";

/**
 * carousel-layout-preview.tsx
 *
 * Premium visual preview for the Per-slide layout picker.
 *
 * The original `LayoutPreview` rendered near-identical black-on-white
 * wireframes for every variant, which made the picker feel low-trust.
 * This module replaces that with a config-driven renderer that:
 *
 *   1. Reads the style's palette (background / primary / accent) and
 *      fonts (display / body) at preview time so the cards re-skin
 *      instantly when the user tweaks the builder.
 *   2. Renders one of 4 distinct visual archetypes per layout
 *      variant — hero hook, hero hook (grid-safe), value explainer,
 *      receipts callout — so they read differently at a glance.
 *   3. Uses miniature real-feeling sample copy on each card.
 *   4. Supports selected / hover states with a clear ring.
 *
 * The same `CarouselLayoutPreviewCard` is also used by the wizard's
 * right-side preview panel to render a styled mock slide when no
 * generated script exists yet, so the user gets a "live" feel
 * before pressing Generate.
 */

import { Check, TrendingUp, Quote, ArrowRight } from "lucide-react";
import type { LayoutVariant } from "@/lib/carousel-gen/types";

/**
 * Sample copy per layout variant. Real-feeling, short enough to fit
 * inside a 3:4 mini card without truncation.
 */
export interface LayoutPreviewConfig {
  /** Short human category used for the i18n-style helper line. */
  category: "hook" | "value" | "receipts" | "cta";
  /** The headline that renders inside the mini preview. */
  sampleHeadline: string;
  /** Optional body / supporting line that renders below the headline. */
  sampleBody?: string;
  /** Optional callout metric (receipts only). */
  sampleMetric?: string;
  /** Optional keyword pill (CTA only). */
  sampleKeyword?: string;
  /** Optional badge (hook accent strip). */
  sampleBadge?: string;
}

export const LAYOUT_PREVIEW_CONFIG: Record<string, LayoutPreviewConfig> = {
  "headline-only": {
    category: "hook",
    sampleHeadline: "Why most SaaS onboarding fails",
    sampleBody: "Three silent mistakes",
    sampleBadge: "HOT",
  },
  "hook-thumbnail-safe": {
    category: "hook",
    sampleHeadline: "Why most SaaS onboarding fails",
    sampleBody: "Three silent mistakes",
    sampleBadge: "GRID-SAFE",
  },
  "headline-supporting": {
    category: "value",
    sampleHeadline: "Simple system, better conversions",
    sampleBody: "One focused improvement beats ten small tweaks.",
  },
  "headline-callout": {
    category: "receipts",
    sampleHeadline: "Real results, real teams",
    sampleMetric: "+42% engagement",
    sampleBody: "Trusted by 200+ brands",
  },
};

/**
 * Combined pick: variant + the resolved preview config. Resolves the
 * config on the read side so older variants without config still
 * render a sensible default preview.
 */
export function getLayoutPreviewConfig(
  variant: LayoutVariant
): LayoutPreviewConfig {
  const found = LAYOUT_PREVIEW_CONFIG[variant.id];
  if (found) return found;
  return {
    category: "value",
    sampleHeadline: variant.label,
    sampleBody: variant.description,
  };
}

/* ============================================================
 * Palette tokens — typed for safety
 * ============================================================ */
export interface PreviewPalette {
  primary: string;
  background: string;
  accent: string;
  displayFont: string;
  bodyFont: string;
}

/* ============================================================
 * The main picker card
 * ============================================================ */
interface CarouselLayoutPreviewCardProps {
  variant: LayoutVariant;
  selected: boolean;
  /** Called when the user clicks the card. */
  onPick: () => void;
  palette: PreviewPalette;
  /** Optional label / description override (defaults to variant fields). */
  label?: string;
  description?: string;
}

/**
 * One layout-variant card in the picker. Each card renders a real
 * styled mini slide using the live palette/fonts so the picker feels
 * alive instead of a wireframe.
 */
export function CarouselLayoutPreviewCard({
  variant,
  selected,
  onPick,
  palette,
  label,
  description,
}: CarouselLayoutPreviewCardProps) {
  const config = getLayoutPreviewConfig(variant);
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={selected}
      className={
        "group rounded-xl border p-1.5 text-left transition-all " +
        (selected
          ? "border-zinc-900 bg-white shadow-sm ring-2 ring-zinc-900/10"
          : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm")
      }
    >
      <div className="relative">
        <CarouselLayoutPreview
          variant={variant}
          config={config}
          palette={palette}
        />
        {selected ? (
          <span className="absolute end-1.5 top-1.5 inline-flex size-4 items-center justify-center rounded-full bg-zinc-900 text-white shadow">
            <Check className="size-2.5" />
          </span>
        ) : null}
      </div>
      <p className="mt-1.5 text-[11px] font-semibold text-zinc-800">
        {label ?? variant.label}
      </p>
      <p className="text-[10px] leading-tight text-zinc-500">
        {description ?? variant.description}
      </p>
    </button>
  );
}

/* ============================================================
 * The actual preview renderer (used inside the card + standalone)
 * ============================================================ */
interface CarouselLayoutPreviewProps {
  variant: LayoutVariant;
  config: LayoutPreviewConfig;
  palette: PreviewPalette;
  /** When true, render at a larger size for the right-side panel mock. */
  large?: boolean;
}

/**
 * One fully styled mini slide preview. Switches body composition by
 * `previewType` so the same component can render hero / value /
 * receipts / cta without duplicating card markup.
 */
export function CarouselLayoutPreview({
  variant,
  config,
  palette,
  large,
}: CarouselLayoutPreviewProps) {
  const inner = renderInnerByCategory(config.category, config, palette, variant.id);

  return (
    <div
      className="relative aspect-[3/4] w-full overflow-hidden rounded-md border border-zinc-200 transition-colors"
      style={{ backgroundColor: palette.background }}
      aria-hidden
    >
      {inner}
      {large ? (
        <span
          className="absolute bottom-1.5 start-1.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[8px] font-medium text-white"
          style={{ fontFamily: `"${palette.bodyFont}", sans-serif` }}
        >
          Preview
        </span>
      ) : null}
    </div>
  );
}

/* ============================================================
 * Per-category renderers
 * ============================================================ */

function renderInnerByCategory(
  category: LayoutPreviewConfig["category"],
  cfg: LayoutPreviewConfig,
  palette: PreviewPalette,
  variantId: string
) {
  switch (category) {
    case "hook":
      return renderHook(cfg, palette, variantId);
    case "value":
      return renderValue(cfg, palette);
    case "receipts":
      return renderReceipts(cfg, palette);
    case "cta":
      return renderCta(cfg, palette);
  }
}

/* --- HOOK — oversized bold headline + accent stripe + badge ----- */
function renderHook(
  cfg: LayoutPreviewConfig,
  palette: PreviewPalette,
  variantId: string
) {
  const isGridSafe = variantId === "hook-thumbnail-safe";
  return (
    <div className="relative flex size-full flex-col">
      {/* Top accent stripe */}
      <div
        className="h-2 w-full"
        style={{ backgroundColor: palette.accent }}
      />
      <div className="flex-1 px-3 pt-3 pb-3">
        {isGridSafe ? (
          // Grid-safe variant: dashed middle band visualises the
          // Instagram-safe zone so the user can see *why* this
          // variant exists.
          <div className="flex size-full flex-col items-center justify-center gap-1.5 text-center">
            <div className="w-full flex-1 border-t border-dashed border-zinc-300/70" />
            <p
              className="text-sm font-extrabold leading-tight"
              style={{
                color: palette.primary,
                fontFamily: `"${palette.displayFont}", "Helvetica Neue", Arial, sans-serif`,
              }}
            >
              {cfg.sampleHeadline}
            </p>
            <div className="w-full flex-1 border-b border-dashed border-zinc-300/70" />
          </div>
        ) : (
          // Standard hero hook — oversized headline near the top,
          // tiny body below for breathing room.
          <div className="flex size-full flex-col justify-center text-center">
            <p
              className="text-base font-extrabold leading-[1.1] tracking-tight"
              style={{
                color: palette.primary,
                fontFamily: `"${palette.displayFont}", "Helvetica Neue", Arial, sans-serif`,
              }}
            >
              {cfg.sampleHeadline}
            </p>
            {cfg.sampleBody ? (
              <p
                className="mt-1 text-[10px] leading-snug"
                style={{
                  color: palette.primary,
                  opacity: 0.7,
                  fontFamily: `"${palette.bodyFont}", "Helvetica Neue", Arial, sans-serif`,
                }}
              >
                {cfg.sampleBody}
              </p>
            ) : null}
          </div>
        )}
      </div>
      {cfg.sampleBadge ? (
        <span
          className="absolute end-2 top-3.5 rounded-full px-1.5 py-[1px] text-[7px] font-bold uppercase tracking-wide"
          style={{
            backgroundColor: palette.accent,
            color: palette.background,
            fontFamily: `"${palette.displayFont}", sans-serif`,
          }}
        >
          {cfg.sampleBadge}
        </span>
      ) : null}
    </div>
  );
}

/* --- VALUE — headline top + body below in a content block --------- */
function renderValue(cfg: LayoutPreviewConfig, palette: PreviewPalette) {
  return (
    <div className="flex size-full flex-col px-3 pt-4 pb-3">
      <p
        className="text-[11px] font-extrabold leading-tight"
        style={{
          color: palette.primary,
          fontFamily: `"${palette.displayFont}", "Helvetica Neue", Arial, sans-serif`,
        }}
      >
        {cfg.sampleHeadline}
      </p>
      <div
        className="my-2 h-px w-12"
        style={{ backgroundColor: palette.accent }}
      />
      <p
        className="text-[9px] leading-snug"
        style={{
          color: palette.primary,
          opacity: 0.78,
          fontFamily: `"${palette.bodyFont}", "Helvetica Neue", Arial, sans-serif`,
        }}
      >
        {cfg.sampleBody ?? "Supporting line in the body font sits here."}
      </p>
      {/* Content block — small tinted panel suggesting the slide's
          supporting visual. Gives the preview depth without
          introducing a real image. */}
      <div className="mt-auto flex items-center gap-1.5">
        <div
          className="h-5 w-5 rounded-sm"
          style={{ backgroundColor: palette.accent, opacity: 0.85 }}
        />
        <div
          className="h-1.5 flex-1 rounded-full"
          style={{ backgroundColor: palette.primary, opacity: 0.15 }}
        />
      </div>
    </div>
  );
}

/* --- RECEIPTS — quote + avatar + metric block + result badge ----- */
function renderReceipts(cfg: LayoutPreviewConfig, palette: PreviewPalette) {
  return (
    <div className="flex size-full flex-col px-3 pt-3 pb-3">
      {/* Tiny avatar + verified row */}
      <div className="flex items-center gap-1.5">
        <div
          className="size-5 rounded-full"
          style={{ backgroundColor: palette.primary }}
        />
        <span
          className="text-[8px] font-semibold"
          style={{
            color: palette.primary,
            fontFamily: `"${palette.bodyFont}", sans-serif`,
          }}
        >
          Sarah K.
        </span>
        <Quote
          className="size-2.5"
          style={{ color: palette.accent }}
        />
      </div>
      <p
        className="mt-1.5 text-[9px] leading-snug"
        style={{
          color: palette.primary,
          opacity: 0.78,
          fontFamily: `"${palette.bodyFont}", sans-serif`,
          fontStyle: "italic",
        }}
      >
        {cfg.sampleBody ?? "Real results, real teams."}
      </p>
      {/* Metric callout block */}
      <div
        className="mt-auto rounded-md px-1.5 py-1"
        style={{ backgroundColor: palette.primary, color: palette.background }}
      >
        <div className="flex items-center gap-1">
          <TrendingUp className="size-2.5" />
          <span
            className="font-mono text-[10px] font-bold"
            style={{ fontFamily: `"${palette.displayFont}", monospace` }}
          >
            {cfg.sampleMetric ?? "+42%"}
          </span>
        </div>
      </div>
    </div>
  );
}

/* --- CTA — bold closing + keyword button + footer hint ----------- */
function renderCta(cfg: LayoutPreviewConfig, palette: PreviewPalette) {
  const keyword = cfg.sampleKeyword ?? "OPEN";
  return (
    <div className="flex size-full flex-col justify-between px-3 pt-3 pb-3">
      <div>
        <p
          className="text-[11px] font-extrabold leading-tight"
          style={{
            color: palette.primary,
            fontFamily: `"${palette.displayFont}", "Helvetica Neue", Arial, sans-serif`,
          }}
        >
          {cfg.sampleHeadline}
        </p>
        {cfg.sampleBody ? (
          <p
            className="mt-1 text-[9px] leading-snug"
            style={{
              color: palette.primary,
              opacity: 0.7,
              fontFamily: `"${palette.bodyFont}", sans-serif`,
            }}
          >
            {cfg.sampleBody}
          </p>
        ) : null}
      </div>
      {/* Action button + arrow */}
      <div
        className="mt-2 flex items-center justify-between rounded-full px-2 py-1"
        style={{
          backgroundColor: palette.primary,
          color: palette.background,
        }}
      >
        <span
          className="text-[9px] font-bold tracking-wide"
          style={{
            fontFamily: `"${palette.displayFont}", sans-serif`,
          }}
        >
          Comment {keyword}
        </span>
        <ArrowRight className="size-2.5" />
      </div>
    </div>
  );
}

/* ============================================================
 * Standalone right-panel preview mock
 * ============================================================ */

interface CarouselStylePreviewMockProps {
  palette: PreviewPalette;
  /** Headline to render; falls back to a sample if missing. */
  headline?: string;
  /** Body to render; falls back to a sample if missing. */
  body?: string;
  /** Render at the larger size used by the wizard's right panel. */
  large?: boolean;
}

/**
 * Used by the wizard's right-side preview panel when no script has
 * been generated yet. Renders one styled mock slide using the active
 * palette + fonts so the user trusts their choices before pressing
 * Generate.
 */
export function CarouselStylePreviewMock({
  palette,
  headline,
  body,
  large,
}: CarouselStylePreviewMockProps) {
  const config: LayoutPreviewConfig = {
    category: "hook",
    sampleHeadline: headline ?? "Why most SaaS onboarding fails",
    sampleBody: body ?? "Three silent mistakes to avoid",
    sampleBadge: "LIVE PREVIEW",
  };
  return (
    <CarouselLayoutPreview
      variant={{ id: "live-preview", label: "Live preview", description: "" }}
      config={config}
      palette={palette}
      large={large}
    />
  );
}

/* ============================================================
 * Helper helper for the right-panel "5 mini mocks" — one per role
 * ============================================================ */
export const ROLE_PREVIEW_CONFIGS: ReadonlyArray<{
  role: "hook" | "stakes" | "value" | "receipts" | "cta";
  config: LayoutPreviewConfig;
}> = [
  {
    role: "hook",
    config: {
      category: "hook",
      sampleHeadline: "Why most SaaS onboarding fails",
      sampleBody: "Three silent mistakes to avoid",
      sampleBadge: "OPEN",
    },
  },
  {
    role: "stakes",
    config: {
      category: "value",
      sampleHeadline: "The cost of getting it wrong",
      sampleBody: "73% drop off in week one",
    },
  },
  {
    role: "value",
    config: {
      category: "value",
      sampleHeadline: "Simple system, better conversions",
      sampleBody: "One focused improvement beats ten small tweaks.",
    },
  },
  {
    role: "receipts",
    config: {
      category: "receipts",
      sampleHeadline: "Real results, real teams",
      sampleMetric: "+42% engagement",
      sampleBody: "Trusted by 200+ brands",
    },
  },
  {
    role: "cta",
    config: {
      category: "cta",
      sampleHeadline: "Want the playbook?",
      sampleKeyword: "OPEN",
      sampleBody: "Comment below — we send it free.",
    },
  },
];
