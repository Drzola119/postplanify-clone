/**
 * Provider-comparison test for the AI Infographic Generator.
 *
 * Calls each of the four providers behind the `generateInfographic`
 * router with three representative aspect ratios ("1:1", "9:16", "16:9")
 * across all four providers, so we can eyeball which engine best fits
 * the use case at each ratio and confirm pricing assumptions. Also
 * runs an Ads-flow end-to-end against a real URL.
 *
 * Usage:
 *   OPENROUTER_API_KEY=sk-or-… \
 *   OPENAI_API_KEY=sk-…        \
 *   IDEOGRAM_API_KEY=…         \
 *   npx tsx scripts/test-image-gen.ts
 *
 * The prompt template below mirrors the production prompt-builder shape
 * (see src/lib/image-gen/prompt-builder.ts → buildInfographicPrompt).
 * We duplicate it inline so the test stays runnable as a standalone
 * Node script without depending on the project's `server-only` modules.
 *
 * Outputs:
 *   ./test-output/provider-comparison/{provider}-{ratio}.png
 *   ./test-output/provider-comparison/{provider}-{ratio}.meta.json
 *   ./test-output/ads/{slug}.png
 *   ./test-output/ads/{slug}.meta.json
 */

import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const TOPIC = "growth mindset tips for first-time managers";
const STYLE_DIRECTIVE =
  "Lay out the topic as a horizontal pathway of 5 to 7 signposted stops, " +
  "each stop a milestone the viewer is moving toward; use a single accent " +
  "colour for the path and keep every stop card visually identical so the " +
  "progression reads at a glance.";
const STYLE_TITLE = "Pathway map";
const ADS_URL = process.env.TEST_ADS_URL ?? "https://postplanify.com";
const ADS_STYLE_DIRECTIVE =
  "Frame the offer as a single hero card: a bold headline that names the " +
  "outcome, three supporting rows that name what's included, and a single " +
  "footer trigger. Keep all body lines short and high-contrast.";
const ADS_STYLE_TITLE = "Offer at-a-glance";
const OUT_DIR = resolve(process.cwd(), "test-output");

type ProviderId = "gemini-flash-lite-image" | "gpt-image-2" | "ideogram-4" | "gemini-flash-image";
type AspectRatio = "1:1" | "9:16" | "16:9";

interface AttemptResult {
  provider: ProviderId;
  ratio: AspectRatio;
  ok: boolean;
  bytes?: number;
  mime?: string;
  durationMs?: number;
  costUsd?: number;
  model?: string;
  width?: number;
  height?: number;
  error?: string;
  status?: number;
  promptChars: number;
  bodySnippet?: string;
}

async function outDir(...parts: string[]): Promise<string> {
  const dir = resolve(OUT_DIR, ...parts);
  await mkdir(dir, { recursive: true });
  return dir;
}

function buildPrompt(): string {
  return [
    "Render one finished social-media infographic image. Not an outline, not a strategy document, not a text-only plan — the image itself, in one pass.",
    "",
    `Topic:        ${TOPIC}`,
    "Offer title:  (not applicable — keyword-driven infographic)",
    "Offer copy:   (not applicable — keyword-driven infographic)",
    "Color scheme: light",
    "",
    "Visual concept (use this as the structural metaphor / layout):",
    STYLE_DIRECTIVE,
    "",
    "Hard rules:",
    "- Output exactly one finished image at the requested aspect ratio.",
    "- Use a hook-first layout: a bold top headline, a clear middle that realises the visual concept above, and a bottom save/share trigger.",
    "- Keep every body line short and high-contrast; never write paragraphs.",
    "- Use one consistent type system, palette, and icon style across the whole image — no mixed styles, no decorative scenery.",
    "- Do not include any URL, watermark, or footer mark.",
    "- Do not include any logo unless explicitly provided.",
    "- Do not include any person, face, photograph, or stock-style scene.",
    "- Commit to one strong design — do not output multiple options.",
  ].join("\n");
}

function buildAdsPrompt(offerTitle: string, offerCopy: string): string {
  return [
    "Render one finished social-media infographic image. Not an outline, not a strategy document, not a text-only plan — the image itself, in one pass.",
    "",
    `Topic:        ${offerTitle}`,
    `Offer title:  ${offerTitle}`,
    `Offer copy:   ${offerCopy}`,
    "Color scheme: light",
    "",
    "Visual concept (use this as the structural metaphor / layout):",
    ADS_STYLE_DIRECTIVE,
    "",
    "Hard rules:",
    "- Output exactly one finished image at the requested aspect ratio.",
    "- Use a hook-first layout: a bold top headline, a clear middle that realises the visual concept above, and a bottom save/share trigger.",
    "- Keep every body line short and high-contrast; never write paragraphs.",
    "- Use one consistent type system, palette, and icon style across the whole image — no mixed styles, no decorative scenery.",
    "- Render Tap to claim — link in bio as a subtle, centred footer mark — readable but not distracting.",
    "- Do not include any logo unless explicitly provided.",
    "- Do not include any person, face, photograph, or stock-style scene.",
    "- Commit to one strong design — do not output multiple options.",
  ].join("\n");
}

/** Compute pixel dimensions for a ratio at a given long-edge cap. */
function aspectDimensions(ratio: AspectRatio, maxEdge: number): { width: number; height: number } {
  const [w, h] = ratio.split(":").map(Number);
  if (w >= h) {
    const width = maxEdge;
    const height = Math.max(16, Math.round((maxEdge * h) / w / 16) * 16);
    return { width, height };
  }
  const height = maxEdge;
  const width = Math.max(16, Math.round((maxEdge * w) / h / 16) * 16);
  return { width, height };
}

/** Convert ratio → OpenAI `WxH` size at 1K (1024 long edge). */
function openAiSize(ratio: AspectRatio): string {
  const { width, height } = aspectDimensions(ratio, 1024);
  return `${width}x${height}`;
}

/** Convert ratio → Ideogram v3 `WxH` ratio string. */
function ideogramRatio(ratio: AspectRatio): string {
  return ratio.replace(":", "x");
}

// ── Gemini via OpenRouter ─────────────────────────────────────────────────────
async function runGeminiFlashLite(apiKey: string, prompt: string, ratio: AspectRatio): Promise<{ result: AttemptResult; bytes?: Buffer }> {
  const dims = aspectDimensions(ratio, 1024);
  const t0 = Date.now();
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://postplanify.com",
      "X-Title": "PostPlanify Infographic Test",
    },
    body: JSON.stringify({
      model: "google/gemini-3.1-flash-lite-image",
      messages: [{ role: "user", content: [{ type: "text", text: prompt }] }],
      modalities: ["image", "text"],
      image_config: { aspect_ratio: ratio, image_size: "1K" },
      max_tokens: 2500,
      provider: { order: ["google"] },
    }),
    signal: AbortSignal.timeout(120_000),
  });
  const body = await res.text();
  const json: any = body.length > 0 ? safeJson(body) : null;
  if (!res.ok) {
    return { result: { provider: "gemini-flash-lite-image", ratio, ok: false, error: json?.error?.message ?? `HTTP ${res.status}`, status: res.status, promptChars: prompt.length } };
  }
  const imageUrl = extractFirstImageUrl(json?.choices?.[0]?.message);
  if (!imageUrl) {
    return { result: { provider: "gemini-flash-lite-image", ratio, ok: false, error: "No image in response", status: 502, promptChars: prompt.length, bodySnippet: body.slice(0, 1500) } };
  }
  const fetched = await fetchBytes(imageUrl);
  const usage = json?.usage ?? {};
  const cost = ((usage.prompt_tokens ?? 0) / 1_000_000) * 0.25
    + ((usage.completion_tokens ?? 0) / 1_000_000) * 1.5;
  return {
    bytes: fetched.bytes,
    result: {
      provider: "gemini-flash-lite-image",
      ratio,
      ok: true,
      bytes: fetched.bytes.length,
      mime: fetched.mime,
      durationMs: Date.now() - t0,
      costUsd: round4(cost),
      model: "google/gemini-3.1-flash-lite-image",
      width: dims.width,
      height: dims.height,
      promptChars: prompt.length,
    },
  };
}

async function runGeminiFlash(apiKey: string, prompt: string, ratio: AspectRatio): Promise<{ result: AttemptResult; bytes?: Buffer }> {
  const dims = aspectDimensions(ratio, 1024);
  const t0 = Date.now();
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://postplanify.com",
      "X-Title": "PostPlanify Infographic Test",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [{ role: "user", content: [{ type: "text", text: prompt }] }],
      modalities: ["image", "text"],
      image_config: { aspect_ratio: ratio, image_size: "1K" },
      max_tokens: 2500,
      provider: { order: ["google"] },
    }),
    signal: AbortSignal.timeout(120_000),
  });
  const body = await res.text();
  const json: any = body.length > 0 ? safeJson(body) : null;
  if (!res.ok) {
    return { result: { provider: "gemini-flash-image", ratio, ok: false, error: json?.error?.message ?? `HTTP ${res.status}`, status: res.status, promptChars: prompt.length, bodySnippet: body.slice(0, 500) } };
  }
  const imageUrl = extractFirstImageUrl(json?.choices?.[0]?.message);
  if (!imageUrl) {
    return { result: { provider: "gemini-flash-image", ratio, ok: false, error: "No image in response", status: 502, promptChars: prompt.length, bodySnippet: body.slice(0, 1500) } };
  }
  const fetched = await fetchBytes(imageUrl);
  const usage = json?.usage ?? {};
  const cost = ((usage.prompt_tokens ?? 0) / 1_000_000) * 0.3
    + ((usage.completion_tokens ?? 0) / 1_000_000) * 2.5;
  return {
    bytes: fetched.bytes,
    result: {
      provider: "gemini-flash-image",
      ratio,
      ok: true,
      bytes: fetched.bytes.length,
      mime: fetched.mime,
      durationMs: Date.now() - t0,
      costUsd: round4(cost),
      model: "google/gemini-2.5-flash-image",
      width: dims.width,
      height: dims.height,
      promptChars: prompt.length,
    },
  };
}

// ── GPT Image 2 ──────────────────────────────────────────────────────────────
async function runGptImage2(apiKey: string, prompt: string, ratio: AspectRatio): Promise<{ result: AttemptResult; bytes?: Buffer }> {
  const dims = aspectDimensions(ratio, 1024);
  const t0 = Date.now();
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-image-2",
      prompt,
      size: openAiSize(ratio),
      quality: "low",
      n: 1,
      response_format: "b64_json",
    }),
    signal: AbortSignal.timeout(120_000),
  });
  const body = await res.text();
  const json: any = body.length > 0 ? safeJson(body) : null;
  if (!res.ok) {
    return { result: { provider: "gpt-image-2", ratio, ok: false, error: json?.error?.message ?? `HTTP ${res.status}`, status: res.status, promptChars: prompt.length } };
  }
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) {
    return { result: { provider: "gpt-image-2", ratio, ok: false, error: "No b64_json in response", status: 502, promptChars: prompt.length } };
  }
  const bytes = Buffer.from(b64, "base64");
  return {
    bytes,
    result: {
      provider: "gpt-image-2",
      ratio,
      ok: true,
      bytes: bytes.length,
      mime: "image/png",
      durationMs: Date.now() - t0,
      costUsd: 0.04,
      model: "gpt-image-2",
      width: dims.width,
      height: dims.height,
      promptChars: prompt.length,
    },
  };
}

// ── Ideogram 4 ──────────────────────────────────────────────────────────────
async function runIdeogram4(apiKey: string, prompt: string, ratio: AspectRatio): Promise<{ result: AttemptResult; bytes?: Buffer }> {
  const dims = aspectDimensions(ratio, 2048);
  const t0 = Date.now();
  const res = await fetch("https://api.ideogram.ai/v1/ideogram-v3/generate", {
    method: "POST",
    headers: { "Api-Key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "ideogram-v3",
      prompt,
      style_type: "DESIGN",
      aspect_ratio: ideogramRatio(ratio),
      magic_prompt_option: "AUTO",
      num_images: 1,
    }),
    signal: AbortSignal.timeout(120_000),
  });
  const body = await res.text();
  const json: any = body.length > 0 ? safeJson(body) : null;
  if (!res.ok) {
    return { result: { provider: "ideogram-4", ratio, ok: false, error: JSON.stringify(json?.error ?? json ?? null).slice(0, 300), status: res.status, promptChars: prompt.length } };
  }
  const imageUrl: string | undefined = json?.data?.[0]?.url;
  if (!imageUrl) {
    return { result: { provider: "ideogram-4", ratio, ok: false, error: "No image url in response", status: 502, promptChars: prompt.length } };
  }
  const fetched = await fetchBytes(imageUrl);
  return {
    bytes: fetched.bytes,
    result: {
      provider: "ideogram-4",
      ratio,
      ok: true,
      bytes: fetched.bytes.length,
      mime: fetched.mime,
      durationMs: Date.now() - t0,
      costUsd: 0.08,
      model: "ideogram-v3",
      width: dims.width,
      height: dims.height,
      promptChars: prompt.length,
    },
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function extractImageUrl(content: unknown): string | null {
  if (!content) return null;
  if (typeof content === "string") {
    const m = content.match(/!\[[^\]]*\]\((https?:[^)]+|data:image[^)]+)\)/);
    return m ? m[1] : null;
  }
  if (Array.isArray(content)) {
    for (const part of content) {
      const url = (part as { image_url?: { url?: string } }).image_url?.url;
      if (url && (url.startsWith("http") || url.startsWith("data:image"))) return url;
    }
  }
  return null;
}

/** Walk both `images[]` and `content[]` for an image URL. */
function extractFirstImageUrl(message: any): string | null {
  if (!message) return null;
  const fromImages = extractImageUrl(message.images);
  if (fromImages) return fromImages;
  return extractImageUrl(message.content);
}

async function fetchBytes(url: string): Promise<{ bytes: Buffer; mime: string }> {
  const r = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!r.ok) throw new Error(`Failed to fetch image: ${r.status}`);
  const ab = await r.arrayBuffer();
  const buf = Buffer.from(ab);
  let mime = "image/png";
  if (buf[0] === 0xff && buf[1] === 0xd8) mime = "image/jpeg";
  else if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") mime = "image/webp";
  return { bytes: buf, mime };
}

function safeJson(s: string): any {
  try { return JSON.parse(s); } catch { return null; }
}

function round4(n: number): number { return Math.round(n * 10_000) / 10_000; }

async function saveAttempt(dir: string, name: string, result: AttemptResult, imageBytes?: Buffer): Promise<void> {
  if (imageBytes) {
    const ext = result.mime === "image/jpeg" ? "jpg" : result.mime === "image/webp" ? "webp" : "png";
    await writeFile(resolve(dir, `${name}.${ext}`), imageBytes);
  }
  await writeFile(resolve(dir, `${name}.meta.json`), JSON.stringify(result, null, 2));
}

async function scrapeAdsUrl(url: string): Promise<{ title: string; copy: string }> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (PostPlanify Test Scraper)", Accept: "text/html,application/xhtml+xml" },
    redirect: "follow",
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`Scrape HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const html = buf.toString("utf8").slice(0, 200_000);
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? decodeEntities(titleMatch[1]) : url;
  const text = htmlToPlainText(html).slice(0, 8_000);
  return { title, copy: text };
}

function decodeEntities(s: string): string {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").trim();
}

function htmlToPlainText(html: string): string {
  let s = html;
  s = s.replace(/<script\b[\s\S]*?<\/script>/gi, " ");
  s = s.replace(/<style\b[\s\S]*?<\/style>/gi, " ");
  s = s.replace(/<svg\b[\s\S]*?<\/svg>/gi, " ");
  s = s.replace(/<noscript\b[\s\S]*?<\/noscript>/gi, " ");
  s = s.replace(/<!--[\s\S]*?-->/g, " ");
  s = s.replace(/<\/(p|div|li|h[1-6]|tr|section|article|header|footer|nav)>/gi, "\n");
  s = s.replace(/<br\s*\/?>(?!\n)/gi, "\n");
  s = s.replace(/<[^>]+>/g, " ");
  s = s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  s = s.replace(/[ \t\f\v]+/g, " ");
  s = s.replace(/[ \t]*\n[ \t]*/g, "\n");
  s = s.replace(/\n{3,}/g, "\n\n");
  return s.trim();
}

function logResult(r: AttemptResult, prefix = ""): void {
  if (r.ok) {
    console.log(`[${prefix || `${r.provider}/${r.ratio}`}] OK · ${r.width}×${r.height} · $${r.costUsd?.toFixed(4)} · ${(r.durationMs! / 1000).toFixed(1)}s · ${r.bytes}B`);
  } else {
    console.log(`[${prefix || `${r.provider}/${r.ratio}`}] FAIL · ${r.status ?? "?"} · ${r.error}`);
  }
}

// ── Driver ───────────────────────────────────────────────────────────────────
async function main() {
  console.log("─".repeat(72));
  console.log("AI Infographic Generator — provider-comparison test");
  console.log("Topic:", TOPIC);
  console.log("Style:", STYLE_TITLE, "(roadmap)");
  console.log("Ratios: 1:1, 9:16, 16:9 (square, story, landscape)");
  console.log("Ads URL:", ADS_URL);
  console.log("─".repeat(72));

  const cmpDir = await outDir("provider-comparison");
  const adsDir = await outDir("ads");

  const prompt = buildPrompt();
  console.log("\nPrompt built:", prompt.length, "chars (instant / roadmap).");

  const orKey = process.env.OPENROUTER_API_KEY;
  const oaKey = process.env.OPENAI_API_KEY;
  const igKey = process.env.IDEOGRAM_API_KEY;

  const ratios: AspectRatio[] = ["1:1", "9:16", "16:9"];
  type Task = {
    id: ProviderId;
    ratio: AspectRatio;
    needs: string;
    key?: string;
    run: (k: string, p: string, r: AspectRatio) => Promise<{ result: AttemptResult; bytes?: Buffer }>;
  };

  const tasks: Task[] = [];
  for (const ratio of ratios) {
    tasks.push({ id: "gemini-flash-lite-image", ratio, needs: "OPENROUTER_API_KEY", key: orKey, run: runGeminiFlashLite });
    tasks.push({ id: "gemini-flash-image",      ratio, needs: "OPENROUTER_API_KEY", key: orKey, run: runGeminiFlash });
    tasks.push({ id: "gpt-image-2",             ratio, needs: "OPENAI_API_KEY",     key: oaKey, run: runGptImage2 });
    tasks.push({ id: "ideogram-4",              ratio, needs: "IDEOGRAM_API_KEY",   key: igKey, run: runIdeogram4 });
  }

  console.log("\nRunning provider comparison in parallel...");
  type RunOutput = { result: AttemptResult; bytes?: Buffer };
  const settled = await Promise.allSettled<RunOutput>(
    tasks.map((t): Promise<RunOutput> => {
      if (!t.key) {
        return Promise.resolve({
          result: {
            provider: t.id,
            ratio: t.ratio,
            ok: false,
            error: `Missing env var ${t.needs}`,
            status: 0,
            promptChars: prompt.length,
          },
        });
      }
      return t.run(t.key, prompt, t.ratio);
    })
  );

  const results: Array<RunOutput> = [];
  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i];
    const r = settled[i];
    const out: RunOutput = r.status === "fulfilled"
      ? r.value
      : {
          result: {
            provider: t.id,
            ratio: t.ratio,
            ok: false,
            error: r.reason instanceof Error ? r.reason.message : String(r.reason),
            status: 0,
            promptChars: prompt.length,
          },
        };
    results.push(out);
    await saveAttempt(cmpDir, `${t.id}-${t.ratio}`, out.result, out.bytes);
    logResult(out.result);
  }

  // Ads flow (uses 3:4 default — the closest valid Gemini ratio to our old
  // 4:5 default and matches the dominant social-feed ad placement).
  console.log("\nRunning Ads flow end-to-end against", ADS_URL);
  let adsOut: RunOutput = {
    result: { provider: "gemini-flash-lite-image", ratio: "1:1", ok: false, error: "not run", status: 0, promptChars: 0 },
  };
  try {
    const { title, copy } = await scrapeAdsUrl(ADS_URL);
    const adsPrompt = buildAdsPrompt(title || "Our offer", copy);
    console.log("Ads prompt built:", adsPrompt.length, "chars from", title);
    if (!orKey) throw new Error("OPENROUTER_API_KEY required for Ads flow");
    adsOut = await runGeminiFlashLite(orKey, adsPrompt, "1:1");
  } catch (err) {
    adsOut = {
      result: {
        provider: "gemini-flash-lite-image",
        ratio: "1:1",
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        status: 0,
        promptChars: 0,
      },
    };
  }
  const slug = ADS_URL.replace(/^https?:\/\//, "").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  await saveAttempt(adsDir, slug, adsOut.result, adsOut.bytes);
  logResult(adsOut.result, "Ads");

  console.log("\n" + "─".repeat(72));
  console.log("SUMMARY");
  console.log("─".repeat(72));
  for (const r of results) {
    const ratio = r.result.ratio ?? "?";
    console.log(
      `${(r.result.provider + "/" + ratio).padEnd(36)}`,
      r.result.ok ? "OK  " : "FAIL",
      r.result.ok ? `$${(r.result.costUsd ?? 0).toFixed(4)}` : "",
      r.result.ok ? `${(r.result.durationMs! / 1000).toFixed(1)}s` : "",
      r.result.ok ? `${r.result.width}×${r.result.height}` : "",
      !r.result.ok ? (r.result.status ?? "?").toString() : "",
      !r.result.ok ? r.result.error ?? "" : "",
    );
  }
  console.log("Ads (gemini-flash-lite-image/1:1)".padEnd(36),
    adsOut.result.ok ? "OK  " : "FAIL",
    adsOut.result.ok ? `$${(adsOut.result.costUsd ?? 0).toFixed(4)}` : "",
    adsOut.result.ok ? `${(adsOut.result.durationMs! / 1000).toFixed(1)}s` : "",
    adsOut.result.ok ? `${adsOut.result.width}×${adsOut.result.height}` : "",
    !adsOut.result.ok ? adsOut.result.error : "",
  );
  console.log("─".repeat(72));

  const anyFailed = results.some((r) => !r.result.ok) || !adsOut.result.ok;
  process.exit(anyFailed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
