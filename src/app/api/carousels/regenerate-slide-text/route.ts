/**
 * POST /api/carousels/regenerate-slide-text
 *
 * F3 — Per-slide AI text regeneration. The wizard lets the user rewrite
 * a single line of the script via a small Groq call. The rest of the
 * deck stays untouched; the wizard stashes the previous version so the
 * user can revert.
 *
 * Distinct from /api/carousels/[jobId]/slides/[index]/regenerate which
 * re-runs the IMAGE for a completed slide. This route only rewrites the
 * TEXT (cheap, no image cost) before generation is committed.
 */
import "server-only";
import { NextRequest } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session-context";
import { resolvers } from "@/lib/security/server-config";
import { callGroq, GROQ_TEXT_MODEL } from "@/lib/ai/groq";
import { jsonError, jsonOk, parseBody } from "@/lib/validation/helpers";
import { createLogger } from "@/lib/log";
import type { CarouselSlideScript, SlideType } from "@/lib/carousel-gen/types";

const logger = createLogger("api:carousels:regenerate-slide-text");

const regenerateSlideTextSchema = z.object({
  topic: z.string().min(3).max(500),
  niche: z.string().max(80).optional(),
  tone: z.string().max(80).optional(),
  ctaKeyword: z.string().min(1).max(40),
  outputLanguage: z.enum(["en", "fr", "ar"]).default("en"),
  /** The current slide to rewrite — gives the LLM the existing copy
   * so the rewrite feels like a variation, not a wild departure. */
  slide: z.object({
    index: z.number().int().min(0).max(49),
    type: z.enum(["hook", "stakes", "value", "receipts", "cta"]),
    headline: z.string().min(1).max(200),
    body: z.string().max(200).optional(),
  }),
});

const ROLE_GUIDANCE: Record<SlideType, string> = {
  hook:
    "This is the HOOK slide. It must lead with a bold claim AND a real number (dollar, percentage, count, or time). " +
    "Short and stop-the-scroll. The headline is the entire slide.",
  stakes:
    "This is the STAKES slide. One sentence naming the cost of doing nothing. No setup, no backstory.",
  value:
    "This is a VALUE slide. One idea, big type. Surface the cheat-sheet / insight. Short lines, easy to skim. " +
    "If the body is present it must be ≤ 12 words.",
  receipts:
    "This is the RECEIPTS slide. One piece of real proof — a screenshot, a checkable number, a verifiable fact. " +
    "Specific, not vague. Plausible, concrete.",
  cta:
    "This is the CTA slide. The CTA keyword is the visual focus. No second ask, no extra links.",
};

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const parsed = await parseBody(request, regenerateSlideTextSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(
      parsed.error?.status ?? 400,
      parsed.error?.message ?? "Invalid payload",
      parsed.error?.issues
    );
  }
  const body = parsed.data;

  const groqApiKey = resolvers.groqApiKey(request.headers);
  if (!groqApiKey) {
    return jsonError(
      503,
      "Slide rewrite is not configured (GROQ_API_KEY missing server-side)."
    );
  }

  const systemPrompt = `You are a carousel copywriter. You write punchy, short, scroll-stopping slide copy.

${ROLE_GUIDANCE[body.slide.type]}

Hard rules:
- "headline" MUST be ≤ 8 words. Spell it exactly as given — these render verbatim on the image.
- "body" is OPTIONAL and MUST be ≤ 12 words when present.
- Never invent specific facts (no prices, addresses, dates) unless the user explicitly provided them.
- Never use emoji.
- Never use marketing clichés ("unlock", "unleash", "supercharge", "in today's fast-paced world", "game-changer").
- Match the user's tone if provided.
- Output JSON only, no prose, no markdown fences, exactly: {"headline":"...","body":"..."} (body may be omitted).`;

  const userPrompt = [
    `Topic: ${body.topic}`,
    body.niche ? `Niche: ${body.niche}` : null,
    body.tone ? `Tone: ${body.tone}` : null,
    `Output language: ${body.outputLanguage}`,
    body.slide.type === "cta" ? `CTA keyword (must appear verbatim on this slide): ${body.ctaKeyword}` : null,
    "",
    `Current slide copy (the rewrite should be a fresh angle on the same idea — not a typo fix):`,
    `headline: ${body.slide.headline}`,
    body.slide.body ? `body: ${body.slide.body}` : "body: (none)",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const { content } = await callGroq({
      apiKey: groqApiKey,
      model: GROQ_TEXT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.9,
      maxTokens: 200,
      jsonMode: true,
    });

    const parsedContent = parseJsonObject(content);
    if (!parsedContent) {
      return jsonError(500, "AI returned malformed JSON");
    }

    const headline = String(parsedContent.headline ?? "").trim();
    if (!headline) {
      return jsonError(500, "AI returned an empty headline");
    }
    const nextBodyRaw =
      typeof parsedContent.body === "string" ? parsedContent.body.trim() : "";
    const next: CarouselSlideScript = {
      index: body.slide.index,
      type: body.slide.type,
      headline: headline.slice(0, 200),
      body: nextBodyRaw ? nextBodyRaw.slice(0, 200) : undefined,
    };

    logger.info("Slide text rewritten", {
      workspaceId: session.workspaceId,
      uid: session.uid,
      index: body.slide.index,
      type: body.slide.type,
    });

    return jsonOk({ slide: next });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("Slide rewrite failed", {
      workspaceId: session.workspaceId,
      error: message,
    });
    return jsonError(500, message);
  }
}

function parseJsonObject(raw: string): Record<string, unknown> | null {
  // Groq sometimes wraps the JSON in ```json fences or adds a trailing
  // sentence. Try a few shapes before failing.
  const trimmed = raw.trim();
  const candidates: string[] = [
    trimmed,
    trimmed.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim(),
  ];
  for (const c of candidates) {
    if (!c) continue;
    try {
      const v = JSON.parse(c) as unknown;
      if (v && typeof v === "object" && !Array.isArray(v)) {
        return v as Record<string, unknown>;
      }
    } catch {
      /* try next candidate */
    }
  }
  // Last-ditch: find the first {...} block.
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      const v = JSON.parse(trimmed.slice(start, end + 1)) as unknown;
      if (v && typeof v === "object" && !Array.isArray(v)) {
        return v as Record<string, unknown>;
      }
    } catch {
      /* fall through */
    }
  }
  return null;
}
