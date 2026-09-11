import { requireCarouselAccess } from "@/lib/carousel-gen/access";
import { getCarouselDocument } from "@/lib/carousel-gen/document-service";
import { templateDocument } from "@/lib/carousel-gen/templates";
import { renderCarouselSlide } from "@/lib/carousel-gen/render-document";
import { jsonError } from "@/lib/validation/helpers";
import { documentId } from "@/lib/carousel-gen/document-schema";
export async function GET(request: Request) {
  const session = await requireCarouselAccess(false);
  if (session instanceof Response) return session;
  try {
    const p = new URL(request.url).searchParams;
    const doc = p.has("template")
      ? templateDocument(documentId.parse(p.get("template")))
      : await getCarouselDocument(
          session.workspaceId,
          documentId.parse(p.get("id")),
        );
    if (!doc) return jsonError(404, "Carousel not found");
    const index = Number(p.get("slide") || 0);
    if (!Number.isInteger(index) || index < 0 || index >= doc.slides.length)
      return jsonError(400, "Slide not found");
    const result = await renderCarouselSlide(doc, index);
    return new Response(new Uint8Array(result.png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, max-age=30",
      },
    });
  } catch (e) {
    return jsonError(
      400,
      e instanceof Error ? e.message : "Preview unavailable",
    );
  }
}
