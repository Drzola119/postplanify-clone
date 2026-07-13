import "server-only";
import { getCurrentUser } from "@/lib/firebase/admin";
import { ensureDefaultWorkspace } from "@/lib/db/workspaces";

export interface SessionContext {
  uid: string;
  email: string | null;
  workspaceId: string;
}

export async function getSessionContext(): Promise<SessionContext | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  try {
    const workspaceId = await ensureDefaultWorkspace(user.uid, user.email);
    return { uid: user.uid, email: user.email, workspaceId };
  } catch (err) {
    console.error("[session-context] Failed to resolve workspace:", err);
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