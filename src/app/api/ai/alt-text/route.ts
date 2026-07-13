import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/firebase/admin";
import { altTextSchema } from "@/lib/validation/ai";
import { MissingServerSecretError, resolvers } from "@/lib/security/server-config";
import { callGroq, GROQ_VISION_MODEL, GroqError } from "@/lib/ai/groq";
import { parseBody, jsonError, jsonOk } from "@/lib/validation/helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT =
  "You describe images for accessibility (alt text). Write a single short paragraph " +
  "that conveys the most important visual information for a screen reader user. " +
  "Never start with 'The image...', 'This image...', or 'Shown here...'. " +
  "Mention concrete subjects, actions, and context (text, scene, mood) only when relevant.";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await parseBody(request, altTextSchema);
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

  const toneHint: Record<string, string> = {
    concise: "Keep it under 25 words, 1 sentence.",
    detailed: "Cover subjects, setting, text, and mood. 2-3 sentences.",
    accessible: "Prioritize functional context for screen readers. 1-2 sentences, plain language.",
  };
  const tone: "concise" | "detailed" | "accessible" = parsed.data.tone ?? "concise";
  const extra = parsed.data.context ? `\nContext: ${parsed.data.context.slice(0, 400)}` : "";
  const userText = `Describe this image for alt text. ${toneHint[tone]}${extra}`;

  try {
    const result = await callGroq({
      apiKey,
      model: GROQ_VISION_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: userText.slice(0, 800) },
            { type: "image_url", image_url: { url: parsed.data.imageUrl } },
          ],
        },
      ],
      maxTokens: 220,
      temperature: 0.4,
    });
    return jsonOk({ altText: result.content, model: result.model });
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
