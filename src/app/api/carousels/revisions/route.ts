import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { requireCarouselAccess } from "@/lib/carousel-gen/access";
import { documentId, editableSchema } from "@/lib/carousel-gen/document-schema";
import { updateCarouselDocument } from "@/lib/carousel-gen/document-service";
import { jsonError, jsonOk } from "@/lib/validation/helpers";

export async function GET(request: Request) {
  const s = await requireCarouselAccess(false);
  if (s instanceof Response) return s;
  if (!adminDb) return jsonError(503, "Database unavailable");
  try {
    const params = new URL(request.url).searchParams;
    const id = documentId.parse(params.get("carouselId"));
    const revisions = adminDb.collection(
      `workspaces/${s.workspaceId}/carousels/${id}/revisions`,
    );
    let query = revisions.orderBy("createdAt", "desc").limit(30);
    const cursor = params.get("cursor");
    if (cursor) {
      const snapshot = await revisions.doc(documentId.parse(cursor)).get();
      if (!snapshot.exists) return jsonError(400, "Invalid history cursor");
      query = query.startAfter(snapshot);
    }
    const result = await query.get();
    return jsonOk({
      items: result.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          number: data.revisionNumber,
          label: data.label,
          createdAt:
            typeof data.createdAt === "number"
              ? data.createdAt
              : (data.createdAt?.toMillis?.() ?? 0),
          slideCount: data.slides?.length ?? 0,
          reviewStatus: data.reviewStatus,
        };
      }),
      nextCursor: result.size === 30 ? result.docs.at(-1)!.id : null,
    });
  } catch {
    return jsonError(400, "Could not load revision history");
  }
}

export async function POST(request: Request) {
  const s = await requireCarouselAccess();
  if (s instanceof Response) return s;
  if (!adminDb) return jsonError(503, "Database unavailable");
  try {
    const b = z
      .object({
        carouselId: documentId,
        revisionId: documentId,
        expectedRevisionId: documentId,
      })
      .parse(await request.json());
    const snapshot = await adminDb
      .collection(
        `workspaces/${s.workspaceId}/carousels/${b.carouselId}/revisions`,
      )
      .doc(b.revisionId)
      .get();
    if (!snapshot.exists) return jsonError(404, "Revision not found");
    const updates = editableSchema
      .omit({ status: true, folderId: true, campaignId: true, tags: true })
      .parse(snapshot.data());
    const result = await updateCarouselDocument({
      workspaceId: s.workspaceId,
      carouselId: b.carouselId,
      uid: s.uid,
      expectedRevisionId: b.expectedRevisionId,
      createRevision: true,
      revisionLabel: `Restored revision ${snapshot.data()!.revisionNumber}`,
      updates: {
        ...updates,
        brandSnapshot: snapshot.data()!.brandSnapshot ?? null,
      },
    });
    if (!result.success)
      return jsonError(
        result.error === "conflict" ? 409 : 400,
        result.error || "Restore failed",
      );
    return jsonOk({ carousel: result.document });
  } catch {
    return jsonError(400, "Could not restore revision");
  }
}
