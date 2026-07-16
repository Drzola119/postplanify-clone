import "server-only";
/**
 * engine-client.ts — Thin HTTP client for the adsify outpainting engine
 * (Express service at C:\Users\zicko\Desktop\PROJECTS\adsify poster web app,
 * mounted at /api/images/*).
 *
 * The trustiify.agency composer and Next.js API routes call this client
 * to:
 *   1. Start an AI outpainting job (POST /api/images/outpaint)
 *   2. Poll for completion (GET  /api/images/outpaint/:jobId)
 *
 * Auth: the engine uses the same Firebase project, so we forward the
 * user's Firebase ID token via `Authorization: Bearer <idToken>`. If an
 * HMAC shared secret (ADSIFY_ENGINE_API_KEY) is configured, we also send
 * it as `X-Engine-Api-Key`.
 */

import { resolvers } from "@/lib/security/server-config";
import { createLogger } from "@/lib/log";
import { toEnginePlatforms, fromEnginePlatform } from "./platform-ratios";

const log = createLogger("images/engine-client");

export interface EngineRatioGroupSummary {
  ratioKey: string;
  ratio: string;
  platforms: string[];
}

export interface StartOutpaintInput {
  /** Raw bytes of the source image. */
  sourceBuffer: Buffer;
  /** MIME type (image/jpeg | image/png | image/webp). */
  mimeType: string;
  /** Trustiify platform ids (e.g. "twitter", "instagram"). */
  platforms: string[];
  /** When true, engine returns variants without auto-delivering to upload-post. */
  skipDelivery?: boolean;
  /** Optional caption to associate with the job (for provider prompts). */
  postCaption?: string;
  /** Optional override — "google" (default), "openai", or "auto". */
  providerOverride?: "google" | "openai" | "auto";
  /** Optional mode hint for the prompt builder. */
  promptMode?:
    | "generic"
    | "product_marketing"
    | "people_lifestyle"
    | "cars_vehicles"
    | "interiors"
    | "graphics_with_text";
  /** Firebase ID token to authenticate with the engine. */
  idToken: string;
}

export interface StartOutpaintResult {
  jobId: string;
  status: string;
  platforms: string[];
  ratioGroups: EngineRatioGroupSummary[];
  estimatedVariants: number;
  skipDelivery: boolean;
}

export interface EngineVariant {
  variantId: string;
  ratioKey: string;
  /** Engine-canonical platform names (e.g. "x" not "twitter"). */
  platforms: string[];
  provider: string | null;
  model: string | null;
  width: number | null;
  height: number | null;
  publicUrl: string | null;
  status: "generating" | "complete" | "failed" | string;
}

export interface GetOutpaintResult {
  jobId: string;
  status: string;
  /** Engine-canonical platform names. */
  platforms: string[];
  ratioGroups: Record<string, string> | null;
  variants: EngineVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface EnginePlatformSpec {
  width: number;
  height: number;
  ratio: string;
  ratioKey: string;
}

export interface EnginePlatformMap {
  platforms: Record<string, EnginePlatformSpec>;
  ratioGroups: EngineRatioGroupSummary[];
}

class EngineError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    message: string
  ) {
    super(message);
    this.name = "EngineError";
  }
}

function resolveBaseUrl(): string {
  // Use empty headers so we only read from env. The composer's request
  // headers don't reach the engine; the engine-client uses the server-side
  // resolver which honours env-first, then x-* override headers.
  const url = resolvers.engineBaseUrl(new Headers());
  if (!url) {
    throw new EngineError(
      500,
      null,
      "ADSIFY_ENGINE_URL not configured on server"
    );
  }
  return url.replace(/\/+$/, "");
}

function buildAuthHeaders(idToken: string): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${idToken}`,
    Accept: "application/json",
  };
  const apiKey = resolvers.engineApiKey(new Headers());
  if (apiKey) headers["X-Engine-Api-Key"] = apiKey;
  return headers;
}

/**
 * Start an outpainting job on the engine. The engine responds with 202
 * immediately and processes the AI generation in the background. The
 * caller is expected to poll `getOutpaintJob` until status is
 * `generation_complete` (or one of the failure statuses).
 */
export async function startOutpaintJob(
  input: StartOutpaintInput
): Promise<StartOutpaintResult> {
  const baseUrl = resolveBaseUrl();
  const enginePlatforms = toEnginePlatforms(input.platforms);

  const form = new FormData();
  // Cast Buffer to Uint8Array view so the TS BlobPart type accepts it
  // (Node 18+ Buffer is an ArrayBufferLike, which doesn't satisfy
  // BlobPart's stricter ArrayBuffer constraint).
  const blob = new Blob([new Uint8Array(input.sourceBuffer)], {
    type: input.mimeType,
  });
  form.append("image", blob, "source");
  form.append("platforms", JSON.stringify(enginePlatforms));
  if (input.skipDelivery) form.append("skipDelivery", "true");
  if (input.postCaption) form.append("postCaption", input.postCaption);
  if (input.providerOverride) form.append("providerOverride", input.providerOverride);
  if (input.promptMode) form.append("promptMode", input.promptMode);

  const url = `${baseUrl}/api/images/outpaint`;
  log.info("[engine-client] POST /api/images/outpaint", {
    engineUrl: baseUrl,
    platforms: enginePlatforms,
    skipDelivery: input.skipDelivery ?? false,
    bytes: input.sourceBuffer.length,
    mimeType: input.mimeType,
  });

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: buildAuthHeaders(input.idToken),
      body: form,
      // The engine may take a few seconds to mint the job even on the 202 path.
      signal: AbortSignal.timeout(30_000),
      cache: "no-store",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "fetch failed";
    log.error("[engine-client] POST /api/images/outpaint network error", { err: msg, url });
    throw new EngineError(502, null, `Engine unreachable: ${msg}`);
  }

  const text = await res.text();
  let data: unknown = text;
  try {
    data = JSON.parse(text);
  } catch {
    // non-JSON body
  }

  if (!res.ok) {
    log.warn("[engine-client] POST /outpaint non-2xx", { status: res.status, body: data });
    throw new EngineError(res.status, data, `Engine returned ${res.status}`);
  }

  const parsed = data as Partial<StartOutpaintResult>;
  if (!parsed?.jobId) {
    throw new EngineError(502, data, "Engine returned 2xx without jobId");
  }

  return {
    jobId: parsed.jobId,
    status: parsed.status ?? "pending",
    platforms: parsed.platforms ?? enginePlatforms,
    ratioGroups: parsed.ratioGroups ?? [],
    estimatedVariants: parsed.estimatedVariants ?? 0,
    skipDelivery: parsed.skipDelivery ?? input.skipDelivery ?? false,
  };
}

/**
 * Poll a job's status. Returns the engine's full payload including
 * per-variant public URLs.
 */
export async function getOutpaintJob(
  jobId: string,
  idToken: string
): Promise<GetOutpaintResult> {
  const baseUrl = resolveBaseUrl();
  const url = `${baseUrl}/api/images/outpaint/${encodeURIComponent(jobId)}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: buildAuthHeaders(idToken),
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "fetch failed";
    log.error("[engine-client] GET /outpaint/:id network error", { err: msg, jobId });
    throw new EngineError(502, null, `Engine unreachable: ${msg}`);
  }

  const text = await res.text();
  let data: unknown = text;
  try {
    data = JSON.parse(text);
  } catch {
    // fall through
  }

  if (!res.ok) {
    if (res.status === 404) {
      throw new EngineError(404, data, "Outpaint job not found");
    }
    log.warn("[engine-client] GET /outpaint/:id non-2xx", { status: res.status, jobId, body: data });
    throw new EngineError(res.status, data, `Engine returned ${res.status}`);
  }

  const parsed = data as Partial<GetOutpaintResult> & { variants?: EngineVariant[] };
  const engineVariants: EngineVariant[] = Array.isArray(parsed.variants)
    ? parsed.variants
    : [];

  // Translate engine platform ids back to trustiify ids in each variant's
  // platforms[] so the composer can directly look them up by its own id.
  const trustiifyVariants: EngineVariant[] = engineVariants.map((v) => ({
    ...v,
    platforms: (v.platforms ?? []).map(fromEnginePlatform),
  }));

  return {
    jobId: parsed.jobId ?? jobId,
    status: parsed.status ?? "unknown",
    platforms: (parsed.platforms ?? []).map(fromEnginePlatform),
    ratioGroups: parsed.ratioGroups ?? null,
    variants: trustiifyVariants,
    createdAt: parsed.createdAt ?? new Date().toISOString(),
    updatedAt: parsed.updatedAt ?? new Date().toISOString(),
  };
}

/**
 * Fetch the engine's platform-map. Optionally cached for `ttlMs`.
 * Used by the trustiify /api/images/platform-map route so the UI can
 * render the ratio reference without re-deriving from a hard-coded copy.
 */
export async function getEnginePlatformMap(
  idToken: string
): Promise<EnginePlatformMap> {
  const baseUrl = resolveBaseUrl();
  const url = `${baseUrl}/api/images/platform-map`;

  const res = await fetch(url, {
    method: "GET",
    headers: buildAuthHeaders(idToken),
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });

  const text = await res.text();
  let data: unknown = text;
  try {
    data = JSON.parse(text);
  } catch {
    // ignore
  }

  if (!res.ok) {
    throw new EngineError(res.status, data, `Engine returned ${res.status}`);
  }
  return data as EnginePlatformMap;
}

export { EngineError };