import "server-only";
import { requireSession } from "@/lib/auth/session-context";
import { getWorkspaceRole, canRead, canWrite } from "@/lib/auth/workspace-role";
import { jsonError } from "@/lib/validation/helpers";
/** Membership is checked even when workspace resolution came from a cookie. */
export async function requireCarouselAccess(write = true) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const role = await getWorkspaceRole(session.workspaceId, session.uid);
  if (!(write ? canWrite(role) : canRead(role)))
    return jsonError(
      403,
      "You do not have permission to access this carousel workspace.",
    );
  return session;
}
