/**
 * POST /api/carousels/brand-analyze
 *
 * M3 Brand Analyzer v1 endpoint. Fetches a public URL, parses its HTML
 * (and one level of linked CSS) for brand colour + font signals, and
 * returns a suggested CarouselStyle the wizard can pre-populate.
 *
 * This is a pure analysis endpoint — no state is written. The wizard
 * either saves the suggestion locally (M2's picker) or modifies it
 * before saving.
 */
import "server-only";
import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { analyzeBrand, analyzeBrandFromImage } from "@/lib/carousel-gen/brand-analyzer";
import { DEFAULT_CAROUSEL_STYLE } from "@/lib/carousel-gen/styles";
import { validatePaletteContrast } from "@/lib/carousel-gen/prompt-builder";
import type { CarouselStyle } from "@/lib/carousel-gen/types";
import { carouselBrandAnalyzeRequestSchema } from "@/lib/validation/carousel-gen";
import { jsonError, jsonOk, parseBody } from "@/lib/validation/helpers";
import { createLogger } from "@/lib/log";

const logger = createLogger("api:carousels:brand-analyze");

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const parsed = await parseBody(request, carouselBrandAnalyzeRequestSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(
      parsed.error?.status ?? 400,
      parsed.error?.message ?? "Invalid payload",
      parsed.error?.issues
    );
  }

  const result = parsed.data.imageDataUrl
    ? await analyzeBrandFromImage(parsed.data.imageDataUrl, request.headers)
    : parsed.data.url
      ? await analyzeBrand(parsed.data.url)
      : { ok: false as const, error: "Missing input" };
  if (!result.ok || !result.analysis) {
    logger.warn("Brand analyze failed", {
      workspaceId: session.workspaceId,
      input: parsed.data.imageDataUrl ? "image" : "url",
      error: result.error,
    });
    return jsonError(502, result.error ?? "Could not analyze input");
  }

  // Surface WCAG contrast issues from the candidate palette before the
  // user commits. We still return the (possibly imperfect) suggestion
  // so the wizard can show *why* it warned.
  const suggestedStyle: CarouselStyle = {
    ...DEFAULT_CAROUSEL_STYLE,
    id: "brand-analyzed",
    label: "Brand-analyzed style",
    colors: {
      primary: result.analysis.primary ?? DEFAULT_CAROUSEL_STYLE.colors.primary,
      background: result.analysis.background ?? DEFAULT_CAROUSEL_STYLE.colors.background,
      accent: result.analysis.accent ?? DEFAULT_CAROUSEL_STYLE.colors.accent,
    },
    fonts: {
      display: result.analysis.displayFont ?? DEFAULT_CAROUSEL_STYLE.fonts.display,
      body: result.analysis.bodyFont ?? DEFAULT_CAROUSEL_STYLE.fonts.body,
    },
    source: "brand-analyzed",
  };
  const warnings = validatePaletteContrast(suggestedStyle);

  logger.info("Brand analyzed", {
    workspaceId: session.workspaceId,
    url: parsed.data.url,
    cssFilesScanned: result.analysis.source.cssFilesScanned,
    hasPrimary: Boolean(result.analysis.primary),
    hasBackground: Boolean(result.analysis.background),
    hasAccent: Boolean(result.analysis.accent),
    hasDisplayFont: Boolean(result.analysis.displayFont),
    hasBodyFont: Boolean(result.analysis.bodyFont),
  });

  return jsonOk({
    analysis: result.analysis,
    suggestedStyle,
    warnings,
  });
}
