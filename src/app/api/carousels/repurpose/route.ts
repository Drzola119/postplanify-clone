import "server-only";
import { NextRequest } from "next/server";
import { requireCarouselAccess as requireSession } from "@/lib/carousel-gen/access";
import { fetchUrlContent } from "@/lib/carousel-gen/repurpose";
import { jsonError, jsonOk, parseBody } from "@/lib/validation/helpers";
import { z } from "zod";
import { carouselAi } from "@/lib/carousel-gen/ai-actions";
import { resolvers } from "@/lib/security/server-config";

const repurposeSchema = z.object({
  language: z.enum(["en", "fr", "ar"]).default("en"),
  audience: z.string().max(200).optional(),
  tone: z.string().max(100).optional(),
  sourceType: z.enum(["url", "text"]),
  url: z.string().url().max(2048).optional(),
  text: z.string().max(30000).optional(),
  slideCount: z.number().int().min(3).max(15).optional().default(5),
});

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const parsed = await parseBody(request, repurposeSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(
      parsed.error?.status ?? 400,
      parsed.error?.message ?? "Invalid payload",
      parsed.error?.issues,
    );
  }

  const { sourceType, url, text, slideCount } = parsed.data;

  try {
    let sourceContent = text || "";
    if (sourceType === "url" && url) {
      sourceContent = await fetchUrlContent(url);
    }

    if (!sourceContent.trim()) {
      return jsonError(400, "No content extracted from source");
    }

    const outline = await carouselAi(
      session.workspaceId,
      resolvers.groqApiKey(request.headers) || "",
      `Create an editable carousel outline with the requested slide count and language. Keep headlines concise. Return {"title":"...","hook":"...","outlineSteps":[{"type":"value","headline":"...","keyPoints":"..."}],"suggestedCta":"...","caption":"..."}. outlineSteps are the middle slides (count minus two); hook and CTA are separate.`,
      { ...parsed.data, text: sourceContent },
      z.object({
        title: z.string().max(200),
        hook: z.string().max(300),
        outlineSteps: z
          .array(
            z.object({
              type: z.enum([
                "value",
                "stakes",
                "receipts",
                "step",
                "quote",
                "comparison",
                "checklist",
                "stats",
              ]),
              headline: z.string().max(300),
              keyPoints: z.string().max(1000),
            }),
          )
          .length((slideCount ?? 5) - 2),
        suggestedCta: z.string().max(300),
        caption: z.string().max(3000),
      }),
    );
    return jsonOk({ outline });
  } catch (error) {
    return jsonError(
      500,
      error instanceof Error ? error.message : "Repurpose failed",
    );
  }
}
