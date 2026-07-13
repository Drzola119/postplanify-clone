import "server-only";

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
