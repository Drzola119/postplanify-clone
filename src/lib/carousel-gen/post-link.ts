import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { canWrite, getWorkspaceRole } from "@/lib/auth/workspace-role";
import { cleanDocument } from "./document-utils";
import { documentId } from "./document-schema";
/** Atomically creates one post per handoff and links its immutable assets to the deck. */
export async function createLinkedCarouselPost(
  workspaceId: string,
  uid: string,
  handoffId: string,
  payload: Record<string, unknown>,
): Promise<string> {
  if (!adminDb) throw Error("Database unavailable");
  if (!canWrite(await getWorkspaceRole(workspaceId, uid)))
    throw Error("Forbidden");
  documentId.parse(handoffId);
  const handoffRef = adminDb.doc(
    `workspaces/${workspaceId}/carouselHandoffs/${handoffId}`,
  );
  const postRef = adminDb.doc(
    `workspaces/${workspaceId}/posts/carousel_${handoffId}`,
  );
  return adminDb.runTransaction(async (tx) => {
    const handoff = (await tx.get(handoffRef)).data();
    if (!handoff || handoff.status !== "ready")
      throw Error("Carousel assets are not ready");
    const deckRef = adminDb!.doc(
      `workspaces/${workspaceId}/carousels/${handoff.carouselId}`,
    );
    const deck = (await tx.get(deckRef)).data();
    if (!deck) throw Error("Carousel not found");
    if (deck.currentRevisionId !== handoff.revisionId)
      throw Error(
        "This deck has changed. Prepare its latest revision in Carousel Studio before publishing.",
      );
    const workspace = (
      await tx.get(adminDb!.doc(`workspaces/${workspaceId}`))
    ).data();
    const existing = await tx.get(postRef);
    if (existing.exists)
      throw Error(
        `This carousel revision was already submitted. Open post ${postRef.id} to check its status; retry failed destinations from that post.`,
      );
    if (
      workspace?.carouselApprovalRequired &&
      deck.approval?.revisionId !== handoff.revisionId
    )
      throw Error("This revision requires approval before publishing");
    const urls = handoff.assets.map((a: { url: string }) => a.url);
    if (JSON.stringify(payload.mediaUrls) !== JSON.stringify(urls))
      throw Error(
        "The ordered carousel assets changed. Prepare a new revision in Carousel Studio.",
      );
    tx.set(
      postRef,
      cleanDocument({
        ...payload,
        carouselId: handoff.carouselId,
        carouselRevisionId: handoff.revisionId,
        carouselHandoffId: handoffId,
      }),
    );
    tx.update(handoffRef, { postId: postRef.id });
    tx.update(deckRef, {
      postId: postRef.id,
      mediaUrls: urls,
      ...(payload.status === "scheduled"
        ? { status: "scheduled", scheduledAt: payload.scheduledAt }
        : {}),
      scheduling: {
        postId: postRef.id,
        revisionId: handoff.revisionId,
        platforms: payload.platforms,
        status: payload.status === "scheduled" ? "scheduled" : "idle",
      },
    });
    return postRef.id;
  });
}
