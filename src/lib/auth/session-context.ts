import "server-only";
import { cookies } from "next/headers";
import { getCurrentUser, SESSION_COOKIE, adminAuth } from "@/lib/firebase/admin";
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
  constructor(message = "Workspace unavailable — Firestore quota or configuration error") {
    super(message);
    this.name = "WorkspaceUnavailableError";
  }
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
    if (!workspaceId) {
      try {
        workspaceId = await ensureDefaultWorkspace(user.uid, user.email);
      } catch (err) {
        log.warn("ensureDefaultWorkspace failed (e.g. quota exceeded)", { err });
      }
    }

    // 4. No shared fallback — fail closed to avoid tenant isolation breach.
    if (!workspaceId) {
      log.error("Workspace resolution failed — no workspaceId after all strategies", {
        uid: user.uid,
      });
      throw new WorkspaceUnavailableError();
    }

    return { uid: user.uid, email: user.email, workspaceId };
  } catch (err) {
    if (err instanceof WorkspaceUnavailableError) throw err;
    log.error(err, { step: "resolveWorkspace" });
    throw new WorkspaceUnavailableError();
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
      return Response.json(
        { ok: false, error: { status: 503, message: (err as Error).message } },
        { status: 503 }
      );
    }
    // Auth failure already handled as 401 above; unknown errors are 503
    log.error(err, { step: "requireSession" });
    return Response.json({ ok: false, error: { status: 503, message: "Internal error resolving session" } }, { status: 503 });
  }
}