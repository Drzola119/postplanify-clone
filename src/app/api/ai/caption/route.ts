import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/firebase/admin";
import { generateCaptionViaGateway } from "@/lib/ai/grok-gateway";
import { parseBody } from "@/lib/validation/helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const captionRequestSchema = z.object({
  tone: z.string().optional().default("default"),
  voice: z.string().nullable().optional(),
  template: z.string().nullable().optional(),
  includeHashtags: z.boolean().optional().default(false),
  useEmojis: z.boolean().optional().default(false),
  multiPlatform: z.boolean().optional().default(false),
  extra: z.string().optional(),
  platforms: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        charLimit: z.number(),
      })
    )
    .optional(),
  imageUrl: z.string().nullable().optional(),
  videoTitle: z.string().nullable().optional(),
});

function clip(s: string | null | undefined, n: number): string | null {
  if (!s) return null;
  return s.length > n ? s.slice(0, n) : s;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  const extra = clip(body.extra, 400);
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

  const result = await generateCaptionViaGateway({
    userId: user.uid,
    headers: request.headers,
    snapshot: {
      tone,
      voice: body.voice,
      template: body.template,
      includeHashtags,
      useEmojis,
      multiPlatform,
      extra: extra ?? undefined,
      imageUrl,
      videoTitle,
      platforms,
    },
  });

  if (!result.ok || !result.caption) {
    const status = result.error?.statusCode ?? (result.error?.code === "RATE_LIMITED" ? 429 : 502);
    return NextResponse.json(
      { error: result.error?.message ?? "Caption generation failed" },
      { status: status >= 400 && status < 600 ? status : 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    caption: result.caption,
    captionsByPlatform: result.captionsByPlatform ?? {},
    model: result.model,
    provider: result.provider,
    usage: result.usage,
  });
}
