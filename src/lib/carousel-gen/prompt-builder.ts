/**
 * carousel-gen/prompt-builder.ts
 *
 * Builds the GPT-Image-2 prompt for a single carousel slide. The prompt
 * is a fixed composition: a "render this slide as part of one deck"
 * header, the resolved style-lock block (exact hex codes, font names,
 * layout variant, safe-zone rule for Hook), and the verbatim copy for
 * that slide.
 *
 * Why both style-lock AND reference-chaining (spec §4): reference-
 * chaining alone relies on the model "looking at" slide 1 — GPT-Image-2
 * ignores the reference image silently today, so stating the exact
 * constraints in words every time is the only guarantee the chain
 * stays consistent.
 *
 * The safe-zone instruction (spec §2) is appended only when this slide
 * is the Hook — it tells GPT-Image-2 to keep all headline text within
 * the vertical centre band of the 1080×1440 frame so Instagram's grid
 * crop doesn't slice off the words that make someone stop scrolling.
 */

import "server-only";
import type {
  CarouselScript,
  CarouselSlideScript,
  CarouselStyle,
} from "./types";

/**
 * Hand-written slide-prompt fragments per role. Tightened language that
 * GPT-Image-2 reliably interprets — vague role cues don't survive
 * across the reference chain.
 */
const ROLE_PROMPT_FRAGMENTS: Record<CarouselSlideScript["type"], string> = {
  hook:
    "This is the FIRST slide of a 5-slide carousel. It must read as a thumbnail at small sizes — " +
    "one bold headline that survives being shrunk to a grid square. Do not include any logo, " +
    "footer, page number, or supporting graphics — the headline is the entire slide.",
  stakes:
    "This is the SECOND slide of a 5-slide carousel. One sentence, dead-centre. " +
    "Set the cost of inaction. No bullet points, no icons, no decorations.",
  value:
    "This is the THIRD slide of a 5-slide carousel. One idea, big type. " +
    "Headline at the top, one short supporting line beneath it. Plenty of negative space below.",
  receipts:
    "This is the FOURTH slide of a 5-slide carousel. Show one piece of real proof: " +
    "a screenshot frame, a checkable number, or a verifiable result. The slide may include a " +
    "small browser-chrome or phone-mockup frame around a real-looking screenshot — do not fabricate " +
    "fake logos. Honest receipt-style imagery.",
  cta:
    "This is the FIFTH and LAST slide of a 5-slide carousel. Display the keyword as the visual " +
    "focus, very large. No second ask, no links, no sign-up prompt layered on top — the keyword " +
    "is the entire ask.",
};

const SAFE_ZONE_INSTRUCTION =
  "Keep all headline text within the vertical centre safe zone of the frame — " +
  "the middle 1080×1215 region. The image is cropped to a square grid thumbnail " +
  "in the feed, so anything near the top or bottom edges will be cut off. " +
  "Centred text in the middle band survives both views.";

const NO_DECORATION_RULE =
  "No logos, no watermarks, no page numbers, no borders, no drop shadows, no device frames " +
  "unless the role is receipts. Photographic and editorial typography composition. " +
  "Spell the headline text exactly as given — do not translate, paraphrase, or rearrange it.";

/**
 * Compose the full GPT-Image-2 prompt for one slide.
 *
 * Output shape, in order:
 *   1. Role fragment (tightened language for this slide's job)
 *   2. Style-lock block (exact colors, exact fonts, layout description, safe-zone if Hook)
 *   3. The exact headline + body to render, quoted, so the model sees
 *      them as literals to spell verbatim.
 *   4. The no-decoration rule.
 */
export function buildStyleLockPrompt(args: {
  style: CarouselStyle;
  slide: CarouselSlideScript;
  /**
   * The CDN URL of the slide rendered before this one in the chain.
   * Empty string for slide 0 (Hook has no predecessor). The caller
   * is responsible for passing this — the prompt builder does not
   * look up the prior asset. We do NOT include the URL in the prompt
   * text because GPT-Image-2 ignores reference images today; instead
   * the caller passes it as `referenceImageUrls` to the image-gen router.
   */
  previousSlideAssetUrl: string;
}): string {
  const { style, slide, previousSlideAssetUrl } = args;
  const layout = style.layouts[slide.type];

  const styleLock = [
    `Canvas: solid background of ${style.colors.background}.`,
    `Primary text colour: ${style.colors.primary}.`,
    `Accent colour (used sparingly, no more than one small emphasis element per slide): ${style.colors.accent}.`,
    `Headline type: heavy bold display face in the spirit of ${style.fonts.display}.`,
    `Supporting line type: plain quiet sans face in the spirit of ${style.fonts.body}.`,
    `Layout treatment for this role (${slide.type}): ${layout.description}.`,
    slide.type === "hook" ? SAFE_ZONE_INSTRUCTION : null,
    previousSlideAssetUrl
      ? "Match the colour palette, typography, and overall feel of the previous slide in this carousel — this slide is part of one cohesive 5-slide deck."
      : "This is slide 1 of 5 — establish the visual identity every later slide will match.",
  ]
    .filter(Boolean)
    .join(" ");

  const copy = [
    `Headline (spell exactly, nothing else, all caps is fine if it fits): "${slide.headline}"`,
    slide.body ? `Supporting line (spell exactly): "${slide.body}"` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return [
    ROLE_PROMPT_FRAGMENTS[slide.type],
    styleLock,
    copy,
    NO_DECORATION_RULE,
  ].join("\n\n");
}

/**
 * Pre-rendered style-lock block that gets reused across all slides.
 * Exported so callers (tests, the commit endpoint) can reconstruct the
 * prompt without re-running Groq — same pattern as
 * CONTINUITY_FRAGMENTS_FOR_COMMIT in real-estate/shot-plan.ts.
 */
export function buildStyleLockHeader(style: CarouselStyle): string {
  return [
    `Background: ${style.colors.background}.`,
    `Primary: ${style.colors.primary}.`,
    `Accent: ${style.colors.accent} (use sparingly).`,
    `Display font: ${style.fonts.display}.`,
    `Body font: ${style.fonts.body}.`,
  ].join(" ");
}

/**
 * Build a per-slide regenerate prompt — same shape as the original
 * generation prompt, but with explicit instruction to redraw just this
 * slide. Used by POST /api/carousels/[jobId]/slides/[index]/regenerate.
 */
export function buildRegeneratePrompt(args: {
  style: CarouselStyle;
  slide: CarouselSlideScript;
  previousSlideAssetUrl: string;
}): string {
  const base = buildStyleLockPrompt(args);
  return `${base}\n\nRedraw this single slide — match the style of the rest of the deck, keep the same copy verbatim.`;
}

/**
 * Re-export the script type so callers can import everything they need
 * from this module without reaching into types.ts.
 */
export type { CarouselScript };
