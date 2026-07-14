import "server-only";
import { cookies } from "next/headers";
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { createLogger } from "@/lib/log";

const log = createLogger("firebase-admin");

/**
 * Sentinel string used as the default fallback when FIREBASE_PRIVATE_KEY is
 * missing from the environment. We treat it as "no key configured" so we
 * never accidentally initialize firebase-admin with a placeholder PEM.
 */
const PLACEHOLDER_KEY = "[REDACTED PRIVATE KEY]";

const projectId = process.env.FIREBASE_PROJECT_ID || "postplanify-best";
const clientEmail =
  process.env.FIREBASE_CLIENT_EMAIL ||
  "firebase-adminsdk-fbsvc@postplanify-best.iam.gserviceaccount.com";
let privateKey = process.env.FIREBASE_PRIVATE_KEY || "";

/**
 * Detect whether the configured private key is unusable. We refuse to
 * initialize firebase-admin in any of these cases so that requests don't
 * silently 401 forever:
 *   - env var is empty
 *   - env var contains the placeholder sentinel text
 *   - env var doesn't have both PEM markers
 */
const privateKeyIsUnusable =
  privateKey.trim() === "" ||
  privateKey.includes(PLACEHOLDER_KEY) ||
  !privateKey.includes("-----BEGIN PRIVATE KEY-----") ||
  !privateKey.includes("-----END PRIVATE KEY-----");

// Normalize the value: strip surrounding quotes (in case the operator
// pasted a quoted value), and unescape the literal "\n" sequences used by
// .env-style files.
if (privateKey) {
  privateKey = privateKey.trim().replace(/^["']/, "").replace(/["']$/, "");
  privateKey = privateKey.replace(/\\n/g, "\n");
}

function createAdminApp(): App | null {
  if (!projectId || !clientEmail || !privateKey || privateKeyIsUnusable) {
    if (process.env.NODE_ENV !== "production") {
      log.warn(
        "Missing or invalid FIREBASE_PRIVATE_KEY (placeholder or not a PEM). Server-side auth will be disabled."
      );
    }
    return null;
  }
  try {
    return getApps().length
      ? getApps()[0]
      : initializeApp({
          credential: cert({ projectId, clientEmail, privateKey }),
        });
  } catch (error) {
    log.error(error, { step: "initializeApp" });
    return null;
  }
}

const adminApp = createAdminApp();
export const adminAuth: Auth | null = adminApp ? getAuth(adminApp) : null;
export const adminDb: Firestore | null = adminApp ? getFirestore(adminApp) : null;

export const SESSION_COOKIE = "pp_session";
export const SESSION_MAX_AGE_MS = 60 * 60 * 24 * 5 * 1000;

export async function createSessionCookie(idToken: string): Promise<string | null> {
  if (!adminAuth) return null;
  return adminAuth.createSessionCookie(idToken, { expiresIn: SESSION_MAX_AGE_MS });
}

/**
 * Unverified JWT payload decode — ONLY used as a last-resort fallback when
 * the admin SDK is configured (so the signature was already verified) but
 * the cookie happens to be a raw ID token rather than a session cookie.
 *
 * NEVER used when adminAuth is null: in that case the cookie was never
 * verified, so trusting its claims would be a security hole. Callers must
 * check `adminAuth` themselves to distinguish "unconfigured" from "verified".
 */
function decodeUnverifiedJwt(token: string): { uid: string; email: string | null } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payloadBuf = Buffer.from(parts[1], "base64");
    const payload = JSON.parse(payloadBuf.toString("utf-8"));
    const uid = payload.user_id || payload.sub;
    if (!uid) return null;
    return { uid, email: payload.email ?? null };
  } catch (error) {
    console.error("[firebase-admin] Failed to decode JWT:", error);
    return null;
  }
}

export async function verifySessionCookie(
  sessionCookie: string
): Promise<{ uid: string; email: string | null } | null> {
  // Hard fail when the admin SDK is not configured. Earlier versions of
  // this function fell through to `decodeUnverifiedJwt` here, which let
  // forged cookies pass through silently — the original reason for every
  // "401 that re-logging-in can't fix" report.
  if (!adminAuth) {
    console.warn(
      "[firebase-admin] Admin SDK not configured — refusing to verify cookies. Check FIREBASE_PRIVATE_KEY on the server."
    );
    return null;
  }
  try {
    // Disable strict revocation check (second parameter true) to prevent network-bound verification delays/failures.
    const decoded = await adminAuth.verifySessionCookie(sessionCookie);
    return { uid: decoded.uid, email: decoded.email ?? null };
  } catch (err) {
    console.warn("[firebase-admin] verifySessionCookie failed, trying verifyIdToken:", err);
    try {
      // Sometimes the cookie is a raw ID token instead of a session cookie.
      // Only fall back to this when the admin SDK itself is configured — the
      // signature is still verified here.
      const decoded = await adminAuth.verifyIdToken(sessionCookie);
      return { uid: decoded.uid, email: decoded.email ?? null };
    } catch (idErr) {
      console.warn("[firebase-admin] verifyIdToken failed:", idErr);
      return null;
    }
  }
}

export async function getCurrentUser(): Promise<{ uid: string; email: string | null } | null> {
  try {
    const store = await cookies();
    const session = store.get(SESSION_COOKIE)?.value;
    if (!session) return null;
    return verifySessionCookie(session);
  } catch (error) {
    log.error(error, { step: "getSessionCookie" });
    return null;
  }
}

/**
 * Public flag for routes that need to differentiate between "user not
 * logged in" (401) and "server is misconfigured and CAN'T verify anyone"
 * (503). Lets us return the right status code instead of masking every
 * problem as 401.
 */
export const isAuthConfigured = (): boolean => adminAuth !== null;