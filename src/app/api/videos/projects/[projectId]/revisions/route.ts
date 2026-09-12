import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { requireSession } from "@/lib/auth/session-context";
import { canRead, canWrite, getWorkspaceRole } from "@/lib/auth/workspace-role";
import { jsonError, jsonOk, parseBody } from "@/lib/validation/helpers";

const createSchema = z.object({
  label: z.string().trim().min(1).max(100).default("Saved version"),
  draft: z.record(z.unknown()).optional(),
});

function iso(value: unknown): string | null {
  if (!value) return null;
  if (typeof (value as { toDate?: unknown }).toDate === "function") return (value as { toDate: () => Date }).toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return typeof value === "string" ? value : null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  if (!adminDb) return jsonError(503, "Database unavailable");
  const role = await getWorkspaceRole(session.workspaceId, session.uid);
  if (!canRead(role)) return jsonError(403, "You do not have permission to view revisions");
  const { projectId } = await params;
  const snap = await adminDb.collection(`workspaces/${session.workspaceId}/videoProjects/${projectId}/revisions`).orderBy("revisionNumber", "desc").limit(50).get();
  return jsonOk({ revisions: snap.docs.map((doc) => ({ id: doc.id, ...doc.data(), createdAt: iso(doc.data().createdAt) })) });
}

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  if (!adminDb) return jsonError(503, "Database unavailable");
  const role = await getWorkspaceRole(session.workspaceId, session.uid);
  if (!canWrite(role)) return jsonError(403, "You do not have permission to save revisions");
  const parsed = await parseBody(request, createSchema);
  if (!parsed.ok) return jsonError(parsed.error.status, parsed.error.message, parsed.error.issues);
  const { projectId } = await params;
  const projectRef = adminDb.doc(`workspaces/${session.workspaceId}/videoProjects/${projectId}`);
  const revisionRef = projectRef.collection("revisions").doc();
  let revisionNumber = 1;
  await adminDb.runTransaction(async (tx) => {
    const project = await tx.get(projectRef);
    if (!project.exists) throw new Error("Video project not found");
    const data = project.data()!;
    revisionNumber = Number(data.revisionCount ?? 0) + 1;
    const draft = parsed.data.draft ?? data.draft ?? { inputs: {}, scenes: [] };
    tx.set(revisionRef, {
      projectId,
      revisionNumber,
      label: parsed.data.label,
      snapshot: draft,
      variants: Array.isArray(data.variants) ? data.variants : [],
      reviewStatus: "none",
      createdBy: session.uid,
      createdAt: FieldValue.serverTimestamp(),
    });
    tx.update(projectRef, {
      currentRevisionId: revisionRef.id,
      revisionCount: revisionNumber,
      lifecycle: "active",
      reviewStatus: "none",
      updatedAt: FieldValue.serverTimestamp(),
    });
  }).catch((error) => { throw error; });
  return jsonOk({ revisionId: revisionRef.id, revisionNumber }, 201);
}
