/**
 * video-gen/router.ts
 * generateVideo() — walks the fallback chain, submitting+polling each provider.
 * Mirrors src/lib/image-gen/router.ts but wraps an async submit+poll loop
 * per provider (video generation is 30s–3min+, never synchronous).
 *
 * NOTE: This is called by the render worker (not directly from the API route).
 * The API route writes a videoJob doc + returns 202; the worker calls generateVideo().
 */
import "server-only";
import { resolveFallbackChain } from "./fallback-chain";
import { estimateVideoCostUsd } from "./cost";
import { getProviderInstance } from "./providers";
import { createLogger } from "../logging";
import type {
  VideoGenerateInput,
  VideoGenerateOutput,
  VideoProviderId,
} from "./types";

const logger = createLogger("video-gen:router");

const MAX_POLL_ATTEMPTS = 120; // 120 × 5s = 10 min max per provider
const POLL_INTERVAL_MS = 5_000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function generateVideo(
  input: VideoGenerateInput
): Promise<VideoGenerateOutput> {
  const chain = resolveFallbackChain(input.provider);
  const attempts: Array<{ provider: VideoProviderId; error: string }> = [];
  let fellBackFrom: VideoProviderId | undefined;

  for (const providerId of chain) {
    const provider = getProviderInstance(providerId);
    if (!provider) {
      logger.warn("No provider instance for", { providerId });
      continue;
    }

    const startMs = Date.now();

    try {
      logger.info("Submitting video generation", {
        provider: providerId,
        workflow: input.context.workflow,
        mode: input.mode,
        durationSec: input.durationSec,
      });

      const providerJobId = await provider.submit(input);

      logger.info("Provider job submitted", { providerId, providerJobId });

      // Poll until complete or failed
      let pollAttempts = 0;
      let status: "pending" | "complete" | "failed" = "pending";

      while (status === "pending" && pollAttempts < MAX_POLL_ATTEMPTS) {
        await sleep(POLL_INTERVAL_MS);
        status = await provider.pollStatus(providerJobId);
        pollAttempts++;

        if (pollAttempts % 6 === 0) {
          // Log every 30s
          logger.info("Polling video generation", {
            providerId,
            providerJobId,
            pollAttempts,
            status,
          });
        }
      }

      if (status === "failed") {
        throw new Error(`Provider ${providerId} reported job as failed`);
      }
      if (status === "pending") {
        throw new Error(
          `Provider ${providerId} timed out after ${MAX_POLL_ATTEMPTS} polls`
        );
      }

      const result = await provider.fetchResult(providerJobId);
      const durationMs = Date.now() - startMs;
      const costUsd = estimateVideoCostUsd(
        providerId,
        result.durationSec,
        input.aspectRatios[0]
      );

      logger.info("Video generation complete", {
        providerId,
        providerJobId,
        durationMs,
        costUsd,
        videoUrl: result.videoUrl,
      });

      return {
        provider: providerId,
        model: result.model,
        assetId: "", // populated by asset-saver after CDN upload
        assetUrl: result.videoUrl,
        mime: "video/mp4",
        durationSec: result.durationSec,
        width: result.width,
        height: result.height,
        costUsd,
        durationMs,
        fellBackFrom,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logger.warn("Provider failed, trying next in chain", {
        providerId,
        error: errorMsg,
      });
      attempts.push({ provider: providerId, error: errorMsg });
      fellBackFrom = providerId;
    }
  }

  const allErrors = attempts.map((a) => `${a.provider}: ${a.error}`).join("; ");
  throw new Error(`All video providers failed. Attempts: [${allErrors}]`);
}
