import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { adminDb } from "@/lib/firebase/admin";
import { jsonError, jsonOk } from "@/lib/validation/helpers";
import { LOCALE_LABELS } from "@/lib/i18n/types";

const VALID = Object.keys(LOCALE_LABELS) as Array<keyof typeof LOCALE_LABELS>;

/**
 * POST /api/settings/locale
 *
 * Persists the user's preferred UI locale to their Firestore user document
 * (`users/{uid}.uiLocale`). The cookie "ui-locale" remains the runtime
 * source of truth for rendering; this endpoint is the durable backup that
 * lets us restore the preference on next login / new device.
 *
 * The UI locale (interface language) is fully independent from the
 * infographic Output Language — never sync one from the other here.
 */
export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return jsonError(400, "Invalid JSON body");
  }

  const locale = (raw as { locale?: string })?.locale;
  if (typeof locale !== "string" || !VALID.includes(locale as keyof typeof LOCALE_LABELS)) {
    return jsonError(400, `Invalid locale. Expected one of: ${VALID.join(", ")}`);
  }

  try {
    if (adminDb) {
      await adminDb.doc(`users/${session.uid}`).set(
        { uiLocale: locale, updatedAt: { _methodName: "serverTimestamp" } },
        { merge: true }
      );
    }
    return jsonOk({ uiLocale: locale });
  } catch {
    return jsonError(500, "Could not persist locale preference");
  }
}
