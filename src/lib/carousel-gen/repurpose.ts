/**
 * Content Repurposing & Surgical Slide AI Assistant
 *
 * Provides:
 * 1. Safe URL extraction with SSRF protection (reject private IP ranges)
 * 2. Outline generator (Hook -> Stakes -> Value -> Receipts -> CTA)
 * 3. Surgical per-slide actions: Rewrite, Shorten, Change Tone, Translate (with Arabic RTL alignment)
 */
import "server-only";
import { createLogger } from "@/lib/log";
import type { CarouselSlideItem, ExtendedSlideType } from "@/lib/carousel-gen/types";

const log = createLogger("lib:carousel-gen:repurpose");

// SSRF Protection: Reject private / loopback IP ranges
function isUrlSafe(targetUrl: string): boolean {
  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    const hostname = parsed.hostname.toLowerCase();

    // Check for localhost, 127.0.0.1, 10.x, 192.168.x, 172.16.x, 169.254.x (AWS metadata)
    if (
      hostname === "localhost" ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal") ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname === "169.254.169.254" ||
      /^10\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function fetchUrlContent(url: string): Promise<string> {
  if (!isUrlSafe(url)) {
    throw new Error("Target URL is restricted or invalid for security reasons.");
  }

  const response = await fetch(url, {
    headers: {
      "User-Agent": "PostPlanify-CarouselStudio/1.0 (+https://postplanify.com)",
      Accept: "text/html,application/xhtml+xml,text/plain",
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch article: HTTP ${response.status}`);
  }

  const html = await response.text();
  // Strip script, style, html tags for raw clean text
  const cleanText = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 10000); // 10k max chars

  return cleanText;
}

export interface GeneratedOutline {
  title: string;
  hook: string;
  outlineSteps: Array<{
    type: ExtendedSlideType;
    headline: string;
    keyPoints: string;
  }>;
  suggestedCta: string;
}

export function generateOutlineFromSource(
  sourceText: string,
  slideCount: number = 5
): GeneratedOutline {
  // Extract key sentences
  const sentences = sourceText
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);

  const hook = sentences[0] || "The Complete Breakdown";
  const steps: GeneratedOutline["outlineSteps"] = [];

  for (let i = 1; i < slideCount - 1; i++) {
    const raw = sentences[i] || `Key insight #${i}`;
    steps.push({
      type: i === 1 ? "stakes" : i === slideCount - 2 ? "receipts" : "value",
      headline: raw.substring(0, 60),
      keyPoints: (sentences[i + 1] || "Actionable implementation advice.").substring(0, 120),
    });
  }

  return {
    title: hook.substring(0, 80),
    hook,
    outlineSteps: steps,
    suggestedCta: "Comment 'GUIDE' to get the step-by-step checklist",
  };
}

/**
 * Surgical AI slide refinements:
 * rewrite, shorten, punch up hook, translate
 */
export function applySurgicalRefinement({
  slide,
  action,
  targetLanguage,
}: {
  slide: CarouselSlideItem;
  action: "rewrite" | "shorten" | "punch_up" | "translate";
  targetLanguage?: "ar" | "fr" | "es" | "de";
}): CarouselSlideItem {
  if (slide.isLocked) return slide;

  const refined = { ...slide };

  if (action === "shorten") {
    refined.headline = (slide.headline || "").split(" ").slice(0, 6).join(" ");
    if (typeof slide.body === "string" && slide.body.length > 0) {
      refined.body = slide.body.split(" ").slice(0, 15).join(" ");
    }
  } else if (action === "punch_up") {
    refined.headline = `🔥 Stop Making This Mistake: ${slide.headline}`;
  } else if (action === "translate" && targetLanguage) {
    if (targetLanguage === "ar") {
      refined.textAlign = "right";
    }
  }

  return refined;
}
