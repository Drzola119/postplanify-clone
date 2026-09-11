import { z } from "zod";
import { requireCarouselAccess } from "@/lib/carousel-gen/access";
import { documentId } from "@/lib/carousel-gen/document-schema";
import { getCarouselDocument } from "@/lib/carousel-gen/document-service";
import { carouselAi } from "@/lib/carousel-gen/ai-actions";
import { resolvers } from "@/lib/security/server-config";
import { jsonError, jsonOk } from "@/lib/validation/helpers";
export async function POST(request: Request) {
  const session = await requireCarouselAccess();
  if (session instanceof Response) return session;
  try {
    const b = z
      .object({
        carouselId: documentId,
        revisionId: documentId,
        language: z.enum(["en", "ar", "fr"]).default("en"),
      })
      .parse(await request.json());
    const deck = await getCarouselDocument(session.workspaceId, b.carouselId);
    if (!deck || deck.currentRevisionId !== b.revisionId)
      return jsonError(
        409,
        "Save your latest deck before generating a caption",
      );
    const result = await carouselAi(
      session.workspaceId,
      resolvers.groqApiKey(request.headers) || "",
      'Write a concise social caption for the supplied carousel in the requested language. Include a relevant hook and a clear next step. Do not invent offers or numerical claims. Return {"caption":"..."}.',
      {
        title: deck.title,
        slides: deck.slides.map((s) => ({
          headline: s.headline,
          body: s.body,
        })),
        language: b.language,
      },
      z.object({ caption: z.string().min(1).max(3000) }),
    );
    return jsonOk(result);
  } catch (e) {
    return jsonError(
      422,
      e instanceof Error ? e.message : "Caption generation failed",
    );
  }
}
