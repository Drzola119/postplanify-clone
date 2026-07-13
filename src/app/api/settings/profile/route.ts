import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { updateProfileSchema } from "@/lib/validation/settings";
import { parseBody, jsonError, jsonOk } from "@/lib/validation/helpers";
import { MissingServerSecretError } from "@/lib/security/server-config";

export async function PATCH(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const parsed = await parseBody(request, updateProfileSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid payload", parsed.error?.issues);
  }

  if (!adminAuth) {
    return jsonError(503, "Auth not configured");
  }

  try {
    // Update Firebase Auth profile.
    if (parsed.data.displayName || parsed.data.photoURL) {
      await adminAuth.updateUser(session.uid, {
        displayName: parsed.data.displayName,
        photoURL: parsed.data.photoURL,
      });
    }

    // Update user doc.
    if (adminDb) {
      const data: Record<string, unknown> = { updatedAt: { _methodName: "serverTimestamp" } };
      if (parsed.data.displayName !== undefined) data.displayName = parsed.data.displayName;
      if (parsed.data.photoURL !== undefined) data.photoURL = parsed.data.photoURL;
      if (parsed.data.bio !== undefined) data.bio = parsed.data.bio;
      if (parsed.data.locale !== undefined) data.locale = parsed.data.locale;
      if (parsed.data.timezone !== undefined) data.timezone = parsed.data.timezone;
      await adminDb.doc(`users/${session.uid}`).set(data, { merge: true });
    }

    return jsonOk({ updated: true });
  } catch (err) {
    if (err instanceof MissingServerSecretError) {
      return jsonError(503, err.message);
    }
    throw err;
  }
}
