import "server-only";
import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { scrapeOfferSource } from "@/lib/image-gen/scrape";
import { jsonError, jsonOk } from "@/lib/validation/helpers";

/**
 * GET /api/infographics/scrape?url=...
 *
 * Server-side fetch + plain-text extraction for the Ads wizard's
 * "Paste your landing page URL" flow. The wizard never fetches
 * third-party URLs from the browser — it goes through here so we can
 * cap bytes / chars, surface fetch errors uniformly, and never proxy
 * raw HTML back to the client (we only return the cleaned text).
 */
/*
 * LANGUAGE CONTRACT — READ BEFORE MODIFYING THIS FILE
 *
 * outputLanguage controls what language the AI renders ON-IMAGE TEXT in.
 * It does NOT affect how scraped content is processed.
 *
 * Scraped offer text (product name, benefits, CTA copy, etc.) is passed
 * to the prompt builder AS-IS, in whatever language the source page uses.
 * This text is never translated, never modified, and never filtered based
 * on outputLanguage.
 *
 * The [LANGUAGE_DIRECTIVE] token in the prompt tells the AI model what
 * language to use for the TEXT IT GENERATES inside the infographic image.
 * Scraped input text ≠ text to be translated. Do not conflate these.
 */

export async function GET(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const url = request.nextUrl.searchParams.get("url") ?? "";
  if (!url) return jsonError(400, "Missing url");

  const result = await scrapeOfferSource(url);
  if (!result.ok) {
    return jsonError(502, result.error ?? "Scrape failed");
  }
  return jsonOk({
    text: result.text,
    title: result.title ?? null,
    description: result.description ?? null,
    fetchedBytes: result.fetchedBytes,
    fetchedChars: result.fetchedChars,
    truncated: result.truncated,
  });
}
