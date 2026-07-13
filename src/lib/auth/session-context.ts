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
      workspaceId = await ensureDefaultWorkspace(user.uid, user.email);
    }

    return { uid: user.uid, email: user.email, workspaceId };
  } catch (err) {
    log.error(err, { step: "resolveWorkspace" });
    return null;
  }
}

export async function requireSession(): Promise<SessionContext | Response> {
  const ctx = await getSessionContext();
  if (!ctx) {
    return Response.json({ ok: false, error: { status: 401, message: "Unauthorized" } }, { status: 401 });
  }
  return ctx;
}