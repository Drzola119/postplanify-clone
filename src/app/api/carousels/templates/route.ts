import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { requireCarouselAccess } from "@/lib/carousel-gen/access";
import {
  getCarouselDocument,
  createCarouselDraft,
} from "@/lib/carousel-gen/document-service";
import { templateDocument } from "@/lib/carousel-gen/templates";
import { documentId } from "@/lib/carousel-gen/document-schema";
import { cleanDocument } from "@/lib/carousel-gen/document-utils";
import { jsonError, jsonOk } from "@/lib/validation/helpers";
import type { CarouselDocument } from "@/lib/carousel-gen/types";
export async function GET() {
  const s = await requireCarouselAccess(false);
  if (s instanceof Response) return s;
  if (!adminDb) return jsonError(503, "Database unavailable");
  const snap = await adminDb
    .collection(`workspaces/${s.workspaceId}/carouselTemplates`)
    .get();
  return jsonOk({
    templates: snap.docs.map((d) => ({ id: d.id, name: d.data().title })),
  });
}
export async function POST(request: Request) {
  const s = await requireCarouselAccess();
  if (s instanceof Response) return s;
  if (!adminDb) return jsonError(503, "Database unavailable");
  try {
    const b = z
      .object({
        action: z.enum(["save", "use", "delete"]),
        carouselId: documentId.optional(),
        templateId: documentId.optional(),
        workspaceTemplate: z.boolean().optional(),
      })
      .parse(await request.json());
    const collection = adminDb.collection(
      `workspaces/${s.workspaceId}/carouselTemplates`,
    );
    if (b.action === "delete") {
      if (!b.templateId) throw Error("Template required");
      await collection.doc(b.templateId).delete();
      return jsonOk({ success: true });
    }
    if (b.action === "save") {
      const doc = await getCarouselDocument(s.workspaceId, b.carouselId || "");
      if (!doc) throw Error("Carousel not found");
      const ref = collection.doc();
      await ref.set(cleanDocument({ ...doc, createdAt: Date.now() }));
      return jsonOk({ templateId: ref.id });
    }
    const source = b.workspaceTemplate
      ? ((await collection.doc(b.templateId || "").get()).data() as
          CarouselDocument | undefined)
      : templateDocument(b.templateId || "");
    if (!source) throw Error("Template not found");
    const doc = await createCarouselDraft({
      workspaceId: s.workspaceId,
      uid: s.uid,
      title: source.title,
      aspectRatio: source.aspectRatio,
      style: source.style,
      slides: source.slides.map((slide, index) => ({
        ...slide,
        id: `sld_${crypto.randomUUID()}`,
        index,
      })),
      tags: source.tags,
      caption: source.caption,
      brandKitId: source.brandKitId,
      brandSnapshot: source.brandSnapshot,
      platformOverrides: source.platformOverrides,
      showSlideNumbers: source.showSlideNumbers,
    });
    return jsonOk({ carouselId: doc.id });
  } catch (e) {
    return jsonError(
      400,
      e instanceof Error ? e.message : "Template action failed",
    );
  }
}
