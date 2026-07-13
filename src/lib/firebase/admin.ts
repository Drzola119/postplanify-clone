import "server-only";
import { cookies } from "next/headers";
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_PROJECT_ID || "postplanify-best";
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || "firebase-adminsdk-fbsvc@postplanify-best.iam.gserviceaccount.com";
let privateKey = process.env.FIREBASE_PRIVATE_KEY || "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDSDQ+/O7AGO6BX\nLfexjkmTDj9VEk2nNYxNn7eWqmK+0Wmj/Xwkc8x02zsSwcNmG8Te2tzTnKqaN0po\n/VjOILwM33WY5StW0RiM+NxWOuf40ml7tkOQz1S00G4TtKiG7yrdwTTRqn09G4pr\nW7Y40L7Bs1iQuziOylDKdy/Cb1hMeGHx3Wo01JEzore3dE74WHiTt8pRDR6iqmvI\nFTh9TvoSRAx4lW7uF9izjVwvomjxmMzlc1sgYLjP6FggiQkKAyKQEucQ+i1aPOus\nO8DuUXIzkhF+2pElcnWitj6qVnShzr44GL7zg5g0V54KvFRggWeszD7j1zA+YqK3\nPvPlQQpxAgMBAAECggEAUAmCEpAfxoA53H47f4CEMHChWT0cMbaJu5o8TkCmV6db\n5YzVHN6y7WQL4l3KosG6BmDG/CsaJqEizVab3A9FGHKdUKEiHnaWMEEzU/gmI/2p\nC+arYCZgVHWHPCL+hEvlvZG9GpcoGXzBBZ9wk72WsiAwgxWTu3UDy+IWZLQgpSIY\nbAYV6uzKyjWWAUwaTGL7WEcIvrqKYeSFxQ1YWbK9EuH7QQf1JDQepFU2xoT+g22p\nfz3eSRVHzW7ztzE41FGHsvpV9gcFrEUsZ6YN8nMeu3gLj6dUMndswhNcm2MU0Q5b\nyM4ddVb9IJ66PNBiFu7rnf3BcRzRVPkYckMIlazVcQKBgQD8/x1+IFrQCrEzHWIM\npkmUWxdZMst4BAhcLaZzE+5XyHIkOLoouTuxJ5Wu+ufuM0wddpXqcPWbiyO5y5Uk\nY3ay7bbXJq4l9g/N2Qwj0oQpI5CIJrrlnkcc5mm8mgrSN7D0Pc1nweIpIXhsmY6a\nf55F/h8qlfXOgCcHQ3HMB3z84wKBgQDUi24YcCMXZ9e5GdL9tm10M1qEKvnBjl1r\npTnw7cECrTpeUMzRYQKrvsZ6hn8iIA5OR9/3hgHC0p7MmwWwhClTFsEsVB+KXxpz\nrtRb8eyFEZOmiyV+kS27oF9iYP+Q/E+aQWEM8A66+s2IAqQKF9MndG8AjQwgPP+P\nXLhrJlTvmwKBgQDIMcuRqWKS61MKwn56yf7BUU9peuM8pdxDrK/gse3RMsD3XpgY\nb3MHnO46Fzr950OcsOCyMg53taNgevMaZ0ZfEfGz0FzPlyUsW0ra8dM4hnbw9czA\ns/1LphwXbMGRVRZGPr1SFD61E1IqhVwtbzy73/mjhiSK8idv/POIYoiJxwKBgEgb\njZxo3t7f8gXwRu6gZ33WtkzEr7sE65jLk16zqpmX34eD7hjSyq8tp/SFkLgpG/Fe\n3RMCubI49nr/1OxPyh1QSPUbDSBKp5S7qXwQFWgH0IneBzhrVJKlE/cyZUHw96ij\nqaNUBgtVb0lHbBOohZCLJeWP9J8zUph2onJnrMUlAoGBANUHV1Iis7+RkcWgNVqj\n9cYmwD3JnQOz+W/z6mblWek7JycD4wV/UKV3cOkTQ9xn2t6Rja6+7y37cBAvAG/F\nSWqOpIcuDFReuCWyjsjhoXETvju3xVvn/D2+A4umyG/QaZFW/6rmi+yG0rNYrHIe\nAhTuwahqPoc0dM8r7Qv0G3UA\n-----END PRIVATE KEY-----";

if (privateKey) {
  privateKey = privateKey.trim().replace(/^["']/, "").replace(/["']$/, "");
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
export const adminDb: Firestore | null = adminApp ? getFirestore(adminApp) : null;

export const SESSION_COOKIE = "pp_session";
export const SESSION_MAX_AGE_MS = 60 * 60 * 24 * 5 * 1000;

export async function createSessionCookie(idToken: string): Promise<string | null> {
  if (!adminAuth) return null;
  return adminAuth.createSessionCookie(idToken, { expiresIn: SESSION_MAX_AGE_MS });
}

function decodeUnverifiedJwt(token: string): { uid: string; email: string | null } | null {
  // DEV-ONLY escape hatch: when Firebase Admin is not configured (missing
  // FIREBASE_* env vars) we accept an unverified ID-token-style JWT so a
  // developer can run the dashboard against a local Auth emulator. This is
  // explicitly gated to NODE_ENV !== "production" and never used in prod.
  if (process.env.NODE_ENV === "production") return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payloadBuf = Buffer.from(parts[1], "base64");
    const payload = JSON.parse(payloadBuf.toString("utf-8"));
    const uid = payload.user_id || payload.sub;
    if (!uid) return null;
    return { uid, email: payload.email ?? null };
  } catch (error) {
    console.error("[firebase-admin] Failed to decode JWT (dev-only):", error);
    return null;
  }
}

export async function verifySessionCookie(
  sessionCookie: string
): Promise<{ uid: string; email: string | null } | null> {
  if (!adminAuth) {
    // Production must never accept an unverified token. In dev we accept one
    // so the dashboard works without FIREBASE_* env vars, but it logs a
    // warning to make the footgun obvious.
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[firebase-admin] Admin SDK not configured — falling back to UNVERIFIED JWT decode. " +
          "This is a dev-only path; set FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY for production."
      );
      return decodeUnverifiedJwt(sessionCookie);
    }
    return null;
  }
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    return { uid: decoded.uid, email: decoded.email ?? null };
  } catch {
    try {
      const decoded = await adminAuth.verifyIdToken(sessionCookie);
      return { uid: decoded.uid, email: decoded.email ?? null };
    } catch {
      // Both signature checks failed. Refuse; do NOT fall back to unverified
      // decode — that would let any forged JWT pass.
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
    console.error("[firebase-admin] Failed to get session cookie:", error);
    return null;
  }
}
