import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { getWorkspaceRole, canRead, canManage } from "@/lib/auth/workspace-role";
import { adminDb } from "@/lib/firebase/admin";
import { resolvers, MissingServerSecretError } from "@/lib/security/server-config";
import { autodmStart, autodmStatus, UploadPostInboxError } from "@/lib/uploadpost/inbox";
import { inboxAutodmSchema } from "@/lib/validation/inbox";
import { parseBody, jsonError, jsonOk } from "@/lib/validation/helpers";
import type { InboxAutodmDoc } from "@/lib/db/schema";
import { InboxAccountError, requireInboxOperation, resolveCanonicalInboxAccount } from "@/lib/inbox/account";

/**
 * Provider-managed AutoDM monitors (spec §12, prepared).
 * Disabled by default: starting a monitor requires an explicit workspace
 * opt-in flag (`settings.inboxAutodmEnabled === true`) set by an admin.
 * No auto-recreate on expiry — renewal is an explicit new start.
 */

async function autodmEnabled(workspaceId: string): Promise<boolean> {
  if (!adminDb) return false;
  const snap = await adminDb.doc(`workspaces/${workspaceId}`).get().catch(() => null);
  const settings = ((snap?.data() as { settings?: Record<string, unknown> } | undefined)?.settings ?? {}) as Record<string, unknown>;
  return settings.inboxAutodmEnabled === true;
}

/** GET: provider-confirmed monitor status, mirrored locally for the UI. */
export async function GET(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const role = await getWorkspaceRole(session.workspaceId, session.uid);
  if (!canRead(role)) return jsonError(401, "Unauthorized");

  let apiKey: string;
  try {
    apiKey = resolvers.uploadPostApiKey(request.headers);
  } catch (err) {
    if (err instanceof MissingServerSecretError) return jsonError(503, "Social provider not configured");
    throw err;
  }
  const includeInactive = new URL(request.url).searchParams.get("include_inactive") === "true";
  try {
    const accountKey = await resolveCanonicalInboxAccount(session.workspaceId);
    const allMonitors = await autodmStatus(apiKey, includeInactive);
    const monitors = allMonitors.filter((monitor) => monitor.profileUsername === accountKey);
    // Mirror (provider is source of truth; local docs only render + guard).
    if (adminDb) {
      const batch = adminDb.batch();
      for (const m of monitors) {
        const ref = adminDb.doc(`workspaces/${session.workspaceId}/inboxAutodm/${encodeURIComponent(m.monitorId)}`);
        const doc: InboxAutodmDoc = {
          monitorId: m.monitorId,
          postUrl: m.postUrl,
          profileUsername: m.profileUsername,
          status: m.status,
          stats: m.stats,
          lastCheckedAt: m.lastCheck ? new Date(m.lastCheck) : undefined,
          updatedAt: new Date(),
        };
        batch.set(ref, doc, { merge: true });
      }
      await batch.commit().catch(() => undefined);
    }
    return jsonOk({ enabled: await autodmEnabled(session.workspaceId), monitors });
  } catch (err) {
    if (err instanceof UploadPostInboxError) {
      return jsonError(err.code === "rate-limited" ? 429 : 502, err.message, { code: err.code });
    }
    throw err;
  }
}

/** POST: start a monitor (admin-only, explicit opt-in required). */
export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const role = await getWorkspaceRole(session.workspaceId, session.uid);
  if (!canManage(role)) return jsonError(403, "Starting AutoDM monitors requires an admin role");
  if (!(await autodmEnabled(session.workspaceId))) {
    return jsonError(403, "AutoDM is disabled for this workspace — enable it explicitly before starting monitors", {
      code: "AUTODM_DISABLED",
    });
  }

  const parsed = await parseBody(request, inboxAutodmSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(400, parsed.error?.message ?? "Invalid payload", parsed.error?.issues);
  }

  let apiKey: string;
  try {
    apiKey = resolvers.uploadPostApiKey(request.headers);
  } catch (err) {
    if (err instanceof MissingServerSecretError) return jsonError(503, "Social provider not configured");
    throw err;
  }
  let accountKey: string;
  try {
    accountKey = await resolveCanonicalInboxAccount(session.workspaceId, parsed.data.profileUsername);
    await requireInboxOperation(session.workspaceId, "manage-autodm");
  } catch (err) {
    if (err instanceof InboxAccountError) return jsonError(err.status, err.message, { code: err.code });
    throw err;
  }
  try {
    const { monitorId } = await autodmStart(apiKey, {
      postUrl: parsed.data.postUrl,
      replyMessage: parsed.data.replyMessage,
      profileUsername: accountKey,
      buttons: parsed.data.buttons,
      monitoringInterval: parsed.data.monitoringInterval,
      triggerKeywords: parsed.data.triggerKeywords,
    });
    if (adminDb) {
      await adminDb
        .doc(`workspaces/${session.workspaceId}/inboxAutodm/${encodeURIComponent(monitorId)}`)
        .set(
          {
            monitorId,
            postUrl: parsed.data.postUrl,
            profileUsername: accountKey,
            status: "running",
            triggerKeywords: parsed.data.triggerKeywords ?? [],
            enabledBy: session.uid,
            updatedAt: new Date(),
          },
          { merge: true }
        )
        .catch(() => undefined);
    }
    return jsonOk({ monitorId, status: "running" }, 201);
  } catch (err) {
    if (err instanceof UploadPostInboxError) {
      return jsonError(err.code === "rate-limited" ? 429 : 502, err.message, { code: err.code });
    }
    throw err;
  }
}
