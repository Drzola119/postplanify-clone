import "server-only";
import { CAPTION_CONFIG } from "@/lib/config/caption-config";
import { globalGrokRateLimiter } from "@/lib/ai/rate-limiter";
import { buildCaptionPrompt } from "@/lib/ai/caption-templates";
import { fitCaptionForPlatform } from "@/lib/ai/caption-fit";
import type { PlatformId } from "@/lib/db/schema";
import type { CaptionJobInputSnapshot, CaptionJobUsage } from "@/lib/db/schema";
import { resolvers } from "@/lib/security/server-config";
import { callGroq, GROQ_TEXT_MODEL, GROQ_VISION_MODEL } from "@/lib/ai/groq";

export type GrokErrorCode =
  | "RATE_LIMITED"
  | "AUTHENTICATION_ERROR"
  | "PROVIDER_UNAVAILABLE"
  | "NETWORK_ERROR"
  | "INVALID_REQUEST"
  | "INVALID_RESPONSE"
  | "CONTENT_VALIDATION_ERROR"
  | "TIMEOUT"
  | "UNKNOWN";

export interface GrokGatewayError {
  code: GrokErrorCode;
  message: string;
  statusCode?: number;
  retryable: boolean;
}

export interface GenerateCaptionOptions {
  userId: string;
  snapshot: CaptionJobInputSnapshot;
  timeoutMs?: number;
  headers?: Headers;
}

export interface GenerateCaptionResult {
  ok: boolean;
  caption?: string;
  captionsByPlatform?: Record<string, string>;
  provider: "xai" | "groq";
  model: string;
  usage?: CaptionJobUsage;
  durationMs: number;
  error?: GrokGatewayError;
}

const MAX_PROMPT_LEN = 1200;
const MAX_EXTRA_LEN = 400;

function cleanJsonString(str: string): string {
  let cleaned = str.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/```$/, "");
  }
  return cleaned.trim();
}

function buildSystemPrompt(multiPlatform?: boolean): string {
  if (multiPlatform) {
    return [
      "You are an expert social-media copywriter for PostPlanify.",
      "Write platform-tailored social copy.",
      "Return ONLY a valid JSON object matching the requested schema without code fences, no extra text.",
    ].join(" ");
  }
  return [
    "You are a social-media copywriter for PostPlanify.",
    "Write captions that are ready to paste — no preamble, no quotes, no 'Here is your caption:'.",
    "Never start with 'I', never reference the prompt or image source.",
    "Use line breaks (\\n\\n) to separate paragraphs; do not return bullet lists unless the platform is short-form.",
    "Return ONLY the caption text.",
  ].join(" ");
}

function buildUserPrompt(snapshot: CaptionJobInputSnapshot): string {
  const { userPrompt } = buildCaptionPrompt({
    tone: snapshot.tone ?? "default",
    voice: snapshot.voice ?? null,
    template: snapshot.template ?? null,
    includeHashtags: !!snapshot.includeHashtags,
    useEmojis: !!snapshot.useEmojis,
    multiPlatform: snapshot.multiPlatform,
    extra: snapshot.extra?.slice(0, MAX_EXTRA_LEN) ?? null,
    platforms: snapshot.platforms,
    hasMedia: !!snapshot.imageUrl || !!snapshot.videoTitle || (snapshot.mediaUrls && snapshot.mediaUrls.length > 0),
  });

  if (snapshot.imageUrl) {
    return [`Look at the attached image.`, userPrompt].join("\n\n");
  }
  if (snapshot.videoTitle) {
    return [
      `The user uploaded a video titled: "${snapshot.videoTitle.trim().slice(0, 200)}".`,
      userPrompt,
    ].join("\n\n");
  }
  return userPrompt;
}

function classifyError(status: number, message: string): GrokGatewayError {
  if (status === 429) {
    return { code: "RATE_LIMITED", message: "Provider rate limit exceeded (429)", statusCode: 429, retryable: true };
  }
  if (status === 401 || status === 403) {
    return { code: "AUTHENTICATION_ERROR", message: "Invalid or unauthorized API key", statusCode: status, retryable: false };
  }
  if (status === 408 || status === 504) {
    return { code: "TIMEOUT", message: "Request timed out", statusCode: status, retryable: true };
  }
  if (status >= 500) {
    return { code: "PROVIDER_UNAVAILABLE", message: `AI provider error (${status}): ${message}`, statusCode: status, retryable: true };
  }
  if (status === 400 || status === 422) {
    return { code: "INVALID_REQUEST", message: `Invalid generation request (${status}): ${message}`, statusCode: status, retryable: false };
  }
  return { code: "UNKNOWN", message: message || `Unexpected error (${status})`, statusCode: status, retryable: true };
}

/**
 * Authoritative Grok Gateway for all caption generation requests.
 * Enforces rate limits, token estimation, timeout handling, error classification, and provider fallback.
 */
export async function generateCaptionViaGateway(opts: GenerateCaptionOptions): Promise<GenerateCaptionResult> {
  const startTime = Date.now();
  const headers = opts.headers ?? new Headers();

  // 1. Acquire global rate limit lease
  const lease = await globalGrokRateLimiter.waitForLease(opts.userId, CAPTION_CONFIG.ESTIMATED_TOKENS_PER_REQUEST, 15_000);
  if (!lease.acquired) {
    return {
      ok: false,
      provider: "xai",
      model: CAPTION_CONFIG.XAI_MODEL,
      durationMs: Date.now() - startTime,
      error: {
        code: "RATE_LIMITED",
        message: lease.reason || "Rate limiter lease timed out",
        retryable: true,
      },
    };
  }

  // 2. Resolve credentials (xAI primary, Groq fallback)
  let xaiKey: string | undefined;
  try {
    xaiKey = resolvers.xaiApiKeyOptional(headers);
  } catch {}

  const useVision = !!opts.snapshot.imageUrl;
  const multiPlatform = !!opts.snapshot.multiPlatform;
  const systemPrompt = buildSystemPrompt(multiPlatform);
  const userPrompt = buildUserPrompt(opts.snapshot);

  // If xAI key is available, call xAI Grok API
  if (xaiKey) {
    const xaiModel = useVision ? CAPTION_CONFIG.XAI_VISION_MODEL : CAPTION_CONFIG.XAI_MODEL;
    const messages: Array<{ role: string; content: unknown }> = [
      { role: "system", content: systemPrompt },
    ];

    if (useVision) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: userPrompt.slice(0, MAX_PROMPT_LEN) },
          { type: "image_url", image_url: { url: opts.snapshot.imageUrl! } },
        ],
      });
    } else {
      messages.push({ role: "user", content: userPrompt.slice(0, MAX_PROMPT_LEN) });
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), opts.timeoutMs ?? CAPTION_CONFIG.REQUEST_TIMEOUT_MS);

      const res = await fetch(`${CAPTION_CONFIG.XAI_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${xaiKey}`,
        },
        body: JSON.stringify({
          model: xaiModel,
          messages,
          temperature: 0.7,
          max_tokens: multiPlatform ? 1000 : CAPTION_CONFIG.MAX_OUTPUT_TOKENS,
          stream: false,
          response_format: multiPlatform ? { type: "json_object" } : undefined,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const durationMs = Date.now() - startTime;

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        const classified = classifyError(res.status, errText);
        lease.release({ success: false, statusCode: res.status });
        return {
          ok: false,
          provider: "xai",
          model: xaiModel,
          durationMs,
          error: classified,
        };
      }

      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: {
          prompt_tokens?: number;
          completion_tokens?: number;
          total_tokens?: number;
          cost_in_usd_ticks?: number;
        };
      };

      const rawContent = data.choices?.[0]?.message?.content?.trim();
      if (!rawContent) {
        lease.release({ success: false, statusCode: 502 });
        return {
          ok: false,
          provider: "xai",
          model: xaiModel,
          durationMs,
          error: {
            code: "INVALID_RESPONSE",
            message: "Provider returned empty caption choice",
            retryable: true,
          },
        };
      }

      const actualTokens = data.usage?.total_tokens ?? CAPTION_CONFIG.ESTIMATED_TOKENS_PER_REQUEST;
      lease.release({ success: true, actualTokens, statusCode: 200 });

      const usage: CaptionJobUsage = {
        promptTokens: data.usage?.prompt_tokens,
        completionTokens: data.usage?.completion_tokens,
        totalTokens: data.usage?.total_tokens,
        costInUsdTicks: data.usage?.cost_in_usd_ticks,
        durationMs,
      };

      return processCaptionResponse(rawContent, opts.snapshot, "xai", xaiModel, usage, durationMs);
    } catch (err: unknown) {
      const durationMs = Date.now() - startTime;
      const isAbort = (err as Error)?.name === "AbortError";
      lease.release({ success: false, statusCode: isAbort ? 408 : 500 });
      return {
        ok: false,
        provider: "xai",
        model: xaiModel,
        durationMs,
        error: isAbort
          ? { code: "TIMEOUT", message: "Request timed out", retryable: true }
          : { code: "NETWORK_ERROR", message: (err as Error)?.message ?? "Network error", retryable: true },
      };
    }
  }

  // Fallback: Groq SDK adapter
  try {
    const groqKey = resolvers.groqApiKey(headers);
    const groqModel = useVision ? GROQ_VISION_MODEL : GROQ_TEXT_MODEL;

    const messages = [
      { role: "system" as const, content: systemPrompt },
    ];

    let result;
    if (useVision) {
      result = await callGroq({
        apiKey: groqKey,
        model: groqModel,
        messages: [
          ...messages,
          {
            role: "user" as const,
            content: [
              { type: "text" as const, text: userPrompt.slice(0, MAX_PROMPT_LEN) },
              { type: "image_url" as const, image_url: { url: opts.snapshot.imageUrl! } },
            ],
          },
        ],
        temperature: 0.7,
        maxTokens: multiPlatform ? 1000 : CAPTION_CONFIG.MAX_OUTPUT_TOKENS,
        jsonMode: multiPlatform,
      });
    } else {
      result = await callGroq({
        apiKey: groqKey,
        model: groqModel,
        messages: [
          ...messages,
          { role: "user" as const, content: userPrompt.slice(0, MAX_PROMPT_LEN) },
        ],
        temperature: 0.7,
        maxTokens: multiPlatform ? 1000 : CAPTION_CONFIG.MAX_OUTPUT_TOKENS,
        jsonMode: multiPlatform,
      });
    }

    const durationMs = Date.now() - startTime;
    lease.release({ success: true, statusCode: 200 });

    const rawContent = result.content.trim();
    if (!rawContent) {
      return {
        ok: false,
        provider: "groq",
        model: groqModel,
        durationMs,
        error: {
          code: "INVALID_RESPONSE",
          message: "Groq adapter returned empty content",
          retryable: true,
        },
      };
    }

    return processCaptionResponse(rawContent, opts.snapshot, "groq", groqModel, { durationMs }, durationMs);
  } catch (err: unknown) {
    const durationMs = Date.now() - startTime;
    lease.release({ success: false });
    const status = (err as { status?: number })?.status ?? 500;
    const classified = classifyError(status, (err as Error)?.message ?? "Groq adapter failure");
    return {
      ok: false,
      provider: "groq",
      model: GROQ_TEXT_MODEL,
      durationMs,
      error: classified,
    };
  }
}

function processCaptionResponse(
  rawContent: string,
  snapshot: CaptionJobInputSnapshot,
  provider: "xai" | "groq",
  model: string,
  usage: CaptionJobUsage | undefined,
  durationMs: number
): GenerateCaptionResult {
  const targetPlatforms = (snapshot.platforms ?? []).map((p) => p.id as PlatformId);

  if (snapshot.multiPlatform) {
    try {
      const cleaned = cleanJsonString(rawContent);
      const parsedJson = JSON.parse(cleaned) as {
        base?: string;
        captionsByPlatform?: Record<string, string>;
        [k: string]: unknown;
      };

      const baseCaption = String(parsedJson.base ?? rawContent).trim();
      const byPlatform: Record<string, string> = {};

      for (const pid of targetPlatforms) {
        const directMatch = parsedJson[pid] || parsedJson.captionsByPlatform?.[pid];
        if (typeof directMatch === "string" && directMatch.trim()) {
          byPlatform[pid] = directMatch.trim();
        } else {
          byPlatform[pid] = fitCaptionForPlatform(baseCaption, pid);
        }
      }

      return {
        ok: true,
        caption: baseCaption,
        captionsByPlatform: byPlatform,
        provider,
        model,
        usage,
        durationMs,
      };
    } catch {
      // JSON parse failed fallback to single base caption
      const baseCaption = cleanJsonString(rawContent);
      const byPlatform: Record<string, string> = {};
      for (const pid of targetPlatforms) {
        byPlatform[pid] = fitCaptionForPlatform(baseCaption, pid);
      }
      return {
        ok: true,
        caption: baseCaption,
        captionsByPlatform: byPlatform,
        provider,
        model,
        usage,
        durationMs,
      };
    }
  }

  // Single base caption
  const baseCaption = rawContent;
  const byPlatform: Record<string, string> = {};
  for (const pid of targetPlatforms) {
    byPlatform[pid] = fitCaptionForPlatform(baseCaption, pid);
  }

  return {
    ok: true,
    caption: baseCaption,
    captionsByPlatform: byPlatform,
    provider,
    model,
    usage,
    durationMs,
  };
}
