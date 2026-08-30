import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/firebase/admin";
import { MissingServerSecretError, resolvers } from "@/lib/security/server-config";
import { buildCaptionPrompt } from "@/lib/ai/caption-templates";
import { callGroq, GroqError, GroqMessage, GroqResult, GROQ_VISION_MODEL, GROQ_TEXT_MODEL, GROQ_FALLBACK_TEXT_MODEL, GROQ_FALLBACK_VISION_MODEL } from "@/lib/ai/groq";
import { parseBody } from "@/lib/validation/helpers";
import { fitCaptionForPlatform } from "@/lib/ai/caption-fit";
import type { PlatformId } from "@/lib/platforms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PROMPT_LEN = 1200;
const MAX_EXTRA_LEN = 400;

const captionRequestSchema = z.object({
  tone: z.string().optional().default("default"),
  voice: z.string().nullable().optional(),
  template: z.string().nullable().optional(),
  includeHashtags: z.boolean().optional().default(false),
  useEmojis: z.boolean().optional().default(false),
  multiPlatform: z.boolean().optional().default(false),
  extra: z.string().optional(),
  platforms: z.array(z.object({
    id: z.string(),
    name: z.string(),
    charLimit: z.number(),
  })).optional(),
  imageUrl: z.string().nullable().optional(),
  videoTitle: z.string().nullable().optional(),
});

interface CaptionRequest {
  tone: string;
  /** Optional voice override — narrows the tone to a brand voice (lifestyle, b2b, founder, …). */
  voice?: string | null;
  /** Optional caption template structure (hook-insight-cta, pas, listicle, story, standard). */
  template?: string | null;
  includeHashtags: boolean;
  useEmojis: boolean;
  multiPlatform?: boolean;
  extra?: string;
  /** Optional platform context — Twitter 280 vs LinkedIn 3000, etc. */
  platforms?: { id: string; name: string; charLimit: number }[];
  /** Optional image URL for vision analysis. */
  imageUrl?: string | null;
  /** Optional video title (e.g., filename minus extension) for text-only generation. */
  videoTitle?: string | null;
}

function buildSystemPrompt(multiPlatform?: boolean): string {
  if (multiPlatform) {
    return [
      "You are an expert social-media copywriter for PostPlanify.",
      "Write platform-tailored social copy.",
      "Return ONLY a valid JSON object matching the requested schema without code fences, no extra text.",
    ].join(" ");
  }
  return [
    "You are a social-media copywriter for PostPlanify.",
    "Write captions that are ready to paste — no preamble, no quotes, no 'Here is your caption:'.",
    "Never start with 'I', never reference the prompt or image source.",
    "Use line breaks (\\n\\n) to separate paragraphs; do not return bullet lists unless the platform is short-form.",
    "Return ONLY the caption text.",
  ].join(" ");
}

function buildUserPrompt(body: CaptionRequest): string {
  const { userPrompt } = buildCaptionPrompt({
    tone: body.tone,
    voice: body.voice ?? null,
    template: body.template ?? null,
    includeHashtags: body.includeHashtags,
    useEmojis: body.useEmojis,
    multiPlatform: body.multiPlatform,
    extra: body.extra ?? null,
    platforms: body.platforms,
    hasMedia: !!body.imageUrl || !!body.videoTitle,
  });

  if (body.imageUrl) {
    return [
      `Look at the attached image.`,
      userPrompt,
    ].join("\n\n");
  }
  if (body.videoTitle) {
    return [
      `The user uploaded a video titled: "${body.videoTitle.trim().slice(0, 200)}".`,
      userPrompt,
    ].join("\n\n");
  }
  // Text-only fallback (no media yet).
  return userPrompt;
}

function clip(s: string | null | undefined, n: number): string | null {
  if (!s) return null;
  return s.length > n ? s.slice(0, n) : s;
}

function cleanJsonString(str: string): string {
  let cleaned = str.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/```$/, "");
  }
  return cleaned.trim();
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let apiKey: string;
  try {
    apiKey = resolvers.groqApiKey(request.headers);
  } catch (err) {
    if (err instanceof MissingServerSecretError) {
      return NextResponse.json(
        { error: `${err.secret} is not configured on the server` },
        { status: 500 }
      );
    }
    throw err;
  }

  const parsed = await parseBody(request, captionRequestSchema);
  if (!parsed.ok || !parsed.data) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const body = parsed.data;

  const tone = typeof body.tone === "string" ? body.tone.slice(0, 32) : "default";
  const includeHashtags = !!body.includeHashtags;
  const useEmojis = !!body.useEmojis;
  const multiPlatform = !!body.multiPlatform;
  const extra = clip(body.extra, MAX_EXTRA_LEN);
  // Base64 data URIs can be very large — don't clip them.
  const imageUrl = body.imageUrl?.startsWith("data:") ? body.imageUrl : clip(body.imageUrl, 1024);
  const videoTitle = clip(body.videoTitle, 200);
  const platforms = Array.isArray(body.platforms)
    ? body.platforms
        .slice(0, 13)
        .map((p) => ({
          id: String(p?.id ?? "").slice(0, 32),
          name: String(p?.name ?? "").slice(0, 64),
          charLimit: Math.max(50, Math.min(70000, Number(p?.charLimit) || 2200)),
        }))
        .filter((p) => p.id && p.name)
    : undefined;

  if (!imageUrl && !videoTitle) {
    return NextResponse.json(
      { error: "Provide either imageUrl or videoTitle so the model has context." },
      { status: 400 }
    );
  }

  const useVision = !!imageUrl;
  const model = useVision ? GROQ_VISION_MODEL : GROQ_TEXT_MODEL;
  const userPrompt = buildUserPrompt({
    tone,
    includeHashtags,
    useEmojis,
    multiPlatform,
    extra: extra ?? undefined,
    platforms,
    imageUrl,
    videoTitle,
  });
  const systemPrompt = buildSystemPrompt(multiPlatform);

  const messages: GroqMessage[] = [
    { role: "system", content: systemPrompt },
  ];

  if (useVision) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: userPrompt.slice(0, MAX_PROMPT_LEN) },
        { type: "image_url", image_url: { url: imageUrl! } },
      ],
    });
  } else {
    messages.push({ role: "user", content: userPrompt.slice(0, MAX_PROMPT_LEN) });
  }

  try {
    let result: GroqResult;
    try {
      result = await callGroq({
        apiKey,
        model,
        messages,
        temperature: 0.8,
        maxTokens: multiPlatform ? 1000 : 600,
        topP: 0.95,
      });
    } catch (primaryErr) {
      if (useVision) {
        // Vision failed — fall back to text model without saying "Look at image"
        const filenameHint = (() => {
          try {
            if (imageUrl?.startsWith("data:")) return null;
            const u = new URL(imageUrl!);
            const last = u.pathname.split("/").pop() ?? "";
            return last.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").slice(0, 80) || null;
          } catch {
            return (imageUrl ?? "").split("/").pop()?.replace(/\.[^.]+$/, "").slice(0, 80) ?? null;
          }
        })();
        const fallbackPrompt = [
          filenameHint ? `The user uploaded an image related to: "${filenameHint}".` : "The user uploaded an image.",
          buildCaptionPrompt({
            tone,
            voice: body.voice ?? null,
            template: body.template ?? null,
            includeHashtags,
            useEmojis,
            multiPlatform,
            extra: extra ?? null,
            platforms,
            hasMedia: !!filenameHint,
          }).userPrompt,
        ].join("\n\n");
        const textMessages: GroqMessage[] = [
          { role: "system", content: systemPrompt },
          { role: "user", content: fallbackPrompt.slice(0, MAX_PROMPT_LEN) },
        ];
        result = await callGroq({
          apiKey,
          model: GROQ_TEXT_MODEL,
          messages: textMessages,
          temperature: 0.8,
          maxTokens: multiPlatform ? 1000 : 600,
          topP: 0.95,
        });
      } else {
        throw primaryErr;
      }
    }

    const rawContent = result.content.trim();
    if (!rawContent) {
      return NextResponse.json({ error: "Empty caption from model" }, { status: 502 });
    }

    if (multiPlatform) {
      try {
        const cleaned = cleanJsonString(rawContent);
        const parsedJson = JSON.parse(cleaned) as {
          base?: string;
          short?: string;
          visual?: string;
          professional?: string;
        };

        const base = parsedJson.base?.trim() || parsedJson.visual?.trim() || parsedJson.short?.trim() || rawContent;
        const short = parsedJson.short?.trim() || base;
        const visual = parsedJson.visual?.trim() || base;
        const professional = parsedJson.professional?.trim() || base;

        const captionsByPlatform: Record<string, string> = {};
        const targetList = platforms && platforms.length > 0
          ? platforms
          : [
              { id: "twitter", name: "X", charLimit: 280 },
              { id: "bluesky", name: "Bluesky", charLimit: 300 },
              { id: "threads", name: "Threads", charLimit: 500 },
              { id: "instagram", name: "Instagram", charLimit: 2200 },
              { id: "tiktok", name: "TikTok", charLimit: 2200 },
              { id: "pinterest", name: "Pinterest", charLimit: 500 },
              { id: "linkedin", name: "LinkedIn", charLimit: 3000 },
              { id: "facebook", name: "Facebook", charLimit: 63206 },
            ];

        for (const p of targetList) {
          const pid = p.id as PlatformId;
          let candidate = base;
          if (pid === "twitter" || pid === "bluesky" || pid === "threads") {
            candidate = short;
          } else if (pid === "instagram" || pid === "tiktok" || pid === "pinterest") {
            candidate = visual;
          } else if (pid === "linkedin" || pid === "facebook" || pid === "youtube" || pid === "reddit" || pid === "google_business" || pid === "discord" || pid === "telegram") {
            candidate = professional;
          }
          captionsByPlatform[pid] = fitCaptionForPlatform(candidate, pid);
        }

        return NextResponse.json({
          ok: true,
          caption: base,
          captionsByPlatform,
          model: result.model,
        });
      } catch {
        // Fallback if model returned plain text despite schema request
        const base = rawContent;
        const captionsByPlatform: Record<string, string> = {};
        if (platforms) {
          for (const p of platforms) {
            captionsByPlatform[p.id] = fitCaptionForPlatform(base, p.id as PlatformId);
          }
        }
        return NextResponse.json({
          ok: true,
          caption: base,
          captionsByPlatform,
          model: result.model,
        });
      }
    }

    // Single mode
    const caption = rawContent;
    const captionsByPlatform: Record<string, string> = {};
    if (platforms) {
      for (const p of platforms) {
        captionsByPlatform[p.id] = fitCaptionForPlatform(caption, p.id as PlatformId);
      }
    }

    return NextResponse.json({
      ok: true,
      caption,
      captionsByPlatform,
      model: result.model,
    });
  } catch (err) {
    if (err instanceof GroqError) {
      return NextResponse.json({ error: err.message }, { status: err.status >= 500 ? 502 : 400 });
    }
    const msg = err instanceof Error ? err.message : "Groq request failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
