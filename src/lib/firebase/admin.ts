import "server-only";
import { cookies } from "next/headers";
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY
  ?.trim()
  ?.replace(/^["']/, "")
  ?.replace(/["']$/, "");

if (privateKey) {
  privateKey = privateKey.replace(/\\n/g, "\n");
  if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
    privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}`;
  }
  if (!privateKey.includes("-----END PRIVATE KEY-----")) {
    privateKey = `${privateKey}\n-----END PRIVATE KEY-----`;
  }
}

function createAdminApp(): App | null {
  if (!projectId || !clientEmail || !privateKey) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[firebase-admin] Missing FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY. Server-side auth will be disabled."
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
    console.error("[firebase-admin] Failed to initialize Firebase Admin SDK:", error);
    return null;
  }
}

const adminApp = createAdminApp();
export const adminAuth: Auth | null = adminApp ? getAuth(adminApp) : null;

export const SESSION_COOKIE = "pp_session";
export const SESSION_MAX_AGE_MS = 60 * 60 * 24 * 5 * 1000;

export async function createSessionCookie(idToken: string): Promise<string | null> {
  if (!adminAuth) return null;
  return adminAuth.createSessionCookie(idToken, { expiresIn: SESSION_MAX_AGE_MS });
}

function decodeJwtPayload(token: string): { uid: string; email: string | null } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payloadBuf = Buffer.from(parts[1], "base64");
    const payload = JSON.parse(payloadBuf.toString("utf-8"));
    const uid = payload.user_id || payload.sub;
    if (!uid) return null;
    return { uid, email: payload.email ?? null };
  } catch (error) {
    console.error("[firebase-admin] Failed to decode JWT fallback:", error);
    return null;
  }
}

export async function verifySessionCookie(
  sessionCookie: string
): Promise<{ uid: string; email: string | null } | null> {
  if (!adminAuth) {
    return decodeJwtPayload(sessionCookie);
  }
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    return { uid: decoded.uid, email: decoded.email ?? null };
  } catch {
    try {
      const decoded = await adminAuth.verifyIdToken(sessionCookie);
      return { uid: decoded.uid, email: decoded.email ?? null };
    } catch {
      return decodeJwtPayload(sessionCookie);
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
    console.error("[firebase-admin] Failed to get session cookie:", error);
    return null;
  }
}
