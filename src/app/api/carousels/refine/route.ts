import { z } from "zod";
import { requireCarouselAccess } from "@/lib/carousel-gen/access";
import { slideSchema } from "@/lib/carousel-gen/document-schema";
import { carouselAi } from "@/lib/carousel-gen/ai-actions";
import { resolvers } from "@/lib/security/server-config";
import { jsonError, jsonOk } from "@/lib/validation/helpers";
export async function POST(request: Request) {
  const session = await requireCarouselAccess();
  if (session instanceof Response) return session;
  try {
    const body = z
      .object({
        slide: slideSchema,
        action: z.enum(["rewrite", "shorten", "punch_up", "translate", "cta"]),
        targetLanguage: z.enum(["en", "ar", "fr", "es", "de"]).optional(),
      })
      .parse(await request.json());
    if (body.slide.isLocked)
      return jsonError(409, "Unlock this slide before editing");
    if (body.action === "translate" && !body.targetLanguage)
      return jsonError(400, "Choose a target language");
    const schema = z.object({
      headline: z.string().max(500),
      body: z.string().max(4000),
      subheadline: z.string().max(500).optional(),
      quoteAuthor: z.string().max(200).optional(),
      statsValue: z.string().max(80).optional(),
      statsLabel: z.string().max(300).optional(),
      bulletPoints: z.array(z.string().max(500)).max(15).optional(),
      comparisonItems: z
        .array(
          z.object({ left: z.string().max(500), right: z.string().max(500) }),
        )
        .max(10)
        .optional(),
    });
    const text = await carouselAi(
      session.workspaceId,
      resolvers.groqApiKey(request.headers) || "",
      `Perform the requested copy edit. Translate all supplied text into the target language when translating. Punch up means strengthen the specific hook, not add a generic prefix. CTA means suggest a specific next step without inventing an offer. Return headline, body, subheadline and every supplied quoteAuthor, statsValue, statsLabel, bulletPoints and comparisonItems text field; translate all of them when requested.`,
      body,
      schema,
    );
    return jsonOk({
      slide: {
        ...body.slide,
        ...text,
        ...(body.action === "translate"
          ? { textAlign: body.targetLanguage === "ar" ? "right" : "left" }
          : {}),
      },
    });
  } catch (e) {
    return jsonError(
      422,
      e instanceof Error ? e.message : "AI refinement failed",
    );
  }
}
