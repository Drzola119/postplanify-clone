import "server-only";
import type { ImageGenProvider } from "./base";
import type {
  GenerateInput,
  GenerateOutput,
  ProviderError,
  ProviderId,
} from "../types";
import { getAspectRatio, PROVIDER_PRICING } from "../types";
import { enforceResolutionCap, platformApiKey } from "../resolution";

/**
 * Ideogram 4 via Ideogram's hosted commercial API.
 *
 * Endpoint (per https://developer.ideogram.ai/ideogram-api/api-overview as
 * of mid-2026): `POST https://api.ideogram.ai/v1/ideogram-v3/generate`.
 * Auth: `Api-Key: <IDEOGRAM_API_KEY>` header. The hosted commercial tier
 * is required since we ship this as a paid platform feature; the
 * self-serve open-weights licence does NOT permit hosted use.
 *
 * Ideogram is the only provider we ship that may render up to 2K — the
 * cap is enforced centrally by `enforceResolutionCap` (see
 * `src/lib/image-gen/resolution.ts`). We never artificially downscale an
 * Ideogram result; the user pays for 2K when they ask for it.
 *
 * `aspect_ratio` is sent as a string like `"16x9"`, matching Ideogram's
 * documented v3 vocabulary. Sending an enum like `ASPECT_16_9` returns
 * 400 — we verified the string form in the live response from
 * `/v1/ideogram-v3/generate` in the production integration tests.
 *
 * Ideogram supports both free-text prompts AND structured JSON prompt
 * shapes. We prefer the JSON form when the caller supplies a
 * `structuredPrompt` (the canonical shape for our offer-ads flow):
 *
 *   {
 *     subject:        string,
 *     style:          string,
 *     colour_palette: string[],   // hex codes
 *     bbox_layout:    { top, middle, bottom, left, right, footer },
 *     typography:     string,
 *   }
 *
 * If no structured prompt is supplied, we wrap the plain-text prompt
 * inside the same JSON envelope so Ideogram still gets deterministic
 * layout guidance.
 */
const ENDPOINT = "https://api.ideogram.ai/v1/ideogram-v3/generate";
const MODEL = "ideogram-v3";

/**
 * Ideogram v3 `aspect_ratio` vocabulary, per the public API reference.
 * "WxH" string form — not an enum.
 */
const IDEOGRAM_ASPECTS: Record<string, string> = {
  "1x1": "1x1",
  "4x5": "4x5",
  "3x4": "3x4",
  "2x3": "2x3",
  "9x16": "9x16",
  "16x9": "16x9",
  "3x2": "3x2",
  "5x4": "5x4",
  "4x3": "4x3",
  "7x5": "7x5",
  "10x16": "10x16",
  "16x21": "16x21",
  "1x2": "1x2",
  "21x9": "21x9",
};

interface IdeogramResponse {
  data?: Array<{ url?: string; b64_json?: string }>;
  error?: { message?: string };
}

/**
 * Map our internal `AspectRatioKey` to the closest Ideogram ratio string.
 * Falls back to 1x1 if the caller asks for an exotic ratio we don't ship
 * in the Ideogram vocabulary.
 */
function toIdeogramAspect(key: string): string {
  return IDEOGRAM_ASPECTS[key] ?? "1x1";
}

export class Ideogram4Provider implements ImageGenProvider {
  readonly id: ProviderId = "ideogram-4";
  readonly displayName = "Ideogram 4 (hosted)";
  readonly requiresStructuredPrompt = true;

  constructor() {
    if (!platformApiKey(this.id)) {
      throw new Error("Ideogram 4 provider requires an Ideogram API key");
    }
  }

  async generate(input: GenerateInput): Promise<GenerateOutput> {
    enforceResolutionCap(this.id, input.aspectRatio);
    const ratio = getAspectRatio(input.aspectRatio);
    const promptPayload = input.structuredPrompt ?? {
      subject: input.prompt,
      style: "flat-vector-infographic",
      colour_palette: paletteForScheme("light"),
      bbox_layout: {
        top: "headline",
        middle: "core message",
        bottom: "supporting points",
      },
      typography: "sans-serif, bold headline, clean body",
    };

    const body = {
      model: MODEL,
      prompt: JSON.stringify(promptPayload),
      aspect_ratio: toIdeogramAspect(input.aspectRatio),
      magic_prompt_option: "AUTO",
      style_type: "DESIGN",
      negative_prompt: "photo, photograph, person, face, hands, blurry, watermark",
    };

    const start = Date.now();
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Api-Key": platformApiKey(this.id),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(90_000),
      cache: "no-store",
    });

    const text = await res.text();
    let parsed: IdeogramResponse | null = null;
    try {
      parsed = text.length > 0 ? (JSON.parse(text) as IdeogramResponse) : null;
    } catch {
      /* fall through */
    }

    if (!res.ok) {
      const message = parsed?.error?.message ?? `Ideogram ${res.status}`;
      throw makeProviderError(this.id, res.status, message, parsed);
    }

    const item = parsed?.data?.[0];
    if (!item) {
      throw makeProviderError(this.id, 502, "No image returned by Ideogram", parsed);
    }

    const imageUrl = item.url;
    if (!imageUrl) {
      throw makeProviderError(this.id, 502, "Ideogram returned no image URL", parsed);
    }

    const imgRes = await fetch(imageUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
    if (!imgRes.ok) {
      throw makeProviderError(this.id, 502, `Failed to fetch Ideogram image: ${imgRes.status}`, null);
    }
    const imageBytes = Buffer.from(await imgRes.arrayBuffer());

    return {
      imageBytes,
      mime: sniffMime(imageBytes),
      costUsd: PROVIDER_PRICING[this.id].flatPerImage ?? 0.08,
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

function paletteForScheme(scheme: string): string[] {
  if (scheme === "dark") return ["#0F172A", "#1E293B", "#38BDF8", "#F8FAFC", "#94A3B8"];
  if (scheme === "brand") return ["#18181B", "#FACC15", "#0EA5E9", "#F8FAFC", "#71717A"];
  return ["#FFFFFF", "#F8FAFC", "#18181B", "#2563EB", "#F97316"];
}

function sniffMime(buf: Buffer): "image/png" | "image/jpeg" | "image/webp" {
  if (buf.length < 12) return "image/png";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf[0] === 0xff && buf[1] === 0xd8) return "image/jpeg";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return "image/png";
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