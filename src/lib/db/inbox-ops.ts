import "server-only";
import { createHash } from "node:crypto";
import { adminDb } from "@/lib/db";
import type { OutboundOpDoc, OutboundOpKind, OutboundOpStatus, PlatformId } from "@/lib/db/schema";

/**
 * Durable outbound-operation store (spec §7).
 * One authoritative execution path: create-or-reuse by idempotency key,
 * claim processing, then finalize exactly once.
 */

function opsCollection(workspaceId: string) {
  if (!adminDb) throw new Error("adminDb not configured");
  return adminDb.collection(`workspaces/${workspaceId}/outboundOps`);
}

export function buildIdempotencyKey(input: {
  kind: OutboundOpKind;
  accountKey: string;
  platform: string;
  targetId: string;
  body?: string;
}): string {
  const bodyHash = createHash("sha256").update(input.body ?? "").digest("hex").slice(0, 16);
  return `${input.kind}:${input.accountKey}:${input.platform}:${input.targetId}:${bodyHash}`;
}

export interface CreateOpInput {
  kind: OutboundOpKind;
  platform: PlatformId;
  accountKey: string;
  targetId: string;
  providerTargetId?: string;
  body?: string;
  origin: OutboundOpDoc["origin"];
  createdBy: string;
}

/** Create the op if absent, else return the existing one (double-click safe). */
export async function getOrCreateOp(
  workspaceId: string,
  input: CreateOpInput
): Promise<{ id: string; op: OutboundOpDoc; created: boolean }> {
  const coll = opsCollection(workspaceId);
  const idempotencyKey = buildIdempotencyKey({
    kind: input.kind,
    accountKey: input.accountKey,
    platform: input.platform,
    targetId: input.targetId,
    body: input.body,
  });
  // Keep compatibility with operations written before deterministic IDs were
  // introduced, but use a stable document id for all new operations. This
  // removes the read-then-create race between two concurrent submissions.
  const existing = await coll.where("idempotencyKey", "==", idempotencyKey).limit(1).get();
  if (existing.docs.length > 0) {
    const d = existing.docs[0];
    return { id: d.id, op: d.data() as OutboundOpDoc, created: false };
  }
  const now = new Date();
  const doc: OutboundOpDoc = {
    idempotencyKey,
    kind: input.kind,
    platform: input.platform,
    accountKey: input.accountKey,
    targetId: input.targetId,
    providerTargetId: input.providerTargetId,
    body: input.body,
    status: "pending",
    origin: input.origin,
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  };
  const deterministicId = `op-${createHash("sha256").update(idempotencyKey).digest("hex")}`;
  const ref = coll.doc(deterministicId);
  const result = await adminDb!.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists) {
      return { op: snap.data() as OutboundOpDoc, created: false };
    }
    tx.set(ref, doc);
    return { op: doc, created: true };
  });
  return { id: ref.id, op: result.op, created: result.created };
}

/**
 * Claim an op for execution. Only `pending` (or a stale `processing`) op can
 * be claimed — concurrent workers / double submits lose the race instead of
 * sending twice.
 */
export async function claimOp(
  workspaceId: string,
  opId: string,
  staleAfterMs = 5 * 60 * 1000
): Promise<boolean> {
  const ref = opsCollection(workspaceId).doc(opId);
  return adminDb!.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return false;
    const op = snap.data() as OutboundOpDoc;
    const updatedAt = op.updatedAt instanceof Date ? op.updatedAt.getTime() : Date.now();
    if (op.status !== "pending" && !(op.status === "processing" && Date.now() - updatedAt > staleAfterMs)) {
      return false;
    }
    tx.update(ref, { status: "processing", updatedAt: new Date() });
    return true;
  });
}

export async function finalizeOp(
  workspaceId: string,
  opId: string,
  patch:
    | { status: "sent"; providerMessageId?: string; providerRecipientId?: string }
    | { status: "failed" | "delivery-unknown" | "cancelled"; error?: { code: string; message: string; retryable: boolean } }
): Promise<void> {
  await opsCollection(workspaceId).doc(opId).update({ ...patch, updatedAt: new Date() });
}

export async function getOp(
  workspaceId: string,
  opId: string
): Promise<(OutboundOpDoc & { id: string }) | null> {
  const snap = await opsCollection(workspaceId).doc(opId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...(snap.data() as OutboundOpDoc) };
}

export function toHttpStatus(status: OutboundOpStatus): number {
  switch (status) {
    case "sent":
      return 201;
    case "delivery-unknown":
      return 202;
    case "failed":
      return 502;
    default:
      return 200;
  }
}
