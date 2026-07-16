import "server-only";
import type { PromptStyle } from "./prompt-styles";
import type { AspectRatioKey } from "./types";

/**
 * Our own prompt-template engine.
 *
 * Two builders:
 *
 *   buildInfographicPrompt   — plain text for Gemini / GPT Image 2.
 *   buildAdsInfographicPrompt — same shape, with offer content spliced in.
 *   buildIdeogramJsonPrompt    — JSON object (subject / style / palette /
 *                                bbox_layout / typography) for Ideogram.
 *
 * All wording is original. The token-replacement pattern mirrors the
 * teardown's "one shared template, one per-style directive" shape, but
 * the template itself, the directives, and the hard-rules list are all
 * our own writing.
 *
 * NEVER copy or closely paraphrase the third-party template language
 * documented in our teardown reports.
 */

export type ColorScheme = "light" | "dark" | "brand";
export type Tool = "instant" | "ads";

const TOKENS = {
  topic:       "[TOPIC]",
  offerTitle:  "[OFFER_TITLE]",
  offerCopy:   "[OFFER_COPY]",
  colorScheme: "[COLOR_SCHEME]",
  directive:   "[DIRECTIVE]",
  ratio:       "[ASPECT_RATIO]",
  footerCta:   "[FOOTER_CTA]",
} as const;

function cleanValue(value: string | undefined, fallback: string): string {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function footerCtaLine(raw: string | undefined): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) {
    return "Do not include any URL, watermark, or footer mark.";
  }
  return `Render ${trimmed} as a subtle, centred footer mark — readable but not distracting.`;
}

/**
 * The shared template body. Same shape for both the keyword and offer-ads
 * tools — only the substitution table changes. Wording is ours.
 */
const TEMPLATE_BODY = `
Render one finished social-media infographic image. Not an outline, not a
strategy document, not a text-only plan — the image itself, in one pass.

Topic:        ${TOKENS.topic}
Offer title:  ${TOKENS.offerTitle}
Offer copy:   ${TOKENS.offerCopy}
Color scheme: ${TOKENS.colorScheme}
Aspect ratio: ${TOKENS.ratio}

Visual concept (use this as the structural metaphor / layout):
${TOKENS.directive}

Hard rules:
- Output exactly one finished image at the requested aspect ratio.
- Use a hook-first layout: a bold top headline, a clear middle that realises
  the visual concept above, and a bottom save/share trigger.
- Keep every body line short and high-contrast; never write paragraphs.
- Use one consistent type system, palette, and icon style across the whole
  image — no mixed styles, no decorative scenery.
- The colour palette should match the requested scheme end-to-end.
- ${TOKENS.footerCta}
- Do not include any logo unless explicitly provided.
- Do not include any person, face, photograph, or stock-style scene.
- Commit to one strong design — do not output multiple options.
`.trim();

function substitute(
  template: string,
  values: Record<keyof typeof TOKENS, string>
): string {
  let out = template;
  for (const [k, v] of Object.entries(values)) {
    out = out.replaceAll(`[${k.toUpperCase()}]`, v);
  }
  return out;
}

export function buildInfographicPrompt(input: {
  topic: string;
  style: PromptStyle;
  colorScheme?: ColorScheme;
  aspectRatio?: AspectRatioKey;
  footerCta?: string;
}): string {
  const t = cleanValue(input.topic, "a generic niche topic");
  const scheme = cleanValue(input.colorScheme, "light");
  const ratio = cleanValue(input.aspectRatio, "4x5");
  const cta = footerCtaLine(input.footerCta);

  return substitute(TEMPLATE_BODY, {
    topic: t,
    offerTitle: "(not applicable — keyword-driven infographic)",
    offerCopy: "(not applicable — keyword-driven infographic)",
    colorScheme: scheme,
    directive: input.style.directive,
    ratio: ratio,
    footerCta: cta,
  });
}

export function buildAdsInfographicPrompt(input: {
  offerTitle: string;
  offerCopy: string;
  style: PromptStyle;
  colorScheme?: ColorScheme;
  aspectRatio?: AspectRatioKey;
  footerCta?: string;
}): string {
  const title = cleanValue(input.offerTitle, "the offer");
  const copy = cleanValue(
    input.offerCopy,
    "(the user has not provided sales copy yet — infer a plausible, internally-consistent description of the offer from its title alone)"
  );
  const scheme = cleanValue(input.colorScheme, "light");
  const ratio = cleanValue(input.aspectRatio, "4x5");
  const cta = footerCtaLine(input.footerCta);

  return substitute(TEMPLATE_BODY, {
    topic: title,
    offerTitle: title,
    offerCopy: copy,
    colorScheme: scheme,
    directive: input.style.directive,
    ratio: ratio,
    footerCta: cta,
  });
}

/**
 * JSON-structured prompt for Ideogram 4. We wrap the same conceptual
 * content as the plain-text builder, but in Ideogram's preferred shape
 * (subject / style / palette / bbox / typography).
 *
 * Ideogram's documentation prefers a JSON string in the prompt field;
 * see https://developer.ideogram.ai/ideogram-api/api-overview.
 */
export function buildIdeogramJsonPrompt(input: {
  tool: Tool;
  topic: string;
  offerTitle?: string;
  offerCopy?: string;
  style: PromptStyle;
  colorScheme?: ColorScheme;
  aspectRatio?: AspectRatioKey;
  footerCta?: string;
}): Record<string, unknown> {
  const scheme = input.colorScheme ?? "light";
  const palette = paletteForScheme(scheme);
  const footerCta = input.footerCta?.trim();

  const subject =
    input.tool === "ads"
      ? `${input.offerTitle ?? input.topic} — ${input.style.title}`
      : `${input.topic} — ${input.style.title}`;

  const body =
    input.tool === "ads"
      ? input.offerCopy?.trim() ?? input.topic
      : input.topic;

  return {
    subject,
    body,
    style: input.style.directive,
    colour_palette: palette,
    bbox_layout: {
      top: `${input.style.title} — short hook headline, max 6 words`,
      middle: `Realise the ${input.style.title} metaphor with one consistent visual treatment`,
      bottom: footerCta
        ? `Save / share trigger: "${footerCta}"`
        : "Save / share trigger line",
    },
    typography:
      scheme === "dark"
        ? "Bold sans-serif headline (white on dark), muted sans-serif body (60% white), single accent colour for callouts."
        : "Bold sans-serif headline (deep ink on light), muted sans-serif body (50% ink), single accent colour for callouts.",
    constraints: [
      "No people, faces, hands, or photographs.",
      "No watermarks, URLs, or third-party logos.",
      "Single consistent type system and icon style throughout.",
      "Do not invent specific statistics; only reference numbers present in the input.",
    ],
    footer: footerCta ?? null,
  };
}

/**
 * Map a `ColorScheme` to a 5-colour hex palette that drives the Ideogram
 * JSON `colour_palette` field.
 */
export function paletteForScheme(scheme: ColorScheme): string[] {
  if (scheme === "dark") return ["#0F172A", "#1E293B", "#38BDF8", "#F8FAFC", "#94A3B8"];
  if (scheme === "brand") return ["#18181B", "#FACC15", "#0EA5E9", "#F8FAFC", "#71717A"];
  return ["#FFFFFF", "#F8FAFC", "#18181B", "#2563EB", "#F97316"];
}