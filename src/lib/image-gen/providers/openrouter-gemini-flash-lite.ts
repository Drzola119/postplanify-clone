import "server-only";
import type { ImageGenProvider } from "./base";
import type {
  GenerateInput,
  GenerateOutput,
  ProviderError,
  ProviderId,
} from "../types";
import { getAspectRatio, PROVIDER_PRICING } from "../types";
import {
  aspectRatioToGemini,
  enforceResolutionCap,
  platformApiKey,
  MAX_OUTPUT_TOKENS_IMAGE,
} from "../resolution";

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemini-3.1-flash-lite-image";

interface OpenRouterChatResponse {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
      /** Gemini-style alternative: image returned as `message.images[]`. */
      images?: Array<{ type?: string; image_url?: { url?: string } }>;
    };
  }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  error?: { message?: string; code?: number };
}

/**
 * Gemini 3.1 Flash Lite Image via OpenRouter — our default engine.
 *
 * Pricing: $0.25/1M input tokens, $1.50/1M output tokens (~$0.002/image).
 * Supports 14 aspect ratios at 1K output.
 */
export class GeminiFlashLiteImageProvider implements ImageGenProvider {
  readonly id: ProviderId = "gemini-flash-lite-image";
  readonly displayName = "Gemini 3.1 Flash Lite Image (OpenRouter)";
  readonly requiresStructuredPrompt = false;

  constructor() {
    if (!platformApiKey(this.id)) {
      throw new Error("Gemini Flash Lite Image provider requires an OpenRouter API key");
    }
  }

  async generate(input: GenerateInput): Promise<GenerateOutput> {
    enforceResolutionCap(this.id, input.aspectRatio);
    const ratio = getAspectRatio(input.aspectRatio);
    const body = {
      model: MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: input.prompt },
          ],
        },
      ],
      modalities: ["image", "text"],
      // 1024px long edge (1K). The cap is enforced centrally by
      // enforceResolutionCap() — if a caller asks for 2K we never reach
      // this point.
      image_config: {
        // Gemini's image_config accepts the "W:H" string verbatim. Our
        // AspectRatio type uses the same form, so this is a passthrough.
        aspect_ratio: aspectRatioToGemini(input.aspectRatio),
        image_size: "1K",
      },
      // Token ceiling — Gemini burns ~1,290 output tokens per 1024×1024
      // image. 2500 leaves headroom for any aspect ratio we ship without
      // ever paying for a 2K-class render.
      max_tokens: MAX_OUTPUT_TOKENS_IMAGE,
      // OpenRouter passes through to Gemini's native image config; this is
      // a passthrough field that Gemini recognises.
      provider: { order: ["google"] },
    };

    const start = Date.now();
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${platformApiKey(this.id)}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://postplanify.com",
        "X-Title": "PostPlanify Infographic Generator",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
      cache: "no-store",
    });

    const text = await res.text();
    let parsed: OpenRouterChatResponse | null = null;
    try {
      parsed = text.length > 0 ? (JSON.parse(text) as OpenRouterChatResponse) : null;
    } catch {
      /* non-JSON body */
    }

    if (!res.ok) {
      const message = parsed?.error?.message ?? `OpenRouter ${res.status}`;
      throw makeProviderError(this.id, res.status, message, parsed);
    }

    const choice = parsed?.choices?.[0];
    const message = choice?.message;
    // Accept both Gemini response shapes:
    //   - `message.images[].image_url.url` (newer Gemini-style)
    //   - `message.content[]` part with `image_url.url` (older / fallback)
    const imageUrl = extractImageUrl(message?.images) ?? extractImageUrl(message?.content);
    if (!imageUrl) {
      throw makeProviderError(this.id, 502, "No image returned by Gemini Flash Lite", parsed);
    }

    const imageBytes = await fetchAsBuffer(imageUrl);
    const usage = parsed?.usage ?? {};
    const costUsd = ((usage.prompt_tokens ?? 0) / 1_000_000) * PROVIDER_PRICING[this.id].inputPerMTokens
      + ((usage.completion_tokens ?? 0) / 1_000_000) * PROVIDER_PRICING[this.id].outputPerMTokens;

    return {
      imageBytes,
      mime: sniffMime(imageBytes),
      costUsd: round4(costUsd),
      provider: this.id,
      model: MODEL,
      durationMs: Date.now() - start,
      assetUrl: imageUrl,
      assetId: "",
      width: ratio.width,
      height: ratio.height,
    };
  }
}

function extractImageUrl(content: unknown): string | null {
  if (!content) return null;
  if (typeof content === "string") {
    // Some Gemini responses inline the image as a data URL in a markdown image.
    const m = content.match(/!\[[^\]]*\]\((https?:[^)]+|data:image[^)]+)\)/);
    return m ? m[1] : null;
  }
  if (Array.isArray(content)) {
    for (const part of content) {
      const url = (part as { image_url?: { url?: string } }).image_url?.url;
      if (url && url.startsWith("http")) return url;
      if (url && url.startsWith("data:image")) return url;
    }
  }
  return null;
}

async function fetchAsBuffer(url: string): Promise<Buffer> {
  const r = await fetch(url, { signal: AbortSignal.timeout(30_000), cache: "no-store" });
  if (!r.ok) throw new Error(`Failed to fetch image: ${r.status}`);
  const ab = await r.arrayBuffer();
  return Buffer.from(ab);
}

function sniffMime(buf: Buffer): "image/png" | "image/jpeg" | "image/webp" {
  if (buf.length < 12) return "image/png";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf[0] === 0xff && buf[1] === 0xd8) return "image/jpeg";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return "image/png";
}

function round4(n: number): number {
  return Math.round(n * 10_000) / 10_000;
}

function makeProviderError(
  providerId: ProviderId,
  status: number,
  message: string,
  body: unknown
): ProviderError {
  const retryable = status === 0 || status === 408 || status === 429 || status === 502 || status === 503 || status === 504;
  const err = new Error(message) as ProviderError;
  err.name = "ProviderError";
  err.status = status;
  err.body = body;
  err.providerId = providerId;
  err.retryable = retryable;
  return err;
}