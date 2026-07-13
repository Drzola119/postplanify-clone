import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/firebase/admin";
import { hashtagSuggestionSchema } from "@/lib/validation/ai";
import { MissingServerSecretError, resolvers } from "@/lib/security/server-config";
import { callGroq, extractJson, GROQ_TEXT_MODEL, GroqError } from "@/lib/ai/groq";
import { parseBody, jsonError, jsonOk } from "@/lib/validation/helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT =
  "You generate social-media hashtags. Given a caption and (optionally) target platforms, " +
  "return a JSON object of the form {\"hashtags\": [\"#tag1\", \"#tag2\", ...]}. " +
  "Rules: no preamble, no markdown fence, no commentary. Tags must start with '#'. " +
  "Mix broad reach with niche relevance. Avoid banned/over-saturated tags unless specifically relevant.";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await parseBody(request, hashtagSuggestionSchema);
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

  const platformHint = parsed.data.platforms?.length
    ? `Target platforms: ${parsed.data.platforms.join(", ")}.`
    : "Target platforms: general social.";
  const localeHint = parsed.data.locale ? `Locale: ${parsed.data.locale}.` : "";
  const userPrompt = [
    `Generate ${parsed.data.count} hashtags for this caption:`,
    "",
    parsed.data.caption.slice(0, 4000),
    "",
    platformHint,
    localeHint,
  ].join("\n");

  try {
    const result = await callGroq({
      apiKey,
      model: GROQ_TEXT_MODEL,
      jsonMode: true,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      maxTokens: 400,
      temperature: 0.8,
    });
    const parsed2 = extractJson<{ hashtags: unknown }>(result.content);
    const hashtags = Array.isArray(parsed2?.hashtags)
      ? parsed2.hashtags
          .map((h) => String(h).trim())
          .filter((h) => h.startsWith("#") && h.length <= 64)
          .slice(0, parsed.data.count)
      : [];
    return jsonOk({ hashtags, model: result.model });
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
