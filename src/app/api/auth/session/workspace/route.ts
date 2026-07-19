import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/firebase/admin";
import { SESSION_COOKIE, SESSION_MAX_AGE_MS } from "@/lib/firebase/admin";
import { jsonError, jsonOk, parseBody } from "@/lib/validation/helpers";

const workspaceSwitchSchema = z.object({
  workspaceId: z.string().min(1),
});

/**
 * Switch the active workspace for the current session. Mints a new session
 * cookie that includes the new workspaceId claim.
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Unauthorized");
  if (!adminAuth || !adminDb) return jsonError(503, "Auth/DB not configured");

  const parsed = await parseBody(request, workspaceSwitchSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(400, "workspaceId is required");
  }
  const workspaceId = parsed.data.workspaceId;

  // Verify membership.
  const memberSnap = await adminDb.doc(`workspaces/${workspaceId}/members/${user.uid}`).get();
  if (!memberSnap.exists) return jsonError(403, "Not a member of this workspace");

  // Set custom claim so subsequent calls can pick up the workspace.
  const currentClaims = (await adminAuth.getUser(user.uid)).customClaims ?? {};
  await adminAuth.setCustomUserClaims(user.uid, {
    ...currentClaims,
    workspaceId,
  });

  // Mirror to user doc.
  await adminDb.doc(`users/${user.uid}`).set({ primaryWorkspaceId: workspaceId }, { merge: true });

  // Re-issue session cookie with updated claims. The caller's existing cookie
  // remains valid for the previous workspaceId until refreshed; we set a fresh
  // cookie here so the next requireSession() picks up the new one.
  const idToken = request.headers.get("x-firebase-id-token");
  const res = NextResponse.json({ ok: true, workspaceId });
  res.cookies.set("pp_active_workspace", workspaceId, {
    maxAge: SESSION_MAX_AGE_MS / 1000,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });
  if (idToken) {
    const expiresIn = SESSION_MAX_AGE_MS;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    res.cookies.set(SESSION_COOKIE, sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
    });
  }

  return res;
}
