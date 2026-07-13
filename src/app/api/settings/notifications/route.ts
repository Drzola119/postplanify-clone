import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { notificationPrefsSchema } from "@/lib/validation/settings";
import { parseBody, jsonError, jsonOk } from "@/lib/validation/helpers";

export async function PATCH(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const parsed = await parseBody(request, notificationPrefsSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid payload", parsed.error?.issues);
  }

  if (!adminAuth) {
    return jsonError(503, "Auth not configured");
  }

  // Store as Firebase custom claims (small key-value space, perfect fit).
  const user = await adminAuth.getUser(session.uid).catch(() => null);
  const currentClaims = user?.customClaims ?? {};
  await adminAuth.setCustomUserClaims(session.uid, {
    ...currentClaims,
    notif: { ...(currentClaims as { notif?: Record<string, unknown> }).notif, ...parsed.data },
  });

  // Mirror to Firestore for read paths.
  if (adminDb) {
    await adminDb.doc(`users/${session.uid}`).set(
      { notif: parsed.data, updatedAt: { _methodName: "serverTimestamp" } },
      { merge: true }
    );
  }

  return jsonOk({ updated: true });
}
