import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { readProfile } from "@/lib/db/upload-post-profiles";
import { effectiveSupport, type ConnectedAccountCapability, type InboxOperation } from "@/lib/inbox/capabilities";

export class InboxAccountError extends Error {
  constructor(
    message: string,
    public readonly code: "ACCOUNT_MISMATCH" | "DISCONNECTED" | "PERMISSION_REQUIRED" | "UNSUPPORTED",
    public readonly status = code === "ACCOUNT_MISMATCH" ? 409 : 403
  ) {
    super(message);
    this.name = "InboxAccountError";
  }
}

/** The workspace profile is the only authority for provider account identity. */
export async function resolveCanonicalInboxAccount(workspaceId: string, requested?: string): Promise<string> {
  const profile = await readProfile(workspaceId).catch(() => null);
  const accountKey = profile?.username || workspaceId;
  if (requested && requested !== accountKey) {
    throw new InboxAccountError(
      "The requested account does not match this workspace's connected Upload-Post profile.",
      "ACCOUNT_MISMATCH"
    );
  }
  return accountKey;
}

export async function readCachedInboxAccount(workspaceId: string, platform = "instagram"): Promise<ConnectedAccountCapability | null> {
  if (!adminDb) return null;
  const snap = await adminDb.doc(`workspaces/${workspaceId}`).get().catch(() => null);
  const settings = ((snap?.data() as { settings?: Record<string, unknown> } | undefined)?.settings ?? {}) as Record<string, unknown>;
  const cache = settings.uploadPostCache as
    | { accounts?: Array<{ platform?: string; reauthRequired?: boolean; capabilities?: string[]; hasFacebookPage?: boolean }> }
    | undefined;
  const account = cache?.accounts?.find((item) => item.platform === platform);
  return account?.platform
    ? {
        platform: account.platform,
        reauthRequired: account.reauthRequired,
        capabilities: account.capabilities,
        hasFacebookPage: account.hasFacebookPage,
      }
    : null;
}

export async function requireInboxOperation(
  workspaceId: string,
  operation: InboxOperation
): Promise<{ accountKey: string; account: ConnectedAccountCapability }> {
  const accountKey = await resolveCanonicalInboxAccount(workspaceId);
  const account = await readCachedInboxAccount(workspaceId);
  const support = effectiveSupport("instagram", account, operation);
  if (support.status !== "supported") {
    const code = support.status === "disconnected" ? "DISCONNECTED" : support.status === "permission-required" ? "PERMISSION_REQUIRED" : "UNSUPPORTED";
    throw new InboxAccountError(support.reason, code);
  }
  return { accountKey, account: account! };
}
