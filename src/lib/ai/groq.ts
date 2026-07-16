import "server-only";
import type { PlatformId } from "@/lib/db/schema";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

export const GROQ_TEXT_MODEL = "llama-3.3-70b-versatile";
export const GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

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

export async function callGroq(opts: GroqOptions): Promise<GroqResult> {
  const body: Record<string, unknown> = {
    model: opts.model,
    messages: opts.messages,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 600,
    top_p: opts.topP ?? 0.95,
    stream: false,
  };
  if (opts.jsonMode) body.response_format = { type: "json_object" };

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

  const content = data.choices?.[0]?.message?.content?.trim() ?? "";
  if (!content) {
    throw new GroqError("Empty completion from Groq", 502, data);
  }

  return { content, model: opts.model, raw: data };
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
 * Context for AI-generated auto-replies. The campaign template is the
 * voice anchor; the AI can rephrase and personalize around it without
 * going off-script.
 */
export interface InboxReplyContext {
  /** Workspace id (for logging, not used for personalization). */
  workspaceId: string;
  /** Platform id ("twitter" / "instagram" / etc). */
  platform: PlatformId;
  /** Author handle of the inbound message author. */
  authorHandle: string;
  /** Author display name if known. */
  authorName?: string;
  /** Inbound message body. */
  body: string;
  /** Campaign that triggered the reply. */
  campaignName: string;
  /** Static template configured on the campaign. AI personalizes around this. */
  template: string;
  /** Workspace locale (BCP-47 like "en-US", "fr-FR"). Optional — falls back to English. */
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
 * Generate a personalized auto-reply via Groq. Falls back to the raw
 * template on API failure so we still send *something* — better than
 * dropping the reply.
 */
export async function generateInboxReply(
  ctx: InboxReplyContext,
  apiKey: string,
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
