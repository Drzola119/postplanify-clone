import { z } from "zod";
import { requireCarouselAccess } from "@/lib/carousel-gen/access";
import {
  editableSchema,
  brandSnapshotSchema,
} from "@/lib/carousel-gen/document-schema";
import { normalizeCarousel } from "@/lib/carousel-gen/document-service";
import { renderCarouselSlide } from "@/lib/carousel-gen/render-document";
import { listBrandKits } from "@/lib/carousel-gen/brand-kits";
import { jsonError, jsonOk } from "@/lib/validation/helpers";
export async function POST(request: Request) {
  const session = await requireCarouselAccess(false);
  if (session instanceof Response) return session;
  try {
    const { deck, index } = z
      .object({
        deck: editableSchema
          .omit({ status: true })
          .extend({ brandSnapshot: brandSnapshotSchema.nullable().optional() }),
        index: z.number().int().min(0).max(29),
      })
      .parse(await request.json());
    const document = normalizeCarousel("preview", session.workspaceId, deck);
    document.brandSnapshot =
      deck.brandSnapshot ??
      (deck.brandKitId
        ? (await listBrandKits(session.workspaceId)).find(
            (k) => k.id === deck.brandKitId,
          )
        : undefined);
    const output = await renderCarouselSlide(document, index);
    return jsonOk({
      dataUrl: `data:image/png;base64,${output.png.toString("base64")}`,
      issues: output.issues,
    });
  } catch (e) {
    return jsonError(422, e instanceof Error ? e.message : "Rendering failed");
  }
}
