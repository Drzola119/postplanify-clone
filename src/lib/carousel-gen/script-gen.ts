/**
 * carousel-gen/script-gen.ts
 *
 * Generates the 5-slide carousel script via Groq — mirror of the pattern
 * in `src/lib/video-gen/real-estate/shot-plan.ts` (callGroq + extractJson +
 * jsonMode), trimmed to the carousel skeleton.
 *
 * Spec §1 / §5 — the skeleton is fixed at exactly 5 slides, in this
 * order: Hook, Stakes, Value, Receipts, CTA. No flex, no per-user count
 * override. Per-slide role instructions live in code, NOT in the LLM —
 * the LLM's job is to write vivid short copy for each slot; the role
 * discipline is ours.
 */

import "server-only";
import { callGroq, extractJson, GROQ_TEXT_MODEL } from "@/lib/ai/groq";
import {
  SLIDE_COUNT,
  SLIDE_ORDER,
  type CarouselScript,
  type CarouselSlideScript,
  type SlideType,
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
    "Slide 3 — VALUE. One idea, big type. Surface the cheat-sheet, the insight, the thing the audience will learn. " +
    "Short lines, easy to skim. No fluff.",
  receipts:
    "Slide 4 — RECEIPTS. One piece of real proof — a screenshot of a real result, a checkable number, a verifiable fact. " +
    "Specific, not vague. If a number is mentioned, it must be plausible and concrete.",
  cta:
    "Slide 5 — CALL TO ACTION. One keyword to comment (the user provides this). " +
    "Display the keyword as the visual focus. No second ask, no extra links, no sign-up CTA layered on top.",
};

const SYSTEM_PROMPT = `You are a carousel copywriter for social media. You write punchy, short, scroll-stopping slides.

You produce JSON only — no prose, no preamble, no markdown fences.

The output is always a 5-slide carousel, in this exact fixed order:
1. Hook — bold claim + a real number (dollars, percent, count, or time).
2. Stakes — one sentence explaining why it matters right now.
3. Value — one idea, big type, easy to skim.
4. Receipts — one piece of real proof: a screenshot, a number, a verifiable result.
5. CTA — display the user's exact keyword as the visual focus.

Hard rules for every slide:
- "headline" MUST be ≤ 8 words. Spell it exactly as given — these render verbatim on the image.
- "body" is OPTIONAL and MUST be ≤ 12 words when present.
- Never invent specific facts (no prices, addresses, dates) unless the user explicitly provided them.
- Never use emoji.
- Never use marketing clichés ("unlock", "unleash", "supercharge", "in today's fast-paced world", "game-changer").
- Match the user's tone if provided (punchy, conversational, professional).

Respond with JSON only, shaped exactly like:
{"slides":[{"index":0,"type":"hook","headline":"...","body":"..."},{"index":1,"type":"stakes","headline":"...","body":"..."},{"index":2,"type":"value","headline":"...","body":"..."},{"index":3,"type":"receipts","headline":"...","body":"..."},{"index":4,"type":"cta","headline":"...","body":"..."}]}`;

export interface GenerateCarouselScriptRequest {
  /** Topic the user typed in. */
  topic: string;
  /** Optional niche / industry. */
  niche?: string;
  /** Optional tone (e.g. "punchy", "conversational"). */
  tone?: string;
  /** The one CTA keyword the user wants displayed on slide 5. */
  ctaKeyword: string;
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
 * always be returned (with exactly 5 slides, in order) — better than
 * throwing and forcing the user to retry.
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
 * Generate a 5-slide carousel script via Groq. Always returns exactly
 * 5 slides in the fixed SLIDE_ORDER. Never throws on malformed LLM
 * output — falls back per-slot instead so the wizard always has
 * something editable.
 */
export async function generateCarouselScript(
  req: GenerateCarouselScriptRequest,
  apiKey: string
): Promise<GenerateCarouselScriptResult> {
  const userPrompt = [
    `Topic: ${req.topic}`,
    req.niche ? `Niche: ${req.niche}` : null,
    req.tone ? `Tone: ${req.tone}` : null,
    `CTA keyword (display this verbatim on slide 5): ${req.ctaKeyword}`,
    `Output language: ${req.outputLanguage}`,
    "",
    "Slide skeleton (write ONE slide per role, in order, exactly 5 slides):",
    ...SLIDE_ORDER.map((t, i) => `Slot ${i} (${t.toUpperCase()}): ${ROLE_INSTRUCTIONS[t]}`),
  ]
    .filter(Boolean)
    .join("\n");

  const { content } = await callGroq({
    apiKey,
    model: GROQ_TEXT_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.8,
    maxTokens: 900,
    jsonMode: true,
  });

  const parsed = extractJson<RawPlan>(content);
  const rawSlides = Array.isArray(parsed?.slides) ? parsed.slides : [];

  // Always produce exactly SLIDE_COUNT slides in SLIDE_ORDER. The LLM
  // may return extras or miss slots; we coerce deterministically.
  const slides: CarouselSlideScript[] = SLIDE_ORDER.map((role, i) =>
    coerceSlide(rawSlides[i], role, i)
  );

  return {
    script: {
      topic: req.topic,
      niche: req.niche,
      tone: req.tone,
      ctaKeyword: req.ctaKeyword,
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
