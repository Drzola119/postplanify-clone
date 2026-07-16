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
