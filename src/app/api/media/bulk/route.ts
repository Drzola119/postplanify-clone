import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { adminDb, FieldValue } from "@/lib/db";
import { parseBody, jsonError, jsonOk } from "@/lib/validation/helpers";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bulkActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("delete"),
    assetIds: z.array(z.string().min(1).max(64)).min(1).max(100),
  }),
  z.object({
    action: z.literal("tag"),
    assetIds: z.array(z.string().min(1).max(64)).min(1).max(100),
    tag: z.string().min(1).max(64),
  }),
  z.object({
    action: z.literal("move"),
    assetIds: z.array(z.string().min(1).max(64)).min(1).max(100),
    folder: z.enum(["posts", "brands", "avatars", "assets"]),
  }),
]);

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  if (!adminDb) return jsonError(503, "Database not configured");

  const parsed = await parseBody(request, bulkActionSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid payload", parsed.error?.issues);
  }

  const { assetIds } = parsed.data;
  const ref = (id: string) => adminDb!.doc(`workspaces/${session.workspaceId}/mediaAssets/${id}`);
  const now = new Date();

  if (parsed.data.action === "delete") {
    const batch = adminDb.batch();
    for (const id of assetIds) batch.update(ref(id), { deletedAt: now });
    await batch.commit();
    return jsonOk({ action: "delete", updated: assetIds.length });
  }

  if (parsed.data.action === "tag") {
    const batch = adminDb.batch();
    for (const id of assetIds) {
      batch.set(ref(id), { tags: FieldValue.arrayUnion(parsed.data.tag), updatedAt: now }, { merge: true });
    }
    await batch.commit();
    return jsonOk({ action: "tag", updated: assetIds.length, tag: parsed.data.tag });
  }

  // move
  const batch = adminDb.batch();
  for (const id of assetIds) {
    batch.set(ref(id), { folder: parsed.data.folder, updatedAt: now }, { merge: true });
  }
  await batch.commit();
  return jsonOk({ action: "move", updated: assetIds.length, folder: parsed.data.folder });
}