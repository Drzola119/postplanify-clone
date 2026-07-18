import "server-only";
import type { ImageGenProvider } from "./providers/base";
import { GeminiFlashLiteImageProvider } from "./providers/openrouter-gemini-flash-lite";
import { GeminiFlashImageProvider } from "./providers/openrouter-gemini-flash";
import { GptImage2Provider } from "./providers/openai-gpt-image-2";
import { Ideogram4Provider } from "./providers/ideogram-4";
import { resolveFallbackChain } from "./fallback-chain";
import { isProviderArabicCapable } from "./language-support";
import { platformApiKey, ImageGenResolutionError } from "./resolution";
import { recordImageGenUsage } from "./usage";
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
 * trying each in order until one succeeds. Every request is billed to the
 * platform — we always use our own environment-variable API keys
 * (OPENROUTER_API_KEY / OPENAI_API_KEY / IDEOGRAM_API_KEY), never a
 * per-user key. Successful results are persisted to Bunny + Firestore,
 * increment the workspace usage counter, and are logged for analytics.
 */
export async function generateInfographic(
  input: GenerateInput & { uid: string; headers?: Headers }
): Promise<GenerateOutput> {
  const chain = resolveFallbackChain(input.provider);

  // Arabic output is only offered on providers whose rendering quality a
  // human has verified. When the request asks for Arabic we pre-filter the
  // chain down to those. For en/fr the chain is untouched (effectiveChain === chain).
  const effectiveChain =
    input.outputLanguage === "ar"
      ? chain.filter((p) => isProviderArabicCapable(p))
      : chain;

  if (input.outputLanguage === "ar" && effectiveChain.length === 0) {
    throw new Error(
      "No Arabic-capable image provider is currently available. " +
      "Please select English or French output, or try again later."
    );
  }

  const attempts: Array<{ provider: ProviderId; status: number; message: string }> = [];
  const requested = input.provider === "auto" ? undefined : input.provider;
  let lastError: Error | null = null;

  for (let i = 0; i < effectiveChain.length; i++) {
    const providerId = effectiveChain[i];
    const isFirstChoice = requested === providerId || (i === 0 && requested === undefined);
    try {
      let apiKey: string;
      try {
        apiKey = platformApiKey(providerId);
      } catch (keyErr) {
        // Missing platform env var for this provider — skip it and try the
        // next in the chain rather than aborting the whole request.
        if (keyErr instanceof ImageGenResolutionError) {
          attempts.push({ provider: providerId, status: 0, message: keyErr.message });
          continue;
        }
        throw keyErr;
      }

      const provider = instantiate(providerId);
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

      // Increment the per-workspace usage counter so we can bill the client
      // against their plan's included generations + overage. Fire-and-forget.
      void recordImageGenUsage({
        workspaceId: input.workspaceId,
        uid: input.uid,
        provider: providerId,
        costUsd: out.costUsd,
      });

      // Best-effort analytics log. All generations are platform-billed.
      void logImageGeneration({
        workspaceId: input.workspaceId,
        uid: input.uid,
        provider: providerId,
        model: out.model,
        keySource: "platform",
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

function instantiate(providerId: ProviderId): ImageGenProvider {
  switch (providerId) {
    case "gemini-flash-lite-image":
      return new GeminiFlashLiteImageProvider();
    case "gemini-flash-image":
      return new GeminiFlashImageProvider();
    case "gpt-image-2":
      return new GptImage2Provider();
    case "ideogram-4":
      return new Ideogram4Provider();
    default: {
      const exhaustive: never = providerId;
      throw new Error(`Unknown provider id: ${exhaustive as string}`);
    }
  }
}