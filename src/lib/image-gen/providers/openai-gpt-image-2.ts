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

const ENDPOINT = "https://api.openai.com/v1/images/generations";
const MODEL = "gpt-image-2";

interface OpenAIImagesResponse {
  data?: Array<{ b64_json?: string; url?: string }>;
  usage?: {
    input_tokens?: number;
    input_tokens_details?: { image_tokens?: number; text_tokens?: number };
    output_tokens?: number;
  };
  error?: { message?: string; code?: string };
}

/**
 * GPT Image 2 via OpenAI's hosted API.
 *
 * IMPORTANT: `gpt-image-2` is currently NOT accepted on `/v1/images/edits`
 * (only `dall-e-2` is accepted there per an OpenAI API limitation in
 * mid-2026). We only call `/v1/images/generations` for text-to-image use.
 */
export class GptImage2Provider implements ImageGenProvider {
  readonly id: ProviderId = "gpt-image-2";
  readonly displayName = "GPT Image 2 (OpenAI)";
  readonly requiresStructuredPrompt = false;

  constructor() {
    if (!platformApiKey(this.id)) {
      throw new Error("GPT Image 2 provider requires an OpenAI API key");
    }
  }

  async generate(input: GenerateInput): Promise<GenerateOutput> {
    enforceResolutionCap(this.id, input.aspectRatio);
    const ratio = getAspectRatio(input.aspectRatio);
    const body = {
      model: MODEL,
      prompt: input.prompt,
      n: 1,
      // OpenAI native WIDTHxHEIGHT format. Capped to 1K centrally —
      // `enforceResolutionCap` throws before this point if a caller
      // asks for 2K.
      size: `${ratio.width}x${ratio.height}`,
      // `quality: "low"` is the only GPT Image 2 quality band that fits
      // our per-image price ceiling at 1K. Without it, OpenAI defaults
      // to "auto" which can promote to 2K and balloon cost.
      quality: "low",
      response_format: "b64_json",
    };

    const start = Date.now();
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${platformApiKey(this.id)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
      cache: "no-store",
    });

    const text = await res.text();
    let parsed: OpenAIImagesResponse | null = null;
    try {
      parsed = text.length > 0 ? (JSON.parse(text) as OpenAIImagesResponse) : null;
    } catch {
      /* fall through */
    }

    if (!res.ok) {
      const message = parsed?.error?.message ?? `OpenAI ${res.status}`;
      throw makeProviderError(this.id, res.status, message, parsed);
    }

    const data = parsed?.data?.[0];
    if (!data) {
      throw makeProviderError(this.id, 502, "No image returned by GPT Image 2", parsed);
    }
    const imageBytes = data.b64_json
      ? Buffer.from(data.b64_json, "base64")
      : data.url
        ? await (await fetch(data.url, { cache: "no-store", signal: AbortSignal.timeout(30_000) })).arrayBuffer().then((ab) => Buffer.from(ab))
        : (() => {
            throw makeProviderError(this.id, 502, "GPT Image 2 returned no b64_json or url", parsed);
          })();

    const usage = parsed?.usage ?? {};
    const inputTokens = usage.input_tokens ?? usage.input_tokens_details?.image_tokens ?? 0;
    const outputTokens = usage.output_tokens ?? 0;
    const costUsd =
      (inputTokens / 1_000_000) * PROVIDER_PRICING[this.id].inputPerMTokens +
      (outputTokens / 1_000_000) * PROVIDER_PRICING[this.id].outputPerMTokens;

    return {
      imageBytes,
      mime: sniffMime(imageBytes),
      costUsd: round4(costUsd),
      provider: this.id,
      model: MODEL,
      durationMs: Date.now() - start,
      assetUrl: data.url ?? "",
      assetId: "",
      width: ratio.width,
      height: ratio.height,
    };
  }
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