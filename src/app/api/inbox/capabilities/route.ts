import { requireSession } from "@/lib/auth/session-context";
import { getWorkspaceRole } from "@/lib/auth/workspace-role";
import { supportMatrix, allPlatformIds, type ConnectedAccountCapability } from "@/lib/inbox/capabilities";
import { adminDb } from "@/lib/firebase/admin";
import { jsonOk } from "@/lib/validation/helpers";

/**
 * Effective per-operation support per platform (spec §4).
 * Computed from provider docs + connected-account state + workspace role.
 * Any member may read; the role is reported so the UI can gate send buttons.
 */
export async function GET() {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const role = await getWorkspaceRole(session.workspaceId, session.uid);

  // Best-effort account snapshot: reuse the cached social-accounts list when
  // available, otherwise report disconnected (never fabricate connections).
  let accounts: ConnectedAccountCapability[] = [];
  try {
    if (adminDb) {
      const snap = await adminDb.doc(`workspaces/${session.workspaceId}`).get();
      const settings = ((snap.data() as { settings?: Record<string, unknown> } | undefined)?.settings ?? {}) as Record<string, unknown>;
      const cache = settings.uploadPostCache as
        | { accounts?: Array<{ platform?: string; reauthRequired?: boolean; capabilities?: string[]; hasFacebookPage?: boolean }> }
        | undefined;
      if (Array.isArray(cache?.accounts)) {
        accounts = cache.accounts.flatMap((a) =>
          typeof a.platform === "string"
            ? [{ platform: a.platform, reauthRequired: a.reauthRequired, capabilities: a.capabilities, hasFacebookPage: a.hasFacebookPage }]
            : []
        );
      }
    }
  } catch {
    accounts = [];
  }

  const platforms = allPlatformIds().map((platform) => {
    const account = accounts.find((a) => a.platform === platform) ?? null;
    return { platform, connected: account !== null, operations: supportMatrix(platform, account) };
  });
  return jsonOk({ role, platforms });
}
