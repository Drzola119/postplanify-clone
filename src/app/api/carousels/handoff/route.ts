import { z } from "zod";
import { createHash } from "node:crypto";
import { adminDb } from "@/lib/firebase/admin";
import { requireCarouselAccess } from "@/lib/carousel-gen/access";
import { getCarouselDocument } from "@/lib/carousel-gen/document-service";
import { documentId } from "@/lib/carousel-gen/document-schema";
import { renderCarouselSlide } from "@/lib/carousel-gen/render-document";
import { uploadToBunny, BUNNY_CDN_BASE } from "@/lib/bunny";
import { jsonError, jsonOk } from "@/lib/validation/helpers";
export async function GET(request: Request) {
  const s = await requireCarouselAccess();
  if (s instanceof Response) return s;
  if (!adminDb) return jsonError(503, "Database unavailable");
  const id = documentId.safeParse(new URL(request.url).searchParams.get("id"));
  if (!id.success) return jsonError(400, "Invalid handoff");
  const d = (
    await adminDb
      .doc(`workspaces/${s.workspaceId}/carouselHandoffs/${id.data}`)
      .get()
  ).data();
  if (!d || d.status !== "ready") return jsonError(404, "Handoff not ready");
  return jsonOk({ handoff: { id: id.data, ...d } });
}
export async function POST(request: Request) {
  const s = await requireCarouselAccess();
  if (s instanceof Response) return s;
  if (!adminDb) return jsonError(503, "Database unavailable");
  try {
    const b = z
      .object({ carouselId: documentId, revisionId: z.string().max(160) })
      .parse(await request.json());
    const deck = await getCarouselDocument(s.workspaceId, b.carouselId);
    if (!deck || deck.currentRevisionId !== b.revisionId)
      return jsonError(409, "Save and refresh your deck before scheduling");
    if (!deck.caption.trim())
      return jsonError(422, "Add a caption before scheduling");
    if (!BUNNY_CDN_BASE)
      return jsonError(503, "Media storage is not configured");
    const id = createHash("sha256")
      .update(`${deck.id}:${b.revisionId}`)
      .digest("hex");
    const ref = adminDb.doc(
      `workspaces/${s.workspaceId}/carouselHandoffs/${id}`,
    );
    const ready = await adminDb.runTransaction(async (tx) => {
      const old = (await tx.get(ref)).data();
      if (old?.status === "ready") return true;
      if (old?.status === "rendering" && old.startedAt > Date.now() - 180000)
        throw Error("Slides are already being prepared. Retry shortly.");
      tx.set(ref, { status: "rendering", startedAt: Date.now() });
      return false;
    });
    if (ready) return jsonOk({ handoffId: id });
    try {
      const assets = [];
      for (let i = 0; i < deck.slides.length; i++) {
        const output = await renderCarouselSlide(deck, i);
        if (output.issues.length)
          throw Error(`Slide ${i + 1}: ${output.issues.join(" ")}`);
        const uploaded = await uploadToBunny({
          userId: s.uid,
          folder: "posts",
          filename: `${deck.id}-${i + 1}.png`,
          body: output.png,
          contentType: "image/png",
        });
        assets.push({
          id: `${id}_${i}`,
          url: uploaded.cdnUrl,
          storedPath: uploaded.storedPath,
          mime: "image/png",
          size: output.png.length,
          ...deck.dimensions,
        });
      }
      await ref.set({
        status: "ready",
        carouselId: deck.id,
        revisionId: b.revisionId,
        title: deck.title,
        caption: deck.caption,
        platformOverrides: deck.platformOverrides || {},
        assets,
        createdAt: Date.now(),
      });
      return jsonOk({ handoffId: id });
    } catch (e) {
      await ref.set({ status: "failed", failedAt: Date.now() });
      throw e;
    }
  } catch (e) {
    return jsonError(
      422,
      e instanceof Error ? e.message : "Unable to prepare carousel",
    );
  }
}
