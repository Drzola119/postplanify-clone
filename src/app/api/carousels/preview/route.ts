/**
 * POST /api/carousels/preview
 *
 * Stage 0 of the Carousel Studio pipeline — generates the 5-slide script
 * via Groq and returns it to the wizard for review. NO state written,
 * NO images generated yet. The user must read the script, edit any line,
 * and POST to /api/carousels to actually start generation.
 *
 * This is the "copy first" discipline from spec §5 — important here
 * because each slide costs real money to generate, not nothing.
 */
import "server-only";
import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { resolvers } from "@/lib/security/server-config";
import { generateCarouselScript } from "@/lib/carousel-gen/script-gen";
import { carouselPreviewRequestSchema } from "@/lib/validation/carousel-gen";
import { jsonError, jsonOk, parseBody } from "@/lib/validation/helpers";
import { createLogger } from "@/lib/log";

const logger = createLogger("api:carousels:preview");

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const parsed = await parseBody(request, carouselPreviewRequestSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(
      parsed.error?.status ?? 400,
      parsed.error?.message ?? "Invalid payload",
      parsed.error?.issues
    );
  }

  const groqApiKey = resolvers.groqApiKey(request.headers);
  if (!groqApiKey) {
    return jsonError(
      503,
      "Script generation is not configured (GROQ_API_KEY missing server-side)."
    );
  }

  try {
    const { script } = await generateCarouselScript(
      {
        topic: parsed.data.topic,
        niche: parsed.data.niche,
        tone: parsed.data.tone,
        ctaKeyword: parsed.data.ctaKeyword,
        outputLanguage: parsed.data.outputLanguage ?? "en",
      },
      groqApiKey
    );

    logger.info("Carousel preview generated", {
      workspaceId: session.workspaceId,
      uid: session.uid,
      topic: parsed.data.topic,
    });

    return jsonOk({ script });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("Carousel preview failed", {
      workspaceId: session.workspaceId,
      error: message,
    });
    return jsonError(500, message);
  }
}
