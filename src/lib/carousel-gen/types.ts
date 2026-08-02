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

export type SlideType = "hook" | "stakes" | "value" | "receipts" | "cta";

export const SLIDE_ORDER: SlideType[] = [
  "hook",
  "stakes",
  "value",
  "receipts",
  "cta",
];

/**
 * The fixed 5-slide skeleton. Every carousel runs against this exact
 * structure — style descriptors and copy vary; the slide roles do not.
 * Hard cap per spec v2 §1; do not flex.
 */
export const SLIDE_COUNT = 5 as const;

/**
 * One row in a script's slides[] array — exactly one per skeleton role,
 * in the order SLIDE_ORDER. Used for both the Groq-generated preview
 * (before images exist) and the persisted job doc (after).
 */
export interface CarouselSlideScript {
  /** 0-based index in SLIDE_ORDER (0=Hook, 4=CTA). */
  index: number;
  type: SlideType;
  /** Short headline — must read verbatim on the rendered image. */
  headline: string;
  /** Optional supporting line (≤12 words). */
  body?: string;
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
  /** Exactly 5 slides, always in SLIDE_ORDER. */
  slides: CarouselSlideScript[];
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
  /** Always length 5, joined to script.slides by index. */
  slides: CarouselJobSlideRecord[];
  /** Total cost of all slide generations, summed at completion. */
  costUsd: number;
  /** True if at least one slide failed and was not retried successfully. */
  hasFailures?: boolean;
  /** First non-recoverable error string, set when status=failed. */
  error?: string;
  /** M4: vision-model consistency verdict over the 5 generated slides. */
  visionQa?: CarouselVisionQa;
  createdAt: unknown;
  updatedAt?: unknown;
}
