import "server-only";
import { createLogger } from "@/lib/log";

const log = createLogger("image-gen/scrape");

const MAX_BYTES = 2_000_000;
const MAX_CHARS = 30_000;

/**
 * Server-side fetch + plain-text extraction for the offer-ads wizard's
 * "Paste your landing page URL" flow. Mirrors the browser-driver
 * `scrape_page_text()` helper but runs server-side — no headless browser
 * needed because we strip script/style/svg from the raw HTML and pull
 * visible text only.
 *
 * Returns the cleaned text plus a small set of meta facts that the UI
 * can surface ("truncated", "fetched N chars from <title>").
 */
export interface ScrapeResult {
  ok: boolean;
  text: string;
  title?: string;
  description?: string;
  fetchedBytes: number;
  fetchedChars: number;
  truncated: boolean;
  error?: string;
}

export async function scrapeOfferSource(url: string): Promise<ScrapeResult> {
  let normalized: URL;
  try {
    normalized = new URL(url);
  } catch {
    return { ok: false, text: "", fetchedBytes: 0, fetchedChars: 0, truncated: false, error: "Invalid URL" };
  }
  if (normalized.protocol !== "http:" && normalized.protocol !== "https:") {
    return { ok: false, text: "", fetchedBytes: 0, fetchedChars: 0, truncated: false, error: "URL must be http(s)" };
  }

  let res: Response;
  try {
    res = await fetch(normalized.toString(), {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (PostPlanify Infographic Scraper)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "fetch failed";
    log.warn("scrapeOfferSource fetch failed", { url: normalized.toString(), message });
    return { ok: false, text: "", fetchedBytes: 0, fetchedChars: 0, truncated: false, error: message };
  }

  if (!res.ok) {
    return { ok: false, text: "", fetchedBytes: 0, fetchedChars: 0, truncated: false, error: `HTTP ${res.status}` };
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
    return { ok: false, text: "", fetchedBytes: 0, fetchedChars: 0, truncated: false, error: `Unsupported content-type: ${contentType}` };
  }

  // Cap downloaded bytes to keep memory + latency bounded.
  const reader = res.body?.getReader();
  if (!reader) {
    return { ok: false, text: "", fetchedBytes: 0, fetchedChars: 0, truncated: false, error: "No body" };
  }
  const chunks: Uint8Array[] = [];
  let received = 0;
  let truncated = false;
  while (received < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    received += value.byteLength;
    chunks.push(value);
    if (received >= MAX_BYTES) truncated = true;
  }
  try {
    await reader.cancel();
  } catch {
    /* ignore */
  }

  const buf = Buffer.concat(chunks.map((c) => Buffer.from(c)));
  const html = buf.toString("utf8");

  const title = extractMetaContent(html, "title") ?? extractTag(html, "title");
  const description =
    extractMetaContent(html, "description") ?? extractMetaProperty(html, "og:description");

  const text = htmlToPlainText(html);

  // Trim to MAX_CHARS for the prompt.
  const finalText = text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) : text;
  const finalTruncated = truncated || text.length > MAX_CHARS;

  return {
    ok: true,
    text: finalText,
    title: title?.slice(0, 200),
    description: description?.slice(0, 400),
    fetchedBytes: received,
    fetchedChars: finalText.length,
    truncated: finalTruncated,
  };
}

/**
 * Lightweight HTML→text extractor. Strips script / style / svg / noscript,
 * drops tags, decodes a few common entities, and collapses whitespace.
 *
 * Deliberately not using a full HTML parser — we want a small dep-free
 * implementation that's safe to run on untrusted URLs. Pages with
 * heavily client-rendered content will produce a thin extraction; the
 * user can always fall back to manual paste in that case.
 */
export function htmlToPlainText(html: string): string {
  let s = html;
  // Drop script / style / svg / noscript / template content entirely.
  s = s.replace(/<script\b[\s\S]*?<\/script>/gi, " ");
  s = s.replace(/<style\b[\s\S]*?<\/style>/gi, " ");
  s = s.replace(/<svg\b[\s\S]*?<\/svg>/gi, " ");
  s = s.replace(/<noscript\b[\s\S]*?<\/noscript>/gi, " ");
  s = s.replace(/<template\b[\s\S]*?<\/template>/gi, " ");

  // Drop comments.
  s = s.replace(/<!--[\s\S]*?-->/g, " ");

  // Convert block-level closers and <br> into newlines so structure survives.
  s = s.replace(/<\/(p|div|li|h[1-6]|tr|section|article|header|footer|nav)>/gi, "\n");
  s = s.replace(/<br\s*\/?>(?!\n)/gi, "\n");

  // Strip remaining tags.
  s = s.replace(/<[^>]+>/g, " ");

  // Decode a handful of common entities.
  s = s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => {
      const code = Number(n);
      if (!Number.isFinite(code)) return " ";
      try {
        return String.fromCodePoint(code);
      } catch {
        return " ";
      }
    });

  // Collapse whitespace runs but preserve single newlines.
  s = s.replace(/[ \t\f\v]+/g, " ");
  s = s.replace(/[ \t]*\n[ \t]*/g, "\n");
  s = s.replace(/\n{3,}/g, "\n\n");
  return s.trim();
}

function extractMetaContent(html: string, name: string): string | undefined {
  const re = new RegExp(
    `<meta[^>]+name=["']${escapeReg(name)}["'][^>]*content=["']([^"']+)["']`,
    "i"
  );
  const m = html.match(re);
  if (m) return decodeAttr(m[1]);
  const reAlt = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]*name=["']${escapeReg(name)}["']`,
    "i"
  );
  const mAlt = html.match(reAlt);
  return mAlt ? decodeAttr(mAlt[1]) : undefined;
}

function extractMetaProperty(html: string, property: string): string | undefined {
  const re = new RegExp(
    `<meta[^>]+property=["']${escapeReg(property)}["'][^>]*content=["']([^"']+)["']`,
    "i"
  );
  const m = html.match(re);
  if (m) return decodeAttr(m[1]);
  const reAlt = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]*property=["']${escapeReg(property)}["']`,
    "i"
  );
  const mAlt = html.match(reAlt);
  return mAlt ? decodeAttr(mAlt[1]) : undefined;
}

function extractTag(html: string, tag: string): string | undefined {
  const re = new RegExp(`<${escapeReg(tag)}[^>]*>([\\s\\S]*?)<\\/${escapeReg(tag)}>`, "i");
  const m = html.match(re);
  return m ? decodeAttr(m[1]) : undefined;
}

function decodeAttr(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function escapeReg(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}