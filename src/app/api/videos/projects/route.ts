import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { requireSession } from "@/lib/auth/session-context";
import { getWorkspaceRole, canWrite } from "@/lib/auth/workspace-role";
import { jsonError, jsonOk, parseBody } from "@/lib/validation/helpers";
import type { VideoJobStatus, VideoWorkflow } from "@/lib/video-gen/types";

const workflowSchema = z.enum(["cartoon", "viral", "real-estate", "whiteboard"]);
const aspectRatioSchema = z.enum(["9:16", "1:1", "16:9", "4:3", "3:4", "21:9"]);

const createProjectSchema = z.object({
  workflow: workflowSchema,
  title: z.string().trim().min(1).max(160),
  description: z.string().max(1000).optional().default(""),
  inputs: z.record(z.unknown()).optional().default({}),
  scenes: z.array(z.record(z.unknown())).max(50).optional().default([]),
  aspectRatios: z.array(aspectRatioSchema).min(1).max(3).optional().default(["9:16"]),
  brandKitId: z.string().max(120).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(30).optional().default([]),
});

function iso(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof (value as { toDate?: unknown }).toDate === "function") {
    return ((value as { toDate: () => Date }).toDate()).toISOString();
  }
  if (typeof value === "string") return value;
  return null;
}

function projectSummary(id: string, data: Record<string, unknown>) {
  return {
    id,
    title: String(data.title ?? "Untitled video"),
    description: String(data.description ?? ""),
    workflow: data.workflow as VideoWorkflow,
    thumbnailUrl: typeof data.thumbnailUrl === "string" ? data.thumbnailUrl : undefined,
    lifecycle: data.lifecycle ?? "draft",
    renderStatus: data.renderStatus ?? "idle",
    reviewStatus: data.reviewStatus ?? "none",
    publishingStatus: data.publishingStatus ?? "not_published",
    ownerUid: String(data.ownerUid ?? data.uid ?? ""),
    brandKitId: (data.brandKitId as string | null | undefined) ?? null,
    tags: Array.isArray(data.tags) ? data.tags.filter((v): v is string => typeof v === "string") : [],
    variants: Array.isArray(data.variants) ? data.variants : [],
    legacyJobId: typeof data.legacyJobId === "string" ? data.legacyJobId : undefined,
    legacyStatus: data.legacyStatus as VideoJobStatus | undefined,
    createdAt: iso(data.createdAt),
    updatedAt: iso(data.updatedAt),
    lastOpenedAt: iso(data.lastOpenedAt),
  };
}

export async function GET(request: Request) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  if (!adminDb) return jsonError(503, "Database unavailable");

  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "all";
  const workflow = url.searchParams.get("workflow") || "";
  const query = url.searchParams.get("q")?.trim().toLowerCase() || "";

  const projectSnap = await adminDb
    .collection(`workspaces/${session.workspaceId}/videoProjects`)
    .orderBy("updatedAt", "desc")
    .limit(100)
    .get();
  const projects = projectSnap.docs.map((doc) => projectSummary(doc.id, doc.data()));

  // Legacy jobs remain visible without a destructive migration. Adoption is deferred
  // until a user edits, duplicates or sends one for review.
  const jobsSnap = await adminDb
    .collection(`workspaces/${session.workspaceId}/videoJobs`)
    .orderBy("updatedAt", "desc")
    .limit(100)
    .get();
  const knownLegacyIds = new Set(projects.map((project) => project.legacyJobId).filter(Boolean));
  const legacy = jobsSnap.docs
    .filter((doc) => !knownLegacyIds.has(doc.id))
    .map((doc) => {
      const data = doc.data();
      const assets = Array.isArray(data.finalAssets) ? data.finalAssets : [];
      return projectSummary(`legacy_${doc.id}`, {
        title: `${String(data.workflow ?? "Video")} video`,
        description: "Imported from a previous video generation job.",
        workflow: data.workflow ?? "cartoon",
        lifecycle: "active",
        renderStatus: data.status === "complete" ? "complete" : data.status === "failed" ? "failed" : "rendering",
        reviewStatus: "none",
        publishingStatus: "not_published",
        ownerUid: data.uid,
        variants: assets.map((asset: { aspectRatio?: string; assetId?: string; assetUrl?: string }, index: number) => ({
          id: `${doc.id}_${index}`,
          aspectRatio: asset.aspectRatio ?? "9:16",
          assetId: asset.assetId,
          assetUrl: asset.assetUrl,
          status: "complete",
        })),
        legacyJobId: doc.id,
        legacyStatus: data.status,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        lastOpenedAt: null,
      });
    });

  const all = [...projects, ...legacy].filter((project) => {
    const matchesStatus = status === "all" || project.reviewStatus === status || project.renderStatus === status || project.lifecycle === status;
    const matchesWorkflow = !workflow || project.workflow === workflow;
    const matchesQuery = !query || `${project.title} ${project.description}`.toLowerCase().includes(query);
    return matchesStatus && matchesWorkflow && matchesQuery;
  });

  return jsonOk({ projects: all, total: all.length });
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  if (!adminDb) return jsonError(503, "Database unavailable");
  const role = await getWorkspaceRole(session.workspaceId, session.uid);
  if (!canWrite(role)) return jsonError(403, "You do not have permission to create video projects");
  const parsed = await parseBody(request, createProjectSchema);
  if (!parsed.ok) return jsonError(parsed.error.status, parsed.error.message, parsed.error.issues);

  const ref = adminDb.collection(`workspaces/${session.workspaceId}/videoProjects`).doc();
  const now = FieldValue.serverTimestamp();
  await ref.set({
    workspaceId: session.workspaceId,
    ownerUid: session.uid,
    creatorUid: session.uid,
    ...parsed.data,
    lifecycle: "draft",
    renderStatus: "idle",
    reviewStatus: "none",
    publishingStatus: "not_published",
    variants: [],
    draftVersion: 0,
    revisionCount: 0,
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
  });
  return jsonOk({ projectId: ref.id }, 201);
}
