/**
 * carousel-gen/brand-analyzer.ts
 *
 * M3 Brand Analyzer v1 — server-side URL → CSS parse.
 *
 * Fetches a public URL, extracts brand signals from the raw HTML and
 * (one level deep) a linked stylesheet, then synthesises a "best guess"
 * brand analysis the wizard can pre-fill into a new CarouselStyle.
 *
 * Deliberately dep-free — no cheerio / jsdom. The codebase's existing
 * scrape.ts already follows this rule, and the inputs are untrusted
 * public HTML, so a small regex pipeline is safer than dragging in a
 * full parser.
 *
 * Real-world caveat: most modern marketing sites render their colours
 * via CSS-in-JS at hydration time, which means a static HTML fetch
 * can miss most of the actual styles. That's why this is "v1" — M4
 * layers a vision pass (screenshot → Groq vision) on top to fill
 * the gaps.
 */

import "server-only";
import { callGroq, extractJson, GROQ_VISION_MODEL } from "@/lib/ai/groq";
import { resolvers } from "@/lib/security/server-config";
import { createLogger } from "@/lib/log";

const log = createLogger("carousel-gen:brand-analyzer");

const MAX_HTML_BYTES = 1_000_000;
const MAX_CSS_BYTES_PER_FILE = 200_000;
const MAX_LINKED_CSS_FILES = 2;
const FETCH_TIMEOUT_MS = 8_000;

/**
 * What the analyzer returns. `confidence` is a 0-1 per-field guess for
 * how reliable the extraction was — the wizard shows a small badge so
 * the user knows which fields to hand-tweak.
 */
export interface BrandAnalysis {
  source: { url: string; fetchedBytes: number; cssFilesScanned: number };
  /** Primary brand colour (hex), if one was found. */
  primary?: string;
  /** Canvas / background colour (hex), if one was found. */
  background?: string;
  /** Accent colour (hex), if one was found. */
  accent?: string;
  /** First / display-font family name from CSS declarations. */
  displayFont?: string;
  /** Body / supporting font family name. */
  bodyFont?: string;
  /** 0-1 reliability per field. Low values should prompt a manual override. */
  confidence: {
    primary: number;
    background: number;
    accent: number;
    displayFont: number;
    bodyFont: number;
  };
  /** Optional human note for the UI ("Picked --primary from inline CSS"). */
  notes: string[];
}

export interface AnalyzeResult {
  ok: boolean;
  analysis?: BrandAnalysis;
  error?: string;
}

export async function analyzeBrand(url: string): Promise<AnalyzeResult> {
  return analyzeBrandFromUrl(url);
}

/**
 * M4 entry point when the user has uploaded a screenshot instead of
 * providing a URL. Sends the image straight to Groq vision. The
 * resulting palette often matches what the brand "actually looks
 * like" better than v1's HTML/CSS parse, which only sees the static
 * markup (most marketing sites paint their colours via JS).
 */
export async function analyzeBrandFromImage(
  imageDataUrl: string,
  headers: Headers
): Promise<AnalyzeResult> {
  const groqApiKey = resolvers.groqApiKey(headers);
  if (!groqApiKey) {
    return { ok: false, error: "GROQ_API_KEY not configured" };
  }

  const systemPrompt = `You are a brand analyst. Look at the screenshot of a website. Return strict JSON with these exact keys:
{
  "primary": "<#rrggbb hex of the most prominent brand colour>",
  "background": "<#rrggbb hex of the dominant background colour>",
  "accent": "<#rrggbb hex of any small but visible accent colour>",
  "displayFont": "<best guess of the display / headline font name>",
  "bodyFont": "<best guess of the body / paragraph font name>"
}
Return ONLY JSON, no prose outside. Use null for any colour you cannot determine with confidence.`;

  try {
    const res = await callGroq({
      apiKey: groqApiKey,
      model: GROQ_VISION_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: imageDataUrl },
            },
            {
              type: "text",
              text: "Return strict JSON as specified.",
            },
          ],
        },
      ],
      temperature: 0.2,
      maxTokens: 300,
      jsonMode: true,
    });
    const parsed = extractJson<{
      primary?: string;
      background?: string;
      accent?: string;
      displayFont?: string;
      bodyFont?: string;
    }>(res.content);
    if (!parsed) {
      return { ok: false, error: "Vision model returned no JSON" };
    }
    const norm = (v: unknown): string | undefined => {
      if (typeof v !== "string") return undefined;
      const trimmed = v.trim();
      if (!trimmed || trimmed === "null") return undefined;
      return normaliseColor(trimmed) ?? trimmed;
    };
    const analysis: BrandAnalysis = {
      source: {
        url: "(uploaded screenshot)",
        fetchedBytes: imageDataUrl.length,
        cssFilesScanned: 0,
      },
      primary: norm(parsed.primary),
      background: norm(parsed.background),
      accent: norm(parsed.accent),
      displayFont: parsed.displayFont || undefined,
      bodyFont: parsed.bodyFont || undefined,
      confidence: {
        // Vision analysis tends to be more reliable than HTML parse
        // for sites with JS-driven colour injection, but still
        // requires human verification.
        primary: parsed.primary ? 0.8 : 0,
        background: parsed.background ? 0.8 : 0,
        accent: parsed.accent ? 0.6 : 0,
        displayFont: parsed.displayFont ? 0.7 : 0,
        bodyFont: parsed.bodyFont ? 0.7 : 0,
      },
      notes: [
        "Palette read from an uploaded screenshot via Groq vision.",
        "Verify colours visually before saving.",
      ],
    };
    return { ok: true, analysis };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.warn("Vision analyze failed", { message });
    return { ok: false, error: message };
  }
}

async function analyzeBrandFromUrl(url: string): Promise<AnalyzeResult> {
  let normalized: URL;
  try {
    normalized = new URL(url);
  } catch {
    return { ok: false, error: "Invalid URL" };
  }
  if (normalized.protocol !== "http:" && normalized.protocol !== "https:") {
    return { ok: false, error: "URL must be http(s)" };
  }

  // 1. Fetch the page HTML (bounded bytes + timeout).
  const htmlResult = await fetchBounded(
    normalized.toString(),
    { Accept: "text/html,application/xhtml+xml" },
    MAX_HTML_BYTES
  );
  if (!htmlResult.ok || !htmlResult.body) {
    return {
      ok: false,
      error: htmlResult.error ?? "Could not fetch URL",
    };
  }
  const html = htmlResult.body;
  let totalBytes = htmlResult.bytes;

  // 2. Pick a small set of brand signals from inline content.
  const signals = extractSignalsFromHtml(html);

  // 3. Fetch up to MAX_LINKED_CSS_FILES stylesheets for additional signals.
  let cssFilesScanned = 0;
  for (const href of signals.cssHrefs.slice(0, MAX_LINKED_CSS_FILES)) {
    const cssUrl = absolutize(href, normalized);
    if (!cssUrl) continue;
    const cssRes = await fetchBounded(
      cssUrl,
      { Accept: "text/css,*/*;q=0.1" },
      MAX_CSS_BYTES_PER_FILE
    );
    if (!cssRes.ok || !cssRes.body) continue;
    totalBytes += cssRes.bytes;
    cssFilesScanned += 1;
    extractSignalsFromCss(cssRes.body, signals);
  }

  // 4. Synthesise the BrandAnalysis. Picks the best candidate per role.
  const analysis = synthesizeAnalysis(normalized.toString(), totalBytes, cssFilesScanned, signals);

  return { ok: true, analysis };
}

/** Extracted and accumulated brand signals — internal working shape. */
interface ExtractedSignals {
  /** All hex colours we saw as primary candidates. */
  primaryCandidates: string[];
  /** All background-context hex colours. */
  backgroundCandidates: string[];
  /** All distinct hex colours — used to pick an "accent" differentiator. */
  allHex: string[];
  /** Display-font candidates (typically from h1 / .display / hero class). */
  displayFontCandidates: string[];
  /** Body-font candidates. */
  bodyFontCandidates: string[];
  /** Up to MAX_LINKED_CSS_FILES hrefs to fetch for follow-up CSS extraction. */
  cssHrefs: string[];
}

function emptySignals(): ExtractedSignals {
  return {
    primaryCandidates: [],
    backgroundCandidates: [],
    allHex: [],
    displayFontCandidates: [],
    bodyFontCandidates: [],
    cssHrefs: [],
  };
}

function extractSignalsFromHtml(html: string): ExtractedSignals {
  const signals = emptySignals();

  // --- theme-color meta tag (browsers use this for the address bar tint).
  const themeColor = readMetaContent(html, "theme-color");
  if (themeColor) {
    const hex = normaliseColor(themeColor);
    if (hex) {
      signals.primaryCandidates.push(hex);
      signals.allHex.push(hex);
    }
  }

  const tileColor = readMetaContent(html, "msapplication-TileColor");
  if (tileColor) {
    const hex = normaliseColor(tileColor);
    if (hex) {
      signals.primaryCandidates.push(hex);
      signals.allHex.push(hex);
    }
  }

  // --- <body bgcolor="..."> fallback for legacy pages.
  const bodyBgMatch = /<body\b[^>]*\bbgcolor=["']?([^\s"'>]+)/i.exec(html);
  if (bodyBgMatch) {
    const hex = normaliseColor(bodyBgMatch[1]);
    if (hex) {
      signals.backgroundCandidates.push(hex);
      signals.allHex.push(hex);
    }
  }

  // --- Inline <style> blocks — pull custom properties + font-family lines.
  for (const css of iterInlineStyleBlocks(html)) {
    extractSignalsFromCss(css, signals);
  }

  // --- Linked stylesheets.
  const linkRe = /<link\b[^>]+rel=["']stylesheet["'][^>]*>/gi;
  let linkMatch: RegExpExecArray | null;
  while ((linkMatch = linkRe.exec(html)) !== null) {
    const href = readAttr(linkMatch[0], "href");
    if (href) signals.cssHrefs.push(href);
  }

  return signals;
}

function extractSignalsFromCss(css: string, signals: ExtractedSignals): void {
  // CSS custom properties: --primary: #... ;  --brand-color: rgb(...) ;
  // --color-primary: #abc;  etc.
  const cssVarRe = /--([a-zA-Z0-9_-]+)\s*:\s*([^;}{]+)/g;
  let m: RegExpExecArray | null;
  while ((m = cssVarRe.exec(css)) !== null) {
    const name = m[1].toLowerCase();
    const value = m[2].trim();
    const hex = normaliseColor(value);
    if (!hex) continue;
    signals.allHex.push(hex);
    if (
      /(^|[_-])(primary|brand|accent|theme|main|action)([_-]|$)/.test(name) &&
      !/background|bg/.test(name)
    ) {
      signals.primaryCandidates.push(hex);
    } else if (/background|^bg|canvas|surface/.test(name)) {
      signals.backgroundCandidates.push(hex);
    } else if (/accent|highlight|secondary/.test(name)) {
      signals.primaryCandidates.push(hex);
    }
  }

  // Hex colours used in raw values (not just custom properties).
  for (const hex of iterHexColors(css)) {
    signals.allHex.push(hex);
  }

  // font-family declarations — collect from selectors whose key is h1 /
  // .display / .hero first (display candidate) before falling back to
  // body / p (body candidate).
  for (const decl of iterFontFamilies(css)) {
    const selectorHint = decl.selector.toLowerCase();
    const family = decl.family;
    if (!family) continue;
    if (
      /\bh1\b|\.display|\.hero|\.heading|\.title|nav|button/.test(selectorHint)
    ) {
      signals.displayFontCandidates.push(family);
    } else if (/\bbody\b|\bp\b|\.body|\.text|main/.test(selectorHint)) {
      signals.bodyFontCandidates.push(family);
    } else {
      signals.bodyFontCandidates.push(family);
    }
  }
}

function synthesizeAnalysis(
  url: string,
  fetchedBytes: number,
  cssFilesScanned: number,
  signals: ExtractedSignals
): BrandAnalysis {
  const notes: string[] = [];

  // --- Primary: prefer a value with a "primary/brand" CSS var, else
  //     fall back to theme-color, else fall back to the most common
  //     non-near-black non-near-white hex.
  let primary: string | undefined;
  let primaryConfidence = 0;
  if (signals.primaryCandidates.length > 0) {
    primary = mostCommon(signals.primaryCandidates);
    primaryConfidence = 0.8;
    notes.push(`Picked primary from ${signals.primaryCandidates.length} CSS variable(s)`);
  } else {
    const hexes = signals.allHex.filter(notNearGrayscale);
    if (hexes.length > 0) {
      primary = mostCommon(hexes);
      primaryConfidence = 0.4;
      notes.push(
        "No primary CSS variable found — fell back to most common non-grayscale hex."
      );
    }
  }

  // --- Background: prefer explicit --bg* vars, else fall back to the
  //     lightest hex we saw (canvas is usually light).
  let background: string | undefined;
  let backgroundConfidence = 0;
  if (signals.backgroundCandidates.length > 0) {
    background = mostCommon(signals.backgroundCandidates);
    backgroundConfidence = 0.7;
    notes.push("Picked background from CSS variables");
  } else {
    const light = pickLightest(signals.allHex);
    if (light && isNearWhite(light)) {
      background = light;
      backgroundConfidence = 0.5;
      notes.push(
        "No explicit background — picked the lightest hex (assumed canvas)."
      );
    } else {
      background = "#fafafa";
      backgroundConfidence = 0.2;
      notes.push("Defaulted background to near-white.");
    }
  }

  // --- Accent: any hex distinct from primary and background.
  let accent: string | undefined;
  let accentConfidence = 0;
  for (const hex of signals.allHex) {
    if (hex === primary || hex === background) continue;
    if (notNearGrayscale(hex)) {
      accent = hex;
      accentConfidence = 0.4;
      notes.push("Picked first non-grayscale hex not used as primary/background.");
      break;
    }
  }
  if (!accent) {
    accent = "#f59e0b";
    accentConfidence = 0.1;
    notes.push("Defaulted accent to amber-500 — no candidate found.");
  }

  const displayFont = pickFirst(signals.displayFontCandidates);
  const bodyFont = pickFirst(signals.bodyFontCandidates);

  return {
    source: { url, fetchedBytes, cssFilesScanned },
    primary,
    background,
    accent,
    displayFont,
    bodyFont,
    confidence: {
      primary: round1(primaryConfidence),
      background: round1(backgroundConfidence),
      accent: round1(accentConfidence),
      displayFont: displayFont ? 0.6 : 0,
      bodyFont: bodyFont ? 0.6 : 0,
    },
    notes,
  };
}

/** Safe meta-tag content reader. Handles content-before-name and name-before-content orderings. */
function readMetaContent(html: string, name: string): string | undefined {
  const re = new RegExp(
    `<meta\\b[^>]*?name=["']${name}["'][^>]*?content=["']([^"']+)["']`,
    "i"
  );
  const m = html.match(re);
  if (m) return m[1];
  const reAlt = new RegExp(
    `<meta\\b[^>]*?content=["']([^"']+)["'][^>]*?name=["']${name}["']`,
    "i"
  );
  const alt = html.match(reAlt);
  return alt ? alt[1] : undefined;
}

function readAttr(tag: string, attr: string): string | undefined {
  const re = new RegExp(`${attr}\\s*=\\s*["']([^"']+)["']`, "i");
  const m = tag.match(re);
  return m ? m[1] : undefined;
}

function* iterInlineStyleBlocks(html: string): IterableIterator<string> {
  const re = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    yield m[1];
  }
}

function* iterHexColors(css: string): IterableIterator<string> {
  const re = /#([0-9a-f]{3}|[0-9a-f]{6})\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css)) !== null) {
    yield normaliseColor("#" + m[1]) ?? "";
  }
}

interface FontDecl {
  selector: string;
  family: string;
}

function* iterFontFamilies(css: string): IterableIterator<FontDecl> {
  // Matches CSS rule blocks: "selector { ... font-family: ...; ... }"
  const blockRe = /([^{}]+)\{([^{}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = blockRe.exec(css)) !== null) {
    const selector = m[1].trim();
    const body = m[2];
    const ffMatch = /font-family\s*:\s*([^;}]+)/i.exec(body);
    if (!ffMatch) continue;
    const family = pickFirstFontFamily(ffMatch[1]);
    if (!family) continue;
    yield { selector, family };
  }
}

function pickFirstFontFamily(value: string): string | undefined {
  // Split on commas, take the first family, strip quotes.
  const parts = value.split(",").map((p) => p.trim());
  const first = parts[0];
  if (!first) return undefined;
  const cleaned = first.replace(/^["']|["']$/g, "").trim();
  if (
    !cleaned ||
    cleaned === "inherit" ||
    cleaned === "initial" ||
    cleaned === "unset" ||
    cleaned === "sans-serif" ||
    cleaned === "serif" ||
    cleaned === "monospace" ||
    cleaned === "system-ui"
  ) {
    return undefined;
  }
  return cleaned;
}

/**
 * Reduce a CSS colour value to a #rrggbb hex. Returns null if the value
 * is a gradient, currentColor, transparent, etc.
 *
 * Supported inputs:
 *   - #rgb / #rrggbb       → expand and return
 *   - rgb(r, g, b)         → return as hex
 *   - rgba(r, g, b, a)     → accept if a > 0, else null
 *   - hsl(h, s%, l%)       → convert to hex
 *   - colour keywords ("red", "blue", …)  → small built-in table
 *
 * No `var(--foo)` expansion — those are caught in the custom-properties
 * pass at the start of extractSignalsFromCss().
 */
export function normaliseColor(value: string): string | undefined {
  const v = value.trim().toLowerCase();
  if (!v) return undefined;
  if (v === "transparent" || v === "inherit" || v === "currentcolor" || v === "initial") {
    return undefined;
  }

  // Hex
  if (v.startsWith("#")) {
    const hex = v.slice(1);
    if (hex.length === 3) {
      return `#${hex.split("").map((c) => c + c).join("")}`;
    }
    if (hex.length === 6 && /^[0-9a-f]+$/.test(hex)) {
      return `#${hex}`;
    }
    return undefined;
  }

  // rgb / rgba
  const rgbMatch = /^rgba?\s*\(\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*[, ]\s*([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(
    v
  );
  if (rgbMatch) {
    const alpha = rgbMatch[4] !== undefined ? parseAlpha(rgbMatch[4]) : 1;
    if (alpha <= 0) return undefined;
    return rgbToHex(
      Number(rgbMatch[1]),
      Number(rgbMatch[2]),
      Number(rgbMatch[3])
    );
  }

  // hsl / hsla
  const hslMatch = /^hsla?\s*\(\s*([\d.]+)(?:deg)?\s*[, ]\s*([\d.]+)%\s*[, ]\s*([\d.]+)%/.exec(
    v
  );
  if (hslMatch) {
    const h = parseFloat(hslMatch[1]);
    const s = parseFloat(hslMatch[2]) / 100;
    const l = parseFloat(hslMatch[3]) / 100;
    return hslToHex(h, s, l);
  }

  // Named colour keyword (tiny built-in table — covers CSS basic ones).
  const named = NAMED_COLOURS[v];
  if (named) return named;

  return undefined;
}

function parseAlpha(s: string): number {
  if (s.endsWith("%")) return parseFloat(s) / 100;
  return parseFloat(s);
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

function hslToHex(h: number, s: number, l: number): string {
  const hn = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hn / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (hn < 60) {
    r = c;
    g = x;
  } else if (hn < 120) {
    r = x;
    g = c;
  } else if (hn < 180) {
    g = c;
    b = x;
  } else if (hn < 240) {
    g = x;
    b = c;
  } else if (hn < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  return rgbToHex(
    (r + m) * 255,
    (g + m) * 255,
    (b + m) * 255
  );
}

/** Tiny CSS basic-colour table. Only the unambiguous ones we want. */
const NAMED_COLOURS: Record<string, string> = {
  black: "#000000",
  white: "#ffffff",
  red: "#ff0000",
  lime: "#00ff00",
  blue: "#0000ff",
  yellow: "#ffff00",
  cyan: "#00ffff",
  magenta: "#ff00ff",
  silver: "#c0c0c0",
  gray: "#808080",
  grey: "#808080",
  maroon: "#800000",
  olive: "#808000",
  green: "#008000",
  teal: "#008080",
  navy: "#000080",
  purple: "#800080",
  orange: "#ffa500",
  pink: "#ffc0cb",
};

function mostCommon(list: string[]): string | undefined {
  if (list.length === 0) return undefined;
  const counts = new Map<string, number>();
  for (const v of list) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best: string | undefined;
  let bestCount = 0;
  for (const [v, c] of counts) {
    if (c > bestCount) {
      best = v;
      bestCount = c;
    }
  }
  return best;
}

function pickFirst(list: string[]): string | undefined {
  return list[0];
}

function pickLightest(list: string[]): string | undefined {
  let best: string | undefined;
  let bestL = -1;
  for (const hex of list) {
    const l = luminance(hex);
    if (l > bestL) {
      bestL = l;
      best = hex;
    }
  }
  return best;
}

function notNearGrayscale(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  const max = Math.max(rgb.r, rgb.g, rgb.b);
  const min = Math.min(rgb.r, rgb.g, rgb.b);
  return max - min > 24;
}

function isNearWhite(hex: string): boolean {
  return luminance(hex) >= 0.85;
}

function luminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return (
    0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b)
  );
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.replace(/^#/, "");
  if (cleaned.length !== 3 && cleaned.length !== 6) return null;
  const full =
    cleaned.length === 3 ? cleaned.split("").map((c) => c + c).join("") : cleaned;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return null;
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Resolve a possibly-relative href against a base URL. */
function absolutize(href: string, base: URL): string | undefined {
  try {
    return new URL(href, base).toString();
  } catch {
    return undefined;
  }
}

interface FetchBoundedResult {
  ok: boolean;
  body?: string;
  bytes: number;
  error?: string;
}

/** Fetch with capped bytes + timeout. Mirrors the ads-wizard scraper. */
async function fetchBounded(
  url: string,
  headers: Record<string, string>,
  maxBytes: number
): Promise<FetchBoundedResult> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (PostPlanify Carousel Brand Analyzer)",
        ...headers,
      },
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "fetch failed";
    log.warn("analyzeBrand fetch failed", { url, message });
    return { ok: false, bytes: 0, error: message };
  }

  if (!res.ok) {
    return { ok: false, bytes: 0, error: `HTTP ${res.status}` };
  }

  const reader = res.body?.getReader();
  if (!reader) return { ok: false, bytes: 0, error: "No body" };
  const chunks: Uint8Array[] = [];
  let received = 0;
  try {
    while (received < maxBytes) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      received += value.byteLength;
      chunks.push(value);
    }
  } finally {
    try {
      await reader.cancel();
    } catch {
      /* ignore */
    }
  }
  const buf = Buffer.concat(chunks.map((c) => Buffer.from(c)));
  return { ok: true, bytes: received, body: buf.toString("utf8") };
}
