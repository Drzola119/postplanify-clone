import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/firebase/admin";
import { sentimentSchema } from "@/lib/validation/ai";
import { MissingServerSecretError, resolvers } from "@/lib/security/server-config";
import { callGroq, extractJson, GROQ_TEXT_MODEL, GroqError } from "@/lib/ai/groq";
import { parseBody, jsonError, jsonOk } from "@/lib/validation/helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT =
  "You classify the sentiment of a social-media comment. " +
  "Return ONLY JSON of the form {\"sentiment\": \"positive\"|\"neutral\"|\"negative\", \"score\": -1..1, \"reason\": \"<short>\"}. " +
  "Score is your confidence-weighted sentiment on a -1..1 axis.";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await parseBody(request, sentimentSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid payload", parsed.error?.issues);
  }

  let apiKey: string;
  try {
    apiKey = resolvers.groqApiKey(request.headers);
  } catch (err) {
    if (err instanceof MissingServerSecretError) {
      return NextResponse.json({ error: `${err.secret} is not configured` }, { status: 500 });
    }
    throw err;
  }

  const userPrompt = `Classify the sentiment of this comment:\n\n${parsed.data.text.slice(0, 3000)}`;

  try {
    const result = await callGroq({
      apiKey,
      model: GROQ_TEXT_MODEL,
      jsonMode: true,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      maxTokens: 120,
      temperature: 0.3,
    });
    const obj = extractJson<{ sentiment?: string; score?: number; reason?: string }>(result.content);
    const sentiment = obj?.sentiment === "positive" || obj?.sentiment === "negative" ? obj.sentiment : "neutral";
    const score = typeof obj?.score === "number" ? Math.max(-1, Math.min(1, obj.score)) : 0;
    const reason = typeof obj?.reason === "string" ? obj.reason.slice(0, 200) : "";
    return jsonOk({ sentiment, score, reason, model: result.model });
  } catch (err) {
    if (err instanceof GroqError) {
      return NextResponse.json({ error: err.message }, { status: err.status >= 500 ? 502 : 400 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI request failed" },
      { status: 502 }
    );
  }
}
