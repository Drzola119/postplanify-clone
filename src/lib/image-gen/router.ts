import "server-only";
import type { ImageGenProvider } from "./providers/base";
import { GeminiFlashLiteImageProvider } from "./providers/openrouter-gemini-flash-lite";
import { GeminiFlashImageProvider } from "./providers/openrouter-gemini-flash";
import { GptImage2Provider } from "./providers/openai-gpt-image-2";
import { Ideogram4Provider } from "./providers/ideogram-4";
import { resolveFallbackChain } from "./fallback-chain";
import { resolveImageGenKey } from "./key-resolver";
import { persistGeneratedImage } from "./asset-saver";
import { logImageGeneration } from "./generation-log";
import type { GenerateInput, GenerateOutput, ProviderId } from "./types";

/**
 * Provider routing error: raised when every provider in the fallback chain
 * has been tried and all of them failed.
 */
export class ImageGenExhaustedError extends Error {
  constructor(
    public readonly attempts: Array<{ provider: ProviderId; status: number; message: string }>,
    message: string
  ) {
    super(message);
    this.name = "ImageGenExhaustedError";
  }
}

/**
 * Generate one infographic image.
 *
 * Walks the fallback chain (or just the named provider if not "auto"),
 * trying each in order until one succeeds. On every attempt we resolve
 * the API key (override → BYOK → platform), instantiate the adapter,
 * and call it. Successful results are persisted to Bunny + Firestore and
 * logged for analytics.
 */
export async function generateInfographic(
  input: GenerateInput & { uid: string; headers?: Headers }
): Promise<GenerateOutput> {
  const chain = resolveFallbackChain(input.provider);
  const attempts: Array<{ provider: ProviderId; status: number; message: string }> = [];
  const requested = input.provider === "auto" ? undefined : input.provider;
  let lastError: Error | null = null;

  for (let i = 0; i < chain.length; i++) {
    const providerId = chain[i];
    const isFirstChoice = requested === providerId || (i === 0 && requested === undefined);
    try {
      const resolved = await resolveImageGenKey({
        workspaceId: input.workspaceId,
        provider: providerId,
        override: input.apiKeyOverride,
      });

      if (!resolved.apiKey) {
        attempts.push({ provider: providerId, status: 0, message: "no API key configured" });
        continue;
      }

      const provider = instantiate(providerId, resolved.apiKey);
      const out = await provider.generate(input);

      // Persist to Bunny + Firestore.
      const persisted = await persistGeneratedImage({
        workspaceId: input.workspaceId,
        uid: input.uid,
        bytes: out.imageBytes,
        mime: out.mime,
        width: out.width,
        height: out.height,
        tool: input.context?.tool,
        styleId: input.context?.styleId,
        headers: input.headers,
      });

      const finalOutput: GenerateOutput = {
        ...out,
        assetId: persisted.assetId,
        assetUrl: persisted.cdnUrl,
        fellBackFrom: isFirstChoice ? undefined : requested,
      };

      // Best-effort analytics log. `resolved.source` is "missing" only when
      // apiKey is null (we `continue` above), so we narrow it here.
      const keySource: "byok" | "platform" | "override" =
        resolved.source === "byok" || resolved.source === "platform" || resolved.source === "override"
          ? resolved.source
          : "platform";
      void logImageGeneration({
        workspaceId: input.workspaceId,
        uid: input.uid,
        provider: providerId,
        model: out.model,
        keySource,
        costUsd: out.costUsd,
        aspectRatio: input.aspectRatio,
        tool: input.context?.tool,
        styleId: input.context?.styleId,
        durationMs: out.durationMs,
        width: out.width,
        height: out.height,
        promptChars: input.prompt.length,
        fellBack: !isFirstChoice,
        requestedProvider: requested,
      });

      return finalOutput;
    } catch (err) {
      const status = (err as { status?: number })?.status ?? 0;
      const message = err instanceof Error ? err.message : String(err);
      attempts.push({ provider: providerId, status, message });
      lastError = err instanceof Error ? err : new Error(message);
      const explicitRetry = (err as { retryable?: boolean })?.retryable;
      const retryable =
        (explicitRetry ?? false) ||
        status === 0 ||
        status === 408 ||
        status === 429 ||
        status === 502 ||
        status === 503 ||
        status === 504;
      if (!retryable) {
        // Non-retryable (bad prompt, missing scope, etc.) — stop walking
        // the chain, this is a real bug not a transient outage.
        break;
      }
    }
  }

  throw new ImageGenExhaustedError(
    attempts,
    `All providers failed: ${attempts.map((a) => `${a.provider}(${a.status})`).join(", ")} — ${lastError?.message ?? ""}`
  );
}

function instantiate(providerId: ProviderId, apiKey: string): ImageGenProvider {
  switch (providerId) {
    case "gemini-flash-lite-image":
      return new GeminiFlashLiteImageProvider(apiKey);
    case "gemini-flash-image":
      return new GeminiFlashImageProvider(apiKey);
    case "gpt-image-2":
      return new GptImage2Provider(apiKey);
    case "ideogram-4":
      return new Ideogram4Provider(apiKey);
    default: {
      const exhaustive: never = providerId;
      throw new Error(`Unknown provider id: ${exhaustive as string}`);
    }
  }
}