import "server-only";
import type { PlatformId } from "@/lib/db/schema";
import { callGroq, extractJson, GROQ_TEXT_MODEL, GroqError } from "./groq";
import { createLogger } from "@/lib/log";

const log = createLogger("inbox-analysis");

export type InboxSentiment = "positive" | "neutral" | "negative";
export type InboxIntent =
  | "support"
  | "sales"
  | "feedback"
  | "spam"
  | "other";

export interface InboxAnalysisInput {
  platform: PlatformId;
  body: string;
  authorHandle: string;
}

export interface InboxAnalysisResult {
  sentiment: InboxSentiment;
  intent: InboxIntent;
  topics: string[];
}

interface RawAnalysisJson {
  sentiment?: string;
  intent?: string;
  topics?: unknown;
}

const SENTIMENTS: InboxSentiment[] = ["positive", "neutral", "negative"];
const INTENTS: InboxIntent[] = ["support", "sales", "feedback", "spam", "other"];

const ANALYSIS_SYSTEM_PROMPT = `You classify short social media messages (comments + DMs).
Always respond with a single JSON object matching this schema:
{
  "sentiment": "positive" | "neutral" | "negative",
  "intent":    "support" | "sales" | "feedback" | "spam" | "other",
  "topics":    string[]   // 1-5 lowercase keywords, no punctuation
}
No prose. No markdown fences. JSON only.`;

/**
 * Classify an inbound message via Groq. Returns null on API failure
 * (the caller should not crash on a missing analysis — just leave
 * the inbox record's sentiment unset and try again next tick).
 */
export async function analyzeInboxMessage(
  input: InboxAnalysisInput,
  apiKey: string,
): Promise<InboxAnalysisResult | null> {
  if (!input.body?.trim()) return null;
  const userPrompt = `Platform: ${input.platform}\nAuthor: ${input.authorHandle}\nMessage: """${input.body.slice(0, 1500)}"""`;

  let content: string;
  try {
    const res = await callGroq({
      apiKey,
      model: GROQ_TEXT_MODEL,
      messages: [
        { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      maxTokens: 120,
      jsonMode: true,
    });
    content = res.content;
  } catch (err) {
    if (err instanceof GroqError) {
      log.warn("groq analysis failed", { status: err.status, err: err.message });
    } else {
      log.warn("groq analysis error", { err: (err as Error).message });
    }
    return null;
  }

  const parsed = extractJson<RawAnalysisJson>(content);
  if (!parsed) {
    log.warn("groq analysis returned non-JSON", { content: content.slice(0, 200) });
    return null;
  }

  const sentiment = SENTIMENTS.includes(parsed.sentiment as InboxSentiment)
    ? (parsed.sentiment as InboxSentiment)
    : "neutral";
  const intent = INTENTS.includes(parsed.intent as InboxIntent)
    ? (parsed.intent as InboxIntent)
    : "other";
  const topics = Array.isArray(parsed.topics)
    ? parsed.topics
        .filter((t): t is string => typeof t === "string")
        .map((t) => t.toLowerCase().trim().replace(/[^a-z0-9-]+/g, ""))
        .filter((t) => t.length > 0 && t.length <= 32)
        .slice(0, 5)
    : [];

  return { sentiment, intent, topics };
}