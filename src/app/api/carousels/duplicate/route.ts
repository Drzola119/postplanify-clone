/**
 * POST /api/carousels/duplicate
 *
 * Duplicates an existing carousel into an isolated independent draft,
 * or forks it into an A/B Variant B deck.
 */
import "server-only";
import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { duplicateCarouselDocument } from "@/lib/carousel-gen/document-service";
import { jsonError, jsonOk, parseBody } from "@/lib/validation/helpers";
import { createLogger } from "@/lib/log";
import { z } from "zod";

const logger = createLogger("api:carousels:duplicate");

const duplicateSchema = z.object({
  carouselId: z.string().min(1).max(64),
  titleSuffix: z.string().max(50).optional().default("(Copy)"),
  asVariantB: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const parsed = await parseBody(request, duplicateSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(
      parsed.error?.status ?? 400,
      parsed.error?.message ?? "Invalid payload",
      parsed.error?.issues
    );
  }

  const { carouselId, titleSuffix, asVariantB } = parsed.data;

  try {
    const duplicated = await duplicateCarouselDocument({
      workspaceId: session.workspaceId,
      carouselId,
      uid: session.uid,
      titleSuffix,
      asVariantB,
    });

    logger.info("Carousel duplicated successfully", {
      workspaceId: session.workspaceId,
      sourceId: carouselId,
      newId: duplicated.id,
      asVariantB,
    });

    return jsonOk({
      success: true,
      carousel: duplicated,
    });
  } catch (error) {
    logger.error("Failed to duplicate carousel", { error, carouselId });
    return jsonError(500, "Failed to duplicate carousel");
  }
}
