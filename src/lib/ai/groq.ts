import "server-only";
import type { PlatformId } from "@/lib/db/schema";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODELS_ENDPOINT = "https://api.groq.com/openai/v1/models";

// Default preferred models (auto-resolved dynamically if decommissioned)
export const GROQ_TEXT_MODEL = "llama-3.3-70b-versatile";
export const GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
export const GROQ_FALLBACK_TEXT_MODEL = "llama-3.1-8b-instant";
export const GROQ_FALLBACK_VISION_MODEL = "llama-3.2-11b-vision-preview";

export type GroqMessage =
  | { role: "system" | "user" | "assistant"; content: string }
  | {
      role: "user";
      content: Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      >;
    };

export interface GroqOptions {
  apiKey: string;
  model: string;
  messages: GroqMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  jsonMode?: boolean;
  reasoningEffort?: "low" | "medium" | "high" | "none" | "default";
}

export interface GroqResult {
  content: string;
  model: string;
  raw?: unknown;
}

export class GroqError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown
  ) {
    super(message);
    this.name = "GroqError";
  }
}

let cachedModels: { ids: string[]; timestamp: number } | null = null;

/**
 * Fetch available model IDs for the given Groq API key (cached for 10 minutes).
 */
export async function getAvailableGroqModels(apiKey: string): Promise<string[]> {
  const now = Date.now();
  if (cachedModels && now - cachedModels.timestamp < 10 * 60 * 1000) {
    return cachedModels.ids;
  }
  try {
    const res = await fetch(GROQ_MODELS_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    if (!res.ok) return [];
    const data = (await res.json().catch(() => ({}))) as { data?: { id: string }[] };
    const ids = (data.data || []).map((m) => m.id);
    if (ids.length > 0) {
      cachedModels = { ids, timestamp: now };
    }
    return ids;
  } catch {
    return [];
  }
}

/**
 * Dynamically resolves an active model from the user's available Groq models.
 */
export async function resolveGroqModel(
  apiKey: string,
  preferred: string,
  kind: "text" | "vision" = "text"
): Promise<string> {
  const available = await getAvailableGroqModels(apiKey);
  if (available.length === 0) return preferred;
  if (available.includes(preferred)) return preferred;

  if (kind === "vision") {
    const visionCandidate = available.find(
      (id) =>
        id.includes("scout") ||
        id.includes("vision") ||
        id.includes("vl") ||
        id.includes("qwen")
    );
    if (visionCandidate) return visionCandidate;
  }

  const textPreferences = [
    "llama-3.3-70b-versatile",
    "llama-3.1-70b-versatile",
    "llama3-70b-8192",
    "llama-3.1-8b-instant",
    "llama3-8b-8192",
    "mixtral-8x7b-32768",
    "gemma2-9b-it",
  ];

  for (const cand of textPreferences) {
    if (available.includes(cand)) return cand;
  }

  const chatModel = available.find(
    (id) =>
      !id.includes("whisper") &&
      !id.includes("embed") &&
      !id.includes("guard")
  );
  return chatModel || available[0] || preferred;
}

export async function callGroq(opts: GroqOptions): Promise<GroqResult> {
  const sendRequest = async (modelToUse: string) => {
    const body: Record<string, unknown> = {
      model: modelToUse,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 600,
      top_p: opts.topP ?? 0.95,
      stream: false,
    };
    if (opts.jsonMode) body.response_format = { type: "json_object" };
    if (
      opts.reasoningEffort &&
      opts.reasoningEffort !== "none" &&
      opts.reasoningEffort !== "default"
    ) {
      body.reasoning_effort = opts.reasoningEffort;
    }

    const res = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${opts.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = (await res.json().catch(() => ({}))) as {
      choices?: { message?: { content?: string } }[];
      error?: { message?: string };
    };

    if (!res.ok) {
      const msg = data?.error?.message ?? `Groq API error ${res.status}`;
      throw new GroqError(msg, res.status, data);
    }

    const content = stripReasoning(data.choices?.[0]?.message?.content ?? "");
    if (!content) {
      throw new GroqError("Empty completion from Groq", 502, data);
    }

    return { content, model: modelToUse, raw: data };
  };

  try {
    return await sendRequest(opts.model);
  } catch (err) {
    // If model not found or decommissioned, dynamically find an active one
    if (err instanceof GroqError && (err.status === 400 || err.status === 404)) {
      try {
        const isVision = opts.messages.some(
          (m) => typeof m.content !== "string" && Array.isArray(m.content) && m.content.some((c) => c.type === "image_url")
        );
        const resolved = await resolveGroqModel(opts.apiKey, opts.model, isVision ? "vision" : "text");
        if (resolved && resolved !== opts.model) {
          return await sendRequest(resolved);
        }
      } catch {
        // Fall back to rethrowing original error
      }
    }
    throw err;
  }
}

/** Remove hidden reasoning that some reasoning-capable models may emit. */
export function stripReasoning(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";

  const thinkStart = trimmed.search(/<(?:think|analysis)>/i);
  if (thinkStart === -1) return trimmed;

  const thinkEnd = trimmed.search(/<\/(?:think|analysis)>/i);
  if (thinkEnd === -1) return "";
  return trimmed.slice(thinkEnd + trimmed.slice(thinkEnd).indexOf(">") + 1).trim();
}

/** Best-effort JSON extraction from a Groq completion that may include leading prose. */
export function extractJson<T = unknown>(text: string): T | null {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) {
    try {
      return JSON.parse(fence[1].trim()) as T;
    } catch {
      /* fall through */
    }
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

/**
 * Context for AI-generated auto-replies.
 */
export interface InboxReplyContext {
  workspaceId: string;
  platform: PlatformId;
  authorHandle: string;
  authorName?: string;
  body: string;
  campaignName: string;
  template: string;
  locale?: string;
}

const REPLY_SYSTEM_PROMPT = `You write short, polite, on-brand replies to social media comments and DMs.
Rules:
- Keep replies under 280 characters when possible (Twitter-friendly).
- Never use placeholder text like "[Your Brand]" — speak naturally.
- Personalize with the author's handle when relevant (e.g. "Hey @alice").
- Reflect the campaign's tone; do not invent offers or claims.
- If the inbound is hostile or off-topic, reply briefly and redirect.
- Reply in the same language as the inbound message (unless locale dictates otherwise).`;

/**
 * Generate a personalized auto-reply via Groq.
 */
export async function generateInboxReply(
  ctx: InboxReplyContext,
  apiKey: string
): Promise<string> {
  const userPrompt = [
    `Campaign: ${ctx.campaignName}`,
    `Platform: ${ctx.platform}`,
    ctx.locale ? `Locale: ${ctx.locale}` : null,
    `Author handle: ${ctx.authorHandle}`,
    ctx.authorName ? `Author name: ${ctx.authorName}` : null,
    `Inbound: """${ctx.body.slice(0, 1200)}"""`,
    `Template (use as voice anchor, personalize naturally): """${ctx.template.slice(0, 1200)}"""`,
    `Reply (plain text, no quotes, no preamble):`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const res = await callGroq({
      apiKey,
      model: GROQ_TEXT_MODEL,
      messages: [
        { role: "system", content: REPLY_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      maxTokens: 200,
    });
    const cleaned = res.content.replace(/^["'`\s]+|["'`\s]+$/g, "").trim();
    return cleaned.length > 0 ? cleaned.slice(0, 800) : ctx.template;
  } catch {
    return ctx.template;
  }
}
