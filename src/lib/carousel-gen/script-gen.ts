/**
 * carousel-gen/script-gen.ts
 *
 * Generates an N-slide carousel script via Groq — mirror of the pattern
 * in `src/lib/video-gen/real-estate/shot-plan.ts` (callGroq + extractJson +
 * jsonMode), trimmed to the carousel skeleton.
 *
 * The wizard ships with 5/7/10/15 slide options (F1). The 5-role skeleton
 * stays intact — Hook → Stakes → (Value × N) → Receipts → CTA — so the
 * layout map and prompt fragments keep working without forking. The
 * LLM gets a prompt sized to `slideCount` and we coerce the result into
 * the right number of slides deterministically.
 */

import "server-only";
import { callGroq, extractJson, GROQ_TEXT_MODEL } from "@/lib/ai/groq";
import {
  SLIDE_COUNT,
  SLIDE_ORDER,
  type AllowedSlideCount,
  type CarouselScript,
  type CarouselSlideScript,
  type SlideType,
  coreSlideRole,
} from "./types";

/**
 * Per-role instructions spliced into the system prompt. Tightened copy
 * here so the LLM can't drift the structure — only the words.
 */
const ROLE_INSTRUCTIONS: Record<SlideType, string> = {
  hook:
    "Slide 1 — HOOK. A bold claim AND a real number (a dollar figure, percentage, count, or time). " +
    "Short, stop-the-scroll. Do not throat-clear. The headline is the entire slide.",
  stakes:
    "Slide 2 — STAKES. One sentence explaining why this matters right now. " +
    "Name the cost of doing nothing. No setup, no backstory. Direct.",
  value:
    "VALUE slide. One idea, big type. Surface the cheat-sheet, the insight, the thing the audience will learn. " +
    "Short lines, easy to skim. No fluff.",
  receipts:
    "RECEIPTS slide. One piece of real proof — a screenshot of a real result, a checkable number, a verifiable fact. " +
    "Specific, not vague. If a number is mentioned, it must be plausible and concrete.",
  cta:
    "Final slide — CALL TO ACTION. One keyword to comment (the user provides this). " +
    "Display the keyword as the visual focus. No second ask, no extra links, no sign-up CTA layered on top.",
};

/**
 * Build the system prompt dynamically so the LLM knows how many slides
 * to produce and what each slot should focus on. The first 5 slots use
 * the canonical 5-role skeleton; extension slots are labelled "Value N"
 * with the role instruction for "value".
 */
function buildSystemPrompt(slideCount: AllowedSlideCount): string {
  const slots: string[] = [];
  for (let i = 0; i < slideCount; i++) {
    const role = coreSlideRole(i, slideCount);
    if (i < 5) {
      slots.push(`${i + 1}. ${role.charAt(0).toUpperCase() + role.slice(1)} — ${ROLE_INSTRUCTIONS[role]}`);
    } else {
      // Extension slots — always "value" middle slides for N > 5.
      slots.push(`${i + 1}. Value (${i - 1}) — ${ROLE_INSTRUCTIONS.value}`);
    }
  }
  return `You are a carousel copywriter for social media. You write punchy, short, scroll-stopping slides.

You produce JSON only — no prose, no preamble, no markdown fences.

The output is a ${slideCount}-slide carousel in this exact order:
${slots.join("\n")}

Hard rules for every slide:
- "headline" MUST be ≤ 8 words. Spell it exactly as given — these render verbatim on the image.
- "body" is OPTIONAL and MUST be ≤ 12 words when present.
- Never invent specific facts (no prices, addresses, dates) unless the user explicitly provided them.
- Never use emoji.
- Never use marketing clichés ("unlock", "unleash", "supercharge", "in today's fast-paced world", "game-changer").
- Match the user's tone if provided (punchy, conversational, professional).
- Vary the value slides — each one should introduce a fresh insight, not repeat the previous.

Respond with JSON only, shaped exactly like:
{"slides":[{"index":0,"type":"hook","headline":"...","body":"..."}]}`;
}

export interface GenerateCarouselScriptRequest {
  /** Topic the user typed in. */
  topic: string;
  /** Optional niche / industry. */
  niche?: string;
  /** Optional tone (e.g. "punchy", "conversational"). */
  tone?: string;
  /** The one CTA keyword the user wants displayed on the final slide. */
  ctaKeyword: string;
  /** Number of slides to generate. Defaults to 5 for backward compat. */
  slideCount?: AllowedSlideCount;
  /** Output language for the on-image text. */
  outputLanguage: "en" | "fr" | "ar";
}

interface RawSlide {
  index?: unknown;
  type?: unknown;
  headline?: unknown;
  body?: unknown;
}

interface RawPlan {
  slides?: RawSlide[];
}

/**
 * Strip punctuation noise, collapse whitespace. Used to normalise the
 * LLM's headline output before length validation — quotes, periods, etc.
 * would otherwise push a perfectly valid 7-word line over the 8-word cap.
 */
function cleanHeadline(s: string): string {
  return s
    .replace(/[“”«»]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function clipToWords(s: string, max: number): string {
  const words = s.split(/\s+/).filter(Boolean);
  if (words.length <= max) return s;
  return words.slice(0, max).join(" ");
}

/**
 * Coerce one raw slide into a CarouselSlideScript. If validation fails
 * we fall back to a sensible default for that role so the script can
 * always be returned (with exactly slideCount slides, in order) — better
 * than throwing and forcing the user to retry.
 */
function coerceSlide(raw: RawSlide | undefined, fallback: SlideType, index: number): CarouselSlideScript {
  const rawHeadline = typeof raw?.headline === "string" ? cleanHeadline(raw.headline) : "";
  const headline = clipToWords(rawHeadline || ROLE_FALLBACKS[fallback].headline, 8);
  const rawBody = typeof raw?.body === "string" ? cleanHeadline(raw.body) : undefined;
  const body = rawBody && rawBody.length > 0 ? clipToWords(rawBody, 12) : undefined;
  return { index, type: fallback, headline, body };
}

/**
 * Per-role fallback copy. Used only when the LLM response is missing or
 * malformed for that slot — never the primary path.
 */
const ROLE_FALLBACKS: Record<SlideType, { headline: string; body?: string }> = {
  hook: { headline: "Free tool, paid price" },
  stakes: { headline: "Most people still overpay" },
  value: { headline: "The actual cheat sheet" },
  receipts: { headline: "Real dashboard, real views" },
  cta: { headline: "Comment for the link" },
};

export interface GenerateCarouselScriptResult {
  script: CarouselScript;
}

/**
 * Generate an N-slide carousel script via Groq. Always returns exactly
 * `slideCount` slides in role order. Never throws on malformed LLM
 * output — falls back per-slot instead so the wizard always has
 * something editable.
 */
export async function generateCarouselScript(
  req: GenerateCarouselScriptRequest,
  apiKey: string
): Promise<GenerateCarouselScriptResult> {
  const slideCount: AllowedSlideCount = req.slideCount ?? (SLIDE_COUNT as AllowedSlideCount);

  const userPrompt = [
    `Topic: ${req.topic}`,
    req.niche ? `Niche: ${req.niche}` : null,
    req.tone ? `Tone: ${req.tone}` : null,
    `CTA keyword (display this verbatim on the final slide): ${req.ctaKeyword}`,
    `Output language: ${req.outputLanguage}`,
    `Slide count: ${slideCount}`,
    "",
    `Slide skeleton (write ONE slide per role, in order, exactly ${slideCount} slides):`,
    ...SLIDE_ORDER.map(
      (t, i) => i < slideCount ? `Slot ${i} (${t.toUpperCase()}): ${ROLE_INSTRUCTIONS[t]}` : null
    ),
    ...Array.from({ length: Math.max(0, slideCount - 5) }, (_, i) => {
      const idx = 5 + i;
      return `Slot ${idx} (VALUE): ${ROLE_INSTRUCTIONS.value}`;
    }),
  ]
    .filter(Boolean)
    .join("\n");

  const { content } = await callGroq({
    apiKey,
    model: GROQ_TEXT_MODEL,
    messages: [
      { role: "system", content: buildSystemPrompt(slideCount) },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.8,
    maxTokens: 900 + (slideCount - 5) * 120,
    jsonMode: true,
  });

  const parsed = extractJson<RawPlan>(content);
  const rawSlides = Array.isArray(parsed?.slides) ? parsed.slides : [];

  // Always produce exactly slideCount slides. The LLM may return extras
  // or miss slots; we coerce deterministically based on index.
  const slides: CarouselSlideScript[] = Array.from({ length: slideCount }, (_, i) => {
    const role = coreSlideRole(i, slideCount);
    return coerceSlide(rawSlides[i], role, i);
  });

  return {
    script: {
      topic: req.topic,
      niche: req.niche,
      tone: req.tone,
      ctaKeyword: req.ctaKeyword,
      slideCount,
      slides,
      outputLanguage: req.outputLanguage,
    },
  };
}

/**
 * Re-export SLIDE_COUNT so callers importing from this module don't need
 * to reach into types.ts directly. Tiny convenience, but keeps the
 * wizard's import surface tight.
 */
export { SLIDE_COUNT };
