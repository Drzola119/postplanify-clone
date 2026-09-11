import "server-only";
import { randomBytes, createHash } from "node:crypto";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { requireCarouselAccess } from "@/lib/carousel-gen/access";
import { normalizeCarousel } from "@/lib/carousel-gen/document-service";
import { documentId } from "@/lib/carousel-gen/document-schema";
import { cleanDocument } from "@/lib/carousel-gen/document-utils";
import { renderCarouselSlide } from "@/lib/carousel-gen/render-document";
import { jsonError, jsonOk } from "@/lib/validation/helpers";
const hash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
async function linkFor(token: string) {
  if (!adminDb || !/^[a-f0-9]{64}$/.test(token))
    throw Error("Invalid review link");
  const ref = adminDb.collection("carouselReviewLinks").doc(hash(token));
  const snap = await ref.get();
  const link = snap.data();
  if (!link || link.revoked || link.expiresAt < Date.now())
    throw Error("Review link has expired or was revoked");
  return { ref, link };
}
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const { link } = await linkFor(params.get("token") || "");
    const deck = normalizeCarousel(
      link.carouselId,
      link.workspaceId,
      link.snapshot,
    );
    if (params.has("slide")) {
      const index = z.coerce
        .number()
        .int()
        .min(0)
        .max(deck.slides.length - 1)
        .parse(params.get("slide"));
      const result = await renderCarouselSlide(deck, index);
      return new Response(new Uint8Array(result.png), {
        headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
      });
    }
    const comments = await adminDb!
      .doc(`workspaces/${link.workspaceId}/carousels/${link.carouselId}`)
      .collection("comments")
      .where("revisionId", "==", link.revisionId)
      .limit(200)
      .get();
    return jsonOk({
      carousel: {
        id: deck.id,
        title: deck.title,
        aspectRatio: deck.aspectRatio,
        slides: deck.slides.map((s) => ({ id: s.id, headline: s.headline })),
        caption: deck.caption,
        currentRevisionId: link.revisionId,
      },
      expiresAt: link.expiresAt,
      comments: comments.docs.map((d) => ({ id: d.id, ...d.data() })),
    });
  } catch (e) {
    return jsonError(
      400,
      e instanceof Error ? e.message : "Review unavailable",
    );
  }
}
const actionSchema = z.object({
  action: z.enum([
    "generate_token",
    "revoke_token",
    "add_comment",
    "resolve_comment",
    "reopen_comment",
    "approve",
    "request_changes",
  ]),
  carouselId: documentId,
  revisionId: z.string().max(160).optional(),
  token: z.string().max(128).optional(),
  slideId: documentId.nullable().optional(),
  content: z.string().trim().min(1).max(2000).optional(),
  commentId: documentId.optional(),
  guestName: z.string().trim().min(1).max(100).optional(),
  guestEmail: z.string().email().optional(),
  notes: z.string().max(1000).optional(),
});
export async function POST(request: Request) {
  if (!adminDb) return jsonError(503, "Database unavailable");
  try {
    const body = actionSchema.parse(await request.json());
    if (body.action === "generate_token" || body.action === "revoke_token") {
      const session = await requireCarouselAccess();
      if (session instanceof Response) return session;
      const ref = adminDb.doc(
        `workspaces/${session.workspaceId}/carousels/${body.carouselId}`,
      );
      const token = randomBytes(32).toString("hex");
      await adminDb.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists) throw Error("Carousel not found");
        const deck = normalizeCarousel(
          body.carouselId,
          session.workspaceId,
          snap.data()!,
        );
        if (
          body.action === "generate_token" &&
          body.revisionId !== deck.currentRevisionId
        )
          throw Error("Save your latest revision before sharing");
        if (deck.activeReviewToken)
          tx.set(
            adminDb!
              .collection("carouselReviewLinks")
              .doc(hash(deck.activeReviewToken)),
            { revoked: true },
            { merge: true },
          );
        if (body.action === "generate_token") {
          const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
          tx.set(
            adminDb!.collection("carouselReviewLinks").doc(hash(token)),
            cleanDocument({
              workspaceId: session.workspaceId,
              carouselId: deck.id,
              revisionId: deck.currentRevisionId,
              expiresAt,
              revoked: false,
              snapshot: deck,
            }),
          );
          tx.update(ref, {
            activeReviewToken: token,
            reviewRevisionId: deck.currentRevisionId,
            reviewExpiresAt: expiresAt,
            reviewStatus: "in_review",
          });
        } else
          tx.update(ref, {
            activeReviewToken: null,
            reviewExpiresAt: null,
            reviewRevisionId: null,
          });
      });
      return jsonOk({
        activeReviewToken: body.action === "generate_token" ? token : null,
      });
    }
    const { ref: linkRef, link } = await linkFor(body.token || "");
    if (
      body.carouselId !== link.carouselId ||
      body.revisionId !== link.revisionId
    )
      return jsonError(409, "Review revision does not match");
    const carousel = adminDb.doc(
      `workspaces/${link.workspaceId}/carousels/${link.carouselId}`,
    );
    if (
      body.slideId &&
      !link.snapshot.slides.some((s: { id: string }) => s.id === body.slideId)
    )
      return jsonError(400, "Slide not found");
    const commentRef = body.commentId
      ? carousel.collection("comments").doc(body.commentId)
      : carousel.collection("comments").doc();
    await adminDb.runTransaction(async (tx) => {
      const currentLink = await tx.get(linkRef);
      if (
        currentLink.data()?.revoked ||
        currentLink.data()!.expiresAt < Date.now()
      )
        throw Error("Review link expired");
      const current = await tx.get(carousel);
      if (!current.exists) throw Error("Carousel not found");
      if (
        ["approve", "request_changes"].includes(body.action) &&
        current.data()!.currentRevisionId !== body.revisionId
      )
        throw Error(
          "This deck has changed. Ask the creator for a new review link.",
        );
      if (body.action === "add_comment") {
        if (!body.content || !body.guestName)
          throw Error("Enter your name and comment");
        tx.set(
          commentRef,
          cleanDocument({
            slideId: body.slideId ?? null,
            revisionId: link.revisionId,
            author: { name: body.guestName, isGuest: true },
            content: body.content,
            resolved: false,
            createdAt: Date.now(),
          }),
        );
      } else if (["resolve_comment", "reopen_comment"].includes(body.action)) {
        const comment = await tx.get(commentRef);
        if (comment.data()?.revisionId !== link.revisionId)
          throw Error("Comment not found");
        tx.update(commentRef, {
          resolved: body.action === "resolve_comment",
          resolvedAt: Date.now(),
        });
      } else if (body.action === "approve") {
        if (!body.guestName) throw Error("Enter your name");
        const approval = {
          approvedBy: "guest",
          reviewerName: body.guestName,
          approvedAt: Date.now(),
          revisionId: link.revisionId,
          notes: body.notes || "",
        };
        tx.update(carousel, { reviewStatus: "approved", approval });
        tx.set(
          carousel.collection("revisions").doc(link.revisionId),
          { approval },
          { merge: true },
        );
      } else if (body.action === "request_changes")
        tx.update(carousel, {
          reviewStatus: "changes_requested",
          approval: null,
        });
    });
    return jsonOk({ success: true, commentId: commentRef.id });
  } catch (e) {
    return jsonError(
      400,
      e instanceof Error ? e.message : "Review action failed",
    );
  }
}
