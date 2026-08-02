/**
 * carousel-gen/types.ts
 *
 * Shared shapes for the Carousel Studio workflow. Mirrors the structural
 * pattern of `src/lib/video-gen/real-estate/types.ts` so the wizard, API
 * routes, and render worker all speak the same vocabulary.
 *
 * Server-only — the wizard receives serialised JSON, never imports these
 * directly. The wizard's CarouselItem[] hand-off to the existing composer
 * (carousel-media-card.tsx) is built on top of these shapes.
 */

/**
 * The five canonical slide roles. The carousel skeleton always opens
 * with Hook, always closes with CTA, and uses Value / Stakes / Receipts
 * between. For dynamic slide counts (5/7/10/15) the middle roles repeat
 * — extra slides are typed as one of the five canonical roles (most
 * commonly "value") so the layout / prompt machinery keeps working
 * without forking.
 */
export type SlideType = "hook" | "stakes" | "value" | "receipts" | "cta";

/**
 * The original 5-role order. Used as the canonical layout map and as the
 * default 5-slide skeleton. For dynamic counts the workflow iterates
 * over `script.slides` directly, not this array.
 */
export const SLIDE_ORDER: SlideType[] = [
  "hook",
  "stakes",
  "value",
  "receipts",
  "cta",
];

/**
 * Allowed slide counts the wizard offers. Defaults to 5 for backward
 * compatibility. The 5-role skeleton stays intact; longer decks repeat
 * middle roles (stakes/value/receipts) so layouts and prompts still map
 * cleanly. The wizard enforces this set client-side; the API validates
 * via `slideCount` plus `slides.length` agreement.
 */
export const ALLOWED_SLIDE_COUNTS = [5, 7, 10, 15] as const;
export type AllowedSlideCount = (typeof ALLOWED_SLIDE_COUNTS)[number];
export const DEFAULT_SLIDE_COUNT: AllowedSlideCount = 5;

/** Legacy alias for code paths that read the constant. */
export const SLIDE_COUNT: AllowedSlideCount = 5;

/**
 * Map any slide index to its role. For the 5-skeleton positions
 * (0=Hook, 1=Stakes, 2=Value, 3=Receipts, 4=CTA) this returns the
 * literal role; for extension slides it returns a sensible default
 * (value for middle positions, cta for the last position). The wizard
 * also generates `slide.sectionLabel` so the UI can show the user a
 * human label like "Slide 6 — Value 2".
 */
export function coreSlideRole(index: number, total: number): SlideType {
  if (index === 0) return "hook";
  if (index === total - 1) return "cta";
  // For 5-slide carousels the original 5-role skeleton applies.
  if (total === 5) {
    if (index === 1) return "stakes";
    if (index === 2) return "value";
    if (index === 3) return "receipts";
    return "value";
  }
  // For longer decks: Hook, Stakes, then value-heavy middle, then
  // Receipts in the second-to-last slot, then CTA at the end.
  const secondToLast = total - 2;
  if (index === 1) return "stakes";
  if (index === secondToLast) return "receipts";
  return "value";
}

/** Human label for a section (used by the wizard to title each slide row). */
export function sectionLabel(index: number, total: number): string {
  const core = coreSlideRole(index, total);
  if (total === 5) return core.charAt(0).toUpperCase() + core.slice(1);
  if (core === "hook" || core === "cta") {
    return core.charAt(0).toUpperCase() + core.slice(1);
  }
  if (core === "stakes") return "Stakes";
  if (core === "receipts") return "Receipts";
  // value middle slides get a numbered suffix so the wizard can label
  // each row distinctly (Value 2, Value 3, ...).
  let valueOrdinal = 0;
  for (let i = 0; i <= index; i++) {
    if (coreSlideRole(i, total) === "value") valueOrdinal++;
  }
  return valueOrdinal <= 1 ? "Value" : `Value ${valueOrdinal - 1}`;
}

/**
 * One row in a script's slides[] array — exactly one per skeleton role,
 * in the order SLIDE_ORDER. Used for both the Groq-generated preview
 * (before images exist) and the persisted job doc (after).
 */
export interface CarouselSlideScript {
  /** 0-based index in `script.slides[]` (0=Hook, last=CTA). */
  index: number;
  type: SlideType;
  /** Short headline — must read verbatim on the rendered image. */
  headline: string;
  /** Optional supporting line (≤12 words). */
  body?: string;
  /** Optional background image (data URL or CDN URL) for this slide. */
  backgroundUrl?: string;
  /** Background image opacity (0–100). Defaults to 0 (no bg shown). */
  backgroundOpacity?: number;
}

export interface CarouselScript {
  /** Topic the user typed in — echoed back so the wizard can label the result. */
  topic: string;
  /** Optional niche / industry the user selected. */
  niche?: string;
  /** Optional tone (e.g. "punchy", "conversational"). */
  tone?: string;
  /** One keyword to comment ("Comment OPEN"). Echoed back for the CTA slide. */
  ctaKeyword: string;
  /** Exactly `slideCount` slides. */
  slides: CarouselSlideScript[];
  /** Number of slides in this deck. Always matches `slides.length`. */
  slideCount: AllowedSlideCount;
  /** Output language for ON-IMAGE text. Independent of UI locale. */
  outputLanguage: "en" | "fr" | "ar";
}

/**
 * A layout variant — describes how to compose this slide's headline + body
 * inside the 1080×1440 canvas. The Hook variant carries the safe-zone
 * constraint because it also has to work as an Instagram grid thumbnail.
 */
export interface LayoutVariant {
  id: string;
  label: string;
  description: string;
  /** When true, prompts must include the safe-zone text-instruction. */
  requiresSafeZone?: boolean;
}

/** The three high-level layout picks the wizard offers as clickable cards. */
export type LayoutVariantId = "centered" | "split" | "bold-headline";

/** Map a LayoutVariantId to the per-role LayoutVariant objects. */
export interface LayoutVariantSet {
  id: LayoutVariantId;
  label: string;
  description: string;
  /** Returns the LayoutVariant to use for each of the 5 roles. */
  resolve: () => {
    hook: LayoutVariant;
    stakes: LayoutVariant;
    value: LayoutVariant;
    receipts: LayoutVariant;
    cta: LayoutVariant;
  };
}

/**
 * A CarouselStyle is decided once per brand and reused across every
 * carousel in that brand. Layouts are assigned per slide ROLE, not per
 * slide index, so the same style always pairs the same role with the
 * same layout treatment.
 */
export interface CarouselStyle {
  id: string;
  label: string;
  colors: {
    /** Primary brand color — used for headlines / dominant text. */
    primary: string;
    /** Canvas background color. */
    background: string;
    /** Accent — used sparingly for emphasis only. */
    accent: string;
  };
  fonts: {
    /** Display font — bold, heavy, headlines only. */
    display: string;
    /** Body font — plain, quiet, never competes. */
    body: string;
  };
  layouts: {
    hook: LayoutVariant;
    stakes: LayoutVariant;
    value: LayoutVariant;
    receipts: LayoutVariant;
    cta: LayoutVariant;
  };
  /** Provenance — M1 only ships `manual`, M3 adds `brand-analyzed`, M4 adds `brand-kit`. */
  source: "manual" | "brand-analyzed" | "brand-kit";
}

/**
 * One persisted slide in the carouselJobs doc. Lives in slides[] parallel
 * to script.slides[] — same length, same order, joined by index.
 */
export interface CarouselJobSlideRecord {
  index: number;
  type: SlideType;
  /** Public CDN URL (Bunny). Empty until status=complete. */
  assetUrl: string;
  /** Firestore mediaAssets id, for "Use in this post" hand-off. */
  assetId: string;
  status: "pending" | "generating" | "complete" | "failed";
  /** Provider that successfully served the request. */
  provider?: string;
  /** Cost in USD for this single slide. */
  costUsd?: number;
  /** Width × height pixels of the returned image. */
  width?: number;
  height?: number;
  errorMessage?: string;
  /** Background image URL set via F6 — passed through to render output. */
  backgroundUrl?: string;
  /** Background image opacity (0–100). */
  backgroundOpacity?: number;
}

export type CarouselJobStatus =
  | "scripting"
  | "generating_slides"
  | "complete"
  | "failed";

/**
 * Result of the M4 vision-model consistency QA pass. Stored on the job
 * doc after the workflow finishes drawing all 5 slides so the wizard
 * can surface a per-slide "drift" badge on the review screen.
 */
export interface CarouselVisionQa {
  status: "running" | "complete" | "failed";
  model: string;
  /** Slide indices Groq vision flagged as visually inconsistent. */
  drift: number[];
  /** Free-text reasoning returned by the model (first 400 chars). */
  notes: string;
  completedAt?: unknown;
  error?: string;
}

export interface CarouselJobDoc {
  workspaceId: string;
  uid: string;
  status: CarouselJobStatus;
  /** The resolved script the user committed (after edit, if any). */
  script: CarouselScript;
  /** Resolved style id — joins to CAROUSEL_STYLES table at read time. */
  styleId: string;
  /** M2+: full style the workflow will run against. Set when the user
   * picks a custom palette/typography/layout that isn't in the
   * server-side CAROUSEL_STYLES registry. */
  styleSnapshot?: CarouselStyle;
  /** Always length script.slides.length, joined by index. */
  slides: CarouselJobSlideRecord[];
  /** Total cost of all slide generations, summed at completion. */
  costUsd: number;
  /** True if at least one slide failed and was not retried successfully. */
  hasFailures?: boolean;
  /** First non-recoverable error string, set when status=failed. */
  error?: string;
  /** M4: vision-model consistency verdict over the 5 generated slides. */
  visionQa?: CarouselVisionQa;
  /** F9: optional Firestore carousel record id this job was saved under. */
  carouselId?: string;
  createdAt: unknown;
  updatedAt?: unknown;
}
