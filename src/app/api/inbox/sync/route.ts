import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { getWorkspaceRole, canWrite } from "@/lib/auth/workspace-role";
import { resolvers, MissingServerSecretError } from "@/lib/security/server-config";
import { syncInstagramAccount } from "@/lib/inbox/sync";
import { inboxSyncSchema } from "@/lib/validation/inbox";
import { parseBody, jsonError, jsonOk } from "@/lib/validation/helpers";
import { readSyncState, accountScope } from "@/lib/db/inbox-sync";
import { InboxAccountError, requireInboxOperation, resolveCanonicalInboxAccount } from "@/lib/inbox/account";

/**
 * Manual provider sync (spec §8). Throttled (≥60s per scope) and coalesced
 * with scheduled work via claimDue. Reads Firestore state for the UI;
 * this route performs the bounded provider scan. V1: Instagram-only.
 */
export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const role = await getWorkspaceRole(session.workspaceId, session.uid);
  if (!canWrite(role)) return jsonError(403, "Requires an editor role or higher");

  const parsed = await parseBody(request, inboxSyncSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid sync request", parsed.error?.issues);
  }
  const body = parsed.data;

  let apiKey: string;
  try {
    apiKey = resolvers.uploadPostApiKey(request.headers);
  } catch (err) {
    if (err instanceof MissingServerSecretError) return jsonError(503, "Social provider not configured");
    throw err;
  }
  let accountKey: string;
  try {
    accountKey = await resolveCanonicalInboxAccount(session.workspaceId, body.accountKey);
    await requireInboxOperation(session.workspaceId, "read-comments");
  } catch (err) {
    if (err instanceof InboxAccountError) return jsonError(err.status, err.message, { code: err.code });
    throw err;
  }

  const result = await syncInstagramAccount({
    workspaceId: session.workspaceId,
    accountKey,
    apiKey,
    force: body.force,
  });
  if (result.skipped === "throttled") {
    return jsonOk({ ...result, throttled: true, message: "Sync already ran recently — coalesced with existing work" });
  }
  if (!result.ok) {
    return jsonError(502, result.error ?? "Sync failed", { scope: result.scope });
  }
  const state = await readSyncState(session.workspaceId, result.scope).catch(() => null);
  return jsonOk({ ...result, lastSyncAt: toIsoDate(state?.lastSuccessAt) });
}

/** GET: last successful sync time for the header (reads durable state). */
export async function GET(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const url = new URL(request.url);
  const requested = url.searchParams.get("accountKey") ?? undefined;
  let accountKey: string;
  try {
    accountKey = await resolveCanonicalInboxAccount(session.workspaceId, requested);
  } catch (err) {
    if (err instanceof InboxAccountError) return jsonError(err.status, err.message, { code: err.code });
    throw err;
  }
  const state = await readSyncState(session.workspaceId, accountScope(accountKey, "instagram")).catch(() => null);
  return jsonOk({
    accountKey,
    lastSyncAt: toIsoDate(state?.lastSuccessAt),
    tier: state?.tier ?? null,
    consecutiveFailures: state?.consecutiveFailures ?? 0,
  });
}

function toIsoDate(v: unknown): string | null {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "string") return v;
  const t = v as { toDate?: () => Date; seconds?: number };
  if (typeof t?.toDate === "function") {
    try {
      return t.toDate().toISOString();
    } catch {
      return null;
    }
  }
  if (typeof t?.seconds === "number") return new Date(t.seconds * 1000).toISOString();
  return null;
}
