import "server-only";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/firebase/admin";
import { MissingServerSecretError, resolvers } from "@/lib/security/server-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const TEXT_MODEL = "llama-3.3-70b-versatile";

const MAX_PROMPT_LEN = 1200;
const MAX_EXTRA_LEN = 400;

interface CaptionRequest {
  tone: string;
  includeHashtags: boolean;
  useEmojis: boolean;
  extra?: string;
  /** Optional platform context — Twitter 280 vs LinkedIn 3000, etc. */
  platforms?: { id: string; name: string; charLimit: number }[];
  /** Optional image URL for vision analysis. */
  imageUrl?: string | null;
  /** Optional video title (e.g., filename minus extension) for text-only generation. */
  videoTitle?: string | null;
}

const TONE_HINT: Record<string, string> = {
  default: "engaging, balanced",
  friendly: "warm, conversational, first-person",
  funny: "witty, playful, light humor",
  bold: "punchy, confident, energetic",
  professional: "polished, authoritative",
  motivational: "uplifting, inspiring, action-oriented",
};

function buildSystemPrompt(): string {
  return [
    "You are a social-media copywriter for PostPlanify.",
    "Write captions that are ready to paste — no preamble, no quotes, no 'Here is your caption:'.",
    "Never start with 'I', never reference the prompt or image source.",
    "Use line breaks (\\n\\n) to separate paragraphs; do not return bullet lists unless the platform is short-form.",
    "Return ONLY the caption text.",
  ].join(" ");
}

function buildUserPrompt(body: CaptionRequest): string {
  const tone = TONE_HINT[body.tone] ?? TONE_HINT.default;
  const tags = body.includeHashtags ? "End with 3–6 relevant hashtags on their own line." : "Do NOT include hashtags.";
  const emo = body.useEmojis ? "Sprinkle 2–5 fitting emojis throughout the caption." : "Do NOT use emojis.";

  const platformHint = body.platforms && body.platforms.length > 0
    ? `Target platforms: ${body.platforms.map((p) => `${p.name} (≤${p.charLimit} chars)`).join(", ")}.`
    : "Target multiple social platforms; keep the caption under 2200 chars.";

  const extra = body.extra?.trim() ? `\nAdditional context from the user: ${body.extra.trim().slice(0, MAX_EXTRA_LEN)}` : "";

  if (body.imageUrl) {
    return [
      `Look at the attached image and write a social caption in a ${tone} tone.`,
      platformHint,
      tags,
      emo,
      extra,
      "Describe what you see first, then frame it for the target audience.",
    ].filter(Boolean).join("\n");
  }
  if (body.videoTitle) {
    return [
      `The user uploaded a video titled: "${body.videoTitle.trim().slice(0, 200)}".`,
      `Write a social caption in a ${tone} tone that teases what the video is about.`,
      platformHint,
      tags,
      emo,
      extra,
    ].filter(Boolean).join("\n");
  }
  // Text-only fallback (no media yet).
  return [
    `Write a social caption in a ${tone} tone.`,
    platformHint,
    tags,
    emo,
    extra,
  ].filter(Boolean).join("\n");
}

function clip(s: string | null | undefined, n: number): string | null {
  if (!s) return null;
  return s.length > n ? s.slice(0, n) : s;
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

  let body: CaptionRequest;
  try {
    body = (await request.json()) as CaptionRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const tone = typeof body.tone === "string" ? body.tone.slice(0, 32) : "default";
  const includeHashtags = !!body.includeHashtags;
  const useEmojis = !!body.useEmojis;
  const extra = clip(body.extra, MAX_EXTRA_LEN);
  // Base64 data URIs can be very large — don't clip them.
  const imageUrl = body.imageUrl?.startsWith("data:") ? body.imageUrl : clip(body.imageUrl, 1024);
  const videoTitle = clip(body.videoTitle, 200);
  const platforms = Array.isArray(body.platforms)
    ? body.platforms
        .slice(0, 12)
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
  const model = useVision ? VISION_MODEL : TEXT_MODEL;
  const userPrompt = buildUserPrompt({
    tone,
    includeHashtags,
    useEmojis,
    extra: extra ?? undefined,
    platforms,
    imageUrl,
    videoTitle,
  });
  const systemPrompt = buildSystemPrompt();

  const messages: { role: "system" | "user"; content: unknown }[] = [
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
    const groqRes = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.8,
        max_tokens: 600,
        top_p: 0.95,
        stream: false,
      }),
    });

    const data = (await groqRes.json().catch(() => ({}))) as {
      choices?: { message?: { content?: string } }[];
      error?: { message?: string };
    };

    if (!groqRes.ok) {
      const msg = data?.error?.message ?? `Groq API error ${groqRes.status}`;
      return NextResponse.json({ error: msg }, { status: groqRes.status >= 500 ? 502 : 400 });
    }

    const caption = data.choices?.[0]?.message?.content?.trim() ?? "";
    if (!caption) {
      return NextResponse.json({ error: "Empty caption from model" }, { status: 502 });
    }

    return NextResponse.json({ ok: true, caption, model });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Groq request failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}