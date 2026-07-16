import "server-only";
import type { GenerateInput, GenerateOutput, ProviderId } from "../types";

/**
 * Common interface every hosted-API provider adapter implements.
 *
 * The router instantiates one of these per provider id (see
 * `./registry.ts`). Each adapter is responsible for:
 *
 *   1. Building the provider-specific request body.
 *   2. Authenticating (BYOK > platform env-var key).
 *   3. Parsing the response into the shared `GenerateOutput` shape.
 *   4. Mapping provider errors into a typed `ProviderError`.
 */
export interface ImageGenProvider {
  readonly id: ProviderId;
  readonly displayName: string;
  /** True if the provider needs JSON-structured prompts instead of text. */
  readonly requiresStructuredPrompt: boolean;

  /**
   * Generate one image. Must throw `ProviderError` on any non-retryable
   * failure or throw `Error("retryable: ...")` for retryable failures so
   * the router can fall back.
   */
  generate(input: GenerateInput): Promise<GenerateOutput>;
}