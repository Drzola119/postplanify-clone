import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import type { VideoWorkflow } from "./types";

type FirestoreLike = FirebaseFirestore.Firestore;

function projectTitle(workflow: VideoWorkflow, request: Record<string, unknown>): string {
  const candidate = request.topic || request.hookLine || request.propertyDescription;
  if (typeof candidate === "string" && candidate.trim()) return candidate.trim().slice(0, 160);
  return `${workflow.replaceAll("-", " ")} video`;
}

/** Creates a durable project alongside a legacy-compatible video job. */
export async function createVideoProjectForJob(args: {
  db: FirestoreLike;
  workspaceId: string;
  uid: string;
  workflow: VideoWorkflow;
  request: Record<string, unknown>;
  jobId: string;
}): Promise<string> {
  const ref = args.db.collection(`workspaces/${args.workspaceId}/videoProjects`).doc();
  const now = FieldValue.serverTimestamp();
  await ref.set({
    workspaceId: args.workspaceId,
    ownerUid: args.uid,
    creatorUid: args.uid,
    title: projectTitle(args.workflow, args.request),
    description: "",
    workflow: args.workflow,
    draft: { inputs: args.request, scenes: [], aspectRatios: args.request.aspectRatios ?? ["9:16"] },
    lifecycle: "active",
    renderStatus: "queued",
    reviewStatus: "none",
    publishingStatus: "not_published",
    variants: [],
    revisionCount: 0,
    legacyJobId: args.jobId,
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
  });
  return ref.id;
}

/** Mirrors job progress to its project without changing the worker's job contract. */
export async function syncVideoProjectFromJob(args: { db: FirestoreLike; jobRef: FirebaseFirestore.DocumentReference }): Promise<void> {
  const jobSnap = await args.jobRef.get();
  if (!jobSnap.exists) return;
  const job = jobSnap.data() ?? {};
  const projectId = typeof job.projectId === "string" ? job.projectId : undefined;
  if (!projectId) return;
  const status = String(job.status ?? "queued");
  const renderStatus = status === "complete" ? "complete" : status === "failed" ? "failed" : status === "queued" ? "queued" : "rendering";
  await args.db.doc(`workspaces/${job.workspaceId}/videoProjects/${projectId}`).set({
    renderStatus,
    variants: Array.isArray(job.finalAssets)
      ? job.finalAssets.map((asset: { aspectRatio?: string; assetId?: string; assetUrl?: string }, index: number) => ({
          id: `${jobSnap.id}_${index}`,
          aspectRatio: asset.aspectRatio ?? "9:16",
          assetId: asset.assetId,
          assetUrl: asset.assetUrl,
          status: "complete",
        }))
      : [],
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}
