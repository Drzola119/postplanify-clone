import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import {
  requireSession,
  type SessionContext,
} from "@/lib/auth/session-context";
import {
  canWrite,
  canManage,
  type WorkspaceRole,
} from "@/lib/auth/workspace-role";
import {
  documentSchema,
  identifier,
  type Project,
  type StudioDocument,
} from "./document";
import { z } from "zod";
import { createHash } from "node:crypto";

export class StudioError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function db() {
  if (!adminDb)
    throw new StudioError(
      503,
      "Database unavailable. Please refresh when service is restored.",
    );
  return adminDb;
}
export async function access(
  write = false,
  manage = false,
): Promise<SessionContext | Response> {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const member = await db()
    .doc(`workspaces/${session.workspaceId}/members/${session.uid}`)
    .get();
  const role = member.data()?.role as WorkspaceRole | undefined;
  if (
    !role ||
    !["owner", "admin", "editor", "viewer"].includes(role) ||
    (write && !canWrite(role)) ||
    (manage && !canManage(role))
  )
    throw new StudioError(
      403,
      "You do not have permission for this workspace action.",
    );
  return session;
}
export async function route(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (e) {
    const status =
      e instanceof StudioError
        ? e.status
        : e instanceof z.ZodError || e instanceof SyntaxError
          ? 400
          : 503;
    const message =
      e instanceof StudioError
        ? e.message
        : status === 400
          ? "Invalid studio request. Check the content and required fields."
          : "Studio storage is unavailable. Your current work has been preserved; try again manually.";
    if (status === 503) console.error("[infographic-studio]", e);
    return Response.json({ error: { message } }, { status });
  }
}
export function projectRef(workspaceId: string, id: string) {
  return db().doc(
    `workspaces/${workspaceId}/infographicProjects/${identifier.parse(id)}`,
  );
}
export async function readProject(
  workspaceId: string,
  id: string,
): Promise<Project> {
  const snap = await projectRef(workspaceId, id).get();
  if (!snap.exists) throw new StudioError(404, "Project not found.");
  return { ...snap.data(), id: snap.id } as Project;
}
export async function validateAssets(
  workspaceId: string,
  document: StudioDocument,
) {
  for (const id of [document.brand.logoAssetId, document.artworkAssetId].filter(
    Boolean,
  )) {
    const snap = await db()
      .doc(`workspaces/${workspaceId}/mediaAssets/${identifier.parse(id)}`)
      .get();
    if (
      !snap.exists ||
      snap.data()?.deletedAt ||
      !/^image\/(png|jpeg|webp)$/.test(snap.data()?.mime ?? "")
    )
      throw new StudioError(
        400,
        "Select an available PNG, JPEG, or WebP asset from this workspace.",
      );
  }
}
export async function saveProject(
  session: SessionContext,
  input: { id?: string; revision?: number; document: StudioDocument },
): Promise<Project> {
  const document = documentSchema.parse(input.document);
  await validateAssets(session.workspaceId, document);
  const ref = input.id
    ? projectRef(session.workspaceId, input.id)
    : db()
        .collection(`workspaces/${session.workspaceId}/infographicProjects`)
        .doc();
  const now = new Date().toISOString();
  return db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const old = snap.data() as Project | undefined;
    if (input.id && !old) throw new StudioError(404, "Project not found.");
    if (old && old.revision !== input.revision)
      throw new StudioError(
        409,
        "A newer version was saved. Reload it or save your current work as a copy.",
      );
    if (old && JSON.stringify(old.document) === JSON.stringify(document))
      return { ...old, id: ref.id };
    const revision = (old?.revision ?? 0) + 1;
    const project: Project = {
      id: ref.id,
      mode: "structured",
      title: document.title,
      document,
      revision,
      ownerUid: old?.ownerUid ?? session.uid,
      createdAt: old?.createdAt ?? now,
      updatedAt: now,
    };
    tx.set(ref, project);
    tx.create(ref.collection("versions").doc(String(revision)), {
      revision,
      document,
      createdAt: now,
      uid: session.uid,
    });
    if (revision > 20)
      tx.delete(ref.collection("versions").doc(String(revision - 20)));
    return project;
  });
}
export const fingerprint = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
export async function claimOperation(
  session: SessionContext,
  id: string,
  input: unknown,
) {
  const ref = db().doc(
    `workspaces/${session.workspaceId}/infographicOperations/${identifier.parse(id)}`,
  );
  const hash = fingerprint(input);
  const existing = await db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists) {
      if (snap.data()?.hash !== hash || snap.data()?.uid !== session.uid)
        throw new StudioError(
          409,
          "This operation ID was already used for a different request.",
        );
      return snap.data();
    }
    tx.create(ref, {
      hash,
      uid: session.uid,
      status: "running",
      createdAt: new Date().toISOString(),
    });
    return null;
  });
  return { ref, existing };
}
