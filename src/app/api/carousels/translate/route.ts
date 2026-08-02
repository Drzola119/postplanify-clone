/**
 * POST /api/carousels/translate
 *
 * F10 — Translate the whole carousel script to a target language. Keeps
 * the original-language script around in client state so the user can
 * revert with one click.
 *
 * No images are generated on this call — the wizard only re-renders
 * slides after the user commits from step 3 → step 4, so they get the
 * translated copy in the next round of image generation.
 */
import "server-only";
import { NextRequest } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session-context";
import { resolvers } from "@/lib/security/server-config";
import { callGroq, GROQ_TEXT_MODEL } from "@/lib/ai/groq";
import { jsonError, jsonOk, parseBody } from "@/lib/validation/helpers";
import { createLogger } from "@/lib/log";
import type { CarouselScript, CarouselSlideScript } from "@/lib/carousel-gen/types";

const logger = createLogger("api:carousels:translate");

const translateRequestSchema = z.object({
  script: z.object({
    topic: z.string().min(1).max(500),
    niche: z.string().max(80).optional(),
    tone: z.string().max(80).optional(),
    ctaKeyword: z.string().min(1).max(40),
    slideCount: z.number().int().min(5).max(15),
    outputLanguage: z.enum(["en", "fr", "ar"]),
    slides: z
      .array(
        z.object({
          index: z.number().int().min(0).max(49),
          type: z.enum(["hook", "stakes", "value", "receipts", "cta"]),
          headline: z.string().min(1).max(200),
          body: z.string().max(200).optional(),
        })
      )
      .min(1)
      .max(20),
  }),
  targetLanguage: z.string().min(2).max(8),
});

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  fr: "French",
  es: "Spanish",
  de: "German",
  pt: "Portuguese",
  ar: "Arabic",
  ja: "Japanese",
  zh: "Chinese",
  hi: "Hindi",
  nl: "Dutch",
  it: "Italian",
};

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const parsed = await parseBody(request, translateRequestSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(
      parsed.error?.status ?? 400,
      parsed.error?.message ?? "Invalid payload",
      parsed.error?.issues
    );
  }
  const { script, targetLanguage } = parsed.data;

  const targetName = LANGUAGE_NAMES[targetLanguage] ?? targetLanguage;
  if (targetLanguage === script.outputLanguage) {
    return jsonError(400, "Target language is the same as the source language.");
  }

  const groqApiKey = resolvers.groqApiKey(request.headers);
  if (!groqApiKey) {
    return jsonError(
      503,
      "Translation is not configured (GROQ_API_KEY missing server-side)."
    );
  }

  const systemPrompt = `You are a translator of social-media carousel copy. Translate the input into ${targetName}.

Preserve the same word-count limits and tone rules as the source:
- Keep the slide's role intact (hook / stakes / value / receipts / cta).
- "headline" must stay ≤ 8 words. If the translation requires more words to feel natural, compress more aggressively.
- "body" must stay ≤ 12 words when present.
- Match the brand tone of the source (don't make it more formal, don't drop profanity if present, don't add marketing fluff).
- The CTA keyword on the final slide is a brand asset — keep it as-is, do NOT translate or transliterate.
- Output JSON only, no prose, no markdown fences, exactly: {"slides":[{...}, ...]} with the same number of slides as the input and the same "type" + "index" fields preserved.`;

  const userPrompt = [
    `Translate the following carousel from ${LANGUAGE_NAMES[script.outputLanguage] ?? script.outputLanguage} into ${targetName}.`,
    "",
    JSON.stringify({ slides: script.slides }, null, 2),
  ].join("\n");

  try {
    const { content } = await callGroq({
      apiKey: groqApiKey,
      model: GROQ_TEXT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      maxTokens: 1200,
      jsonMode: true,
    });

    const parsedContent = parseJsonObject(content);
    if (!parsedContent || !Array.isArray(parsedContent.slides)) {
      return jsonError(500, "AI returned malformed JSON");
    }

    const aiSlides = parsedContent.slides as unknown[];

    const translatedSlides: CarouselSlideScript[] = script.slides.map((original, i) => {
      const r = (aiSlides[i] ?? {}) as Record<string, unknown>;
      const headline = String(r.headline ?? original.headline).trim();
      const body = typeof r.body === "string" ? r.body.trim() : undefined;
      return {
        index: original.index,
        type: original.type,
        headline: headline.slice(0, 200) || original.headline,
        body: body ? body.slice(0, 200) : undefined,
      };
    });

    // If the final slide is a CTA, force the keyword back in verbatim —
    // the LLM is told not to translate it but a defensive pass here means
    // the brand asset can never silently get lost in translation.
    const last = translatedSlides[translatedSlides.length - 1];
    if (last && last.type === "cta") {
      const kw = script.ctaKeyword.toUpperCase();
      if (!last.headline.toUpperCase().includes(kw)) {
        last.headline = `${kw}`.slice(0, 200);
      }
    }

    const translated: CarouselScript = {
      ...script,
      slideCount: script.slideCount as 5 | 7 | 10 | 15,
      outputLanguage: targetLanguage as "en" | "fr" | "ar",
      slides: translatedSlides,
    };

    logger.info("Script translated", {
      workspaceId: session.workspaceId,
      uid: session.uid,
      from: script.outputLanguage,
      to: targetLanguage,
      slideCount: script.slideCount,
    });

    return jsonOk({ script: translated });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("Translate failed", {
      workspaceId: session.workspaceId,
      error: message,
    });
    return jsonError(500, message);
  }
}

function parseJsonObject(raw: string): Record<string, unknown> | null {
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
      /* try next */
    }
  }
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
