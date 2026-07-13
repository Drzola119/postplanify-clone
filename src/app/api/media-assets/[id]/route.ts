import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { getAsset, softDeleteAsset, countReferencesToAsset } from "@/lib/db/media-assets";
import { deleteFromBunny } from "@/lib/bunny";
import { resolvers } from "@/lib/security/server-config";
import { jsonError, jsonOk } from "@/lib/validation/helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const { id } = await params;
  const item = await getAsset(session.workspaceId, id);
  if (!item) return jsonError(404, "Asset not found");
  return jsonOk({ asset: item });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const { id } = await params;
  const item = await getAsset(session.workspaceId, id);
  if (!item) return jsonError(404, "Asset not found");

  // Always soft-delete in Firestore so references stay valid.
  await softDeleteAsset(session.workspaceId, id);

  // Only call Bunny if no post still references the asset URL — avoids orphaning
  // media that's embedded in scheduled posts.
  const refCount = await countReferencesToAsset(session.workspaceId, item.url);
  let bunnyDeleted = false;
  let bunnyError: string | null = null;
  if (refCount === 0) {
    try {
      const { zone, password } = resolvers.bunny(request.headers);
      await deleteFromBunny({
        userId: session.uid,
        storedPath: item.storedPath,
        zone,
        password,
      });
      bunnyDeleted = true;
    } catch (err) {
      bunnyError = err instanceof Error ? err.message : "Bunny delete failed";
    }
  }

  return jsonOk({ deleted: true, bunnyDeleted, bunnyError, references: refCount });
}
