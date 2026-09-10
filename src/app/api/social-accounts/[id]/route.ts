import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { readCache, writeCache } from "@/lib/db/account-health";
import { jsonError, jsonOk } from "@/lib/validation/helpers";
import { createNotification } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Remove a single connected account from the workspace's local cache.
 *
 * Note: upload-post.com does not expose a server-side disconnect endpoint
 * for an already-linked account, so this only updates our Firestore cache.
 * The user must still open the hosted connect page to unlink the account
 * at the source (we surface this in the toast after a successful delete).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const { id } = await params;
  if (!id) return jsonError(400, "Missing account id");

  const cache = await readCache(session.workspaceId).catch(() => null);
  if (!cache) {
    return jsonError(404, "No cached accounts snapshot for this workspace");
  }
  const account = cache.accounts.find((a) => a.id === id);
  if (!account) {
    return jsonError(404, "Account not found in workspace snapshot");
  }

  const next = cache.accounts.filter((a) => a.id !== id);
  await writeCache(session.workspaceId, {
    accounts: next,
    profiles: cache.profiles,
    plan: cache.plan,
    limit: cache.limit,
  });

  await createNotification(session.uid, {
    type: "account_disconnected",
    category: "accounts",
    title: "Social account disconnected",
    message: `${account.displayName || account.handle} is no longer available for publishing.`,
    actionUrl: "/dashboard/accounts",
    actionLabel: "Review accounts",
    dedupeKey: `account:${session.workspaceId}:${id}:disconnected`,
    metadata: { workspaceId: session.workspaceId, accountId: id, platform: account.platform },
  });

  return jsonOk({ removed: id, remaining: next.length });
}
