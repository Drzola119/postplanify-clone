import "server-only";
import { cookies } from "next/headers";
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ?.trim()
  ?.replace(/^["']/, "")
  ?.replace(/["']$/, "")
  ?.replace(/\\n/g, "\n");

function createAdminApp(): App | null {
  if (!projectId || !clientEmail || !privateKey) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[firebase-admin] Missing FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY. Server-side auth will be disabled."
      );
    }
    return null;
  }
  return getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });
}

const adminApp = createAdminApp();
export const adminAuth: Auth | null = adminApp ? getAuth(adminApp) : null;

export const SESSION_COOKIE = "pp_session";
export const SESSION_MAX_AGE_MS = 60 * 60 * 24 * 5 * 1000;

export async function createSessionCookie(idToken: string): Promise<string | null> {
  if (!adminAuth) return null;
  return adminAuth.createSessionCookie(idToken, { expiresIn: SESSION_MAX_AGE_MS });
}

export async function verifySessionCookie(
  sessionCookie: string
): Promise<{ uid: string; email: string | null } | null> {
  if (!adminAuth) return null;
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    return { uid: decoded.uid, email: decoded.email ?? null };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<{ uid: string; email: string | null } | null> {
  const store = await cookies();
  const session = store.get(SESSION_COOKIE)?.value;
  if (!session) return null;
  return verifySessionCookie(session);
}
