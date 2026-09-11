import { z } from "zod";
import { requireCarouselAccess } from "@/lib/carousel-gen/access";
import { documentId } from "@/lib/carousel-gen/document-schema";
import { updateCarouselDocument } from "@/lib/carousel-gen/document-service";
import { jsonError, jsonOk } from "@/lib/validation/helpers";
export async function POST(request: Request) {
  const s = await requireCarouselAccess();
  if (s instanceof Response) return s;
  try {
    const { carouselId } = z
      .object({ carouselId: documentId })
      .parse(await request.json());
    const r = await updateCarouselDocument({
      workspaceId: s.workspaceId,
      uid: s.uid,
      carouselId,
      updates: { status: "archived" },
    });
    return r.success
      ? jsonOk({ carouselId })
      : jsonError(404, "Carousel not found");
  } catch {
    return jsonError(400, "Could not archive carousel");
  }
}
