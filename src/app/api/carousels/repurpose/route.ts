import "server-only";
import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { fetchUrlContent, generateOutlineFromSource } from "@/lib/carousel-gen/repurpose";
import { jsonError, jsonOk, parseBody } from "@/lib/validation/helpers";
import { z } from "zod";

const repurposeSchema = z.object({
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
      parsed.error?.issues
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

    const outline = generateOutlineFromSource(sourceContent, slideCount);
    return jsonOk({ outline });
  } catch (error) {
    return jsonError(500, error instanceof Error ? error.message : "Repurpose failed");
  }
}
