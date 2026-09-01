import "server-only";
import { cookies } from "next/headers";
import { getCurrentUser, SESSION_COOKIE, adminAuth, isQuotaExceededError } from "@/lib/firebase/admin";
import { ensureDefaultWorkspace } from "@/lib/db/workspaces";
import { createLogger } from "@/lib/log";

const log = createLogger("session-context");

export interface SessionContext {
  uid: string;
  email: string | null;
  workspaceId: string;
}

/**
 * Shared fallback workspace removed — using a single hard-coded ID breaks tenant isolation
 * (all quota-exhausted users would share one workspace). Workspace resolution now fails
 * closed with 503 so the caller can surface a retry, rather than leaking data.
 */
export class WorkspaceUnavailableError extends Error {
  public readonly causeType: "quota" | "config" | "unknown";
  constructor(
    message = "Workspace unavailable — Firestore quota or configuration error",
    causeType: "quota" | "config" | "unknown" = "unknown"
  ) {
    super(message);
    this.name = "WorkspaceUnavailableError";
    this.causeType = causeType;
  }
}

function quotaMessage(): string {
  return "Firestore quota exceeded — the database has hit its daily read/write limit. Check Firebase Console → Firestore → Usage, enable billing (Blaze plan), or wait until the quota resets at midnight Pacific.";
}

function classifyWorkspaceError(err: unknown): "quota" | "config" | "unknown" {
  if (isQuotaExceededError(err)) return "quota";
  const msg = String((err as { message?: unknown })?.message ?? err);
  if (/adminDb not configured|FIREBASE|Auth\/DB not configured|not configured/i.test(msg)) return "config";
  if (/PERMISSION_DENIED|permission/i.test(msg)) return "config";
  return "unknown";
}

async function readWorkspaceClaim(uid: string): Promise<string | null> {
  if (!adminAuth) return null;
  try {
    const user = await adminAuth.getUser(uid);
    const claim = (user.customClaims as { workspaceId?: string } | undefined)?.workspaceId;
    return claim ?? null;
  } catch {
    return null;
  }
}

export async function getSessionContext(): Promise<SessionContext | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  try {
    // 1. Check the session cookie's custom claim (set by /api/auth/session/workspace).
    let workspaceId = await readWorkspaceClaim(user.uid);

    // 2. Also peek at the cookie itself for a hint (set by the switcher route).
    if (!workspaceId) {
      try {
        const c = await cookies();
        const cookie = c.get("pp_active_workspace")?.value;
        if (cookie) workspaceId = cookie;
      } catch {
        /* not in a request scope */
      }
    }

    // 3. Fall back to the user's primary workspace (auto-created if missing).
    let workspaceResolveError: unknown = null;
    if (!workspaceId) {
      try {
        workspaceId = await ensureDefaultWorkspace(user.uid, user.email);
      } catch (err) {
        workspaceResolveError = err;
        const cat = classifyWorkspaceError(err);
        if (cat === "quota") {
          log.error("ensureDefaultWorkspace failed: Firestore quota exceeded", { err, uid: user.uid });
          throw new WorkspaceUnavailableError(quotaMessage(), "quota");
        }
        log.warn("ensureDefaultWorkspace failed (e.g. quota exceeded)", { err });
      }
    }

    // 4. No shared fallback — fail closed to avoid tenant isolation breach.
    if (!workspaceId) {
      log.error("Workspace resolution failed — no workspaceId after all strategies", {
        uid: user.uid,
        workspaceResolveError: String(workspaceResolveError ?? "unknown"),
      });
      // If the underlying error was quota, preserve that detail so the API can return a clear action.
      if (workspaceResolveError && classifyWorkspaceError(workspaceResolveError) === "quota") {
        throw new WorkspaceUnavailableError(quotaMessage(), "quota");
      }
      throw new WorkspaceUnavailableError();
    }

    return { uid: user.uid, email: user.email, workspaceId };
  } catch (err) {
    if (err instanceof WorkspaceUnavailableError) throw err;
    const cat = classifyWorkspaceError(err);
    if (cat === "quota") {
      log.error(err, { step: "resolveWorkspace/quota" });
      throw new WorkspaceUnavailableError(quotaMessage(), "quota");
    }
    log.error(err, { step: "resolveWorkspace" });
    throw new WorkspaceUnavailableError(
      cat === "config" ? "Workspace unavailable — server configuration error" : undefined,
      cat
    );
  }
}

export async function requireSession(): Promise<SessionContext | Response> {
  try {
    const ctx = await getSessionContext();
    if (!ctx) {
      return Response.json({ ok: false, error: { status: 401, message: "Unauthorized" } }, { status: 401 });
    }
    return ctx;
  } catch (err) {
    if (err instanceof WorkspaceUnavailableError) {
      const cause = (err as WorkspaceUnavailableError).causeType;
      return Response.json(
        {
          ok: false,
          error: {
            status: 503,
            code: cause === "quota" ? "QUOTA_EXCEEDED" : cause === "config" ? "CONFIG_ERROR" : "WORKSPACE_UNAVAILABLE",
            message: (err as Error).message,
            hint:
              cause === "quota"
                ? "Firebase Console → Project Settings → Usage and billing → Firestore. Enable Blaze (pay-as-you-go) or wait until daily quota resets (midnight PT)."
                : undefined,
          },
        },
        { status: 503 }
      );
    }
    // Distinguish quota from generic errors even when WorkspaceUnavailableError wasn't used directly
    if (isQuotaExceededError(err)) {
      log.error(err, { step: "requireSession/quota" });
      return Response.json(
        {
          ok: false,
          error: {
            status: 503,
            code: "QUOTA_EXCEEDED",
            message: quotaMessage(),
            hint: "Enable billing in Firebase Console or wait for quota reset.",
          },
        },
        { status: 503 }
      );
    }
    // Auth failure already handled as 401 above; unknown errors are 503
    log.error(err, { step: "requireSession" });
    return Response.json({ ok: false, error: { status: 503, message: "Internal error resolving session" } }, { status: 503 });
  }
}