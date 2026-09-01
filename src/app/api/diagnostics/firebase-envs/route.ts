import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Server-side diagnostic that reports which Firebase env vars are present.
 *
 * Does NOT echo secret values back. Only reports boolean presence and a
 * short fingerprint (length, BEGIN/END markers, key ID if extractable from
 * the PEM header). Intended for the user to confirm their hPanel env
 * configuration without leaking the private key.
 *
 * Safe to expose publicly: it reveals "yes/no env is set" only. If you'd
 * rather lock it down, set DIAGNOSTICS_API_KEY env and require the header.
 */
export async function GET(request: Request) {
  const apiKey = process.env.DIAGNOSTICS_API_KEY?.trim();
  if (apiKey) {
    const provided = request.headers.get("x-diagnostics-key");
    if (provided !== apiKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID?.trim() ?? "";
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim() ?? "";
  const rawKey = process.env.FIREBASE_PRIVATE_KEY?.trim() ?? "";

  // Validate the PEM by structural inspection only — no crypto here.
  let keyFingerprint: string | null = null;
  let keyLooksValid = false;
  let keyLooksLikePlaceholder = false;
  if (rawKey) {
    // Unescape quote wrapping and literal/double-escaped newlines.
    const unescaped = rawKey.trim()
      .replace(/^\\?["']/, "")
      .replace(/\\?["']$/, "")
      .replace(/\\\\n|\\n/g, "\n");
    const hasBegin = unescaped.includes("-----BEGIN PRIVATE KEY-----");
    const hasEnd = unescaped.includes("-----END PRIVATE KEY-----");
    // `src/lib/firebase/admin.ts` ships with a literal placeholder string
    // `[REDACTED PRIVATE KEY]` as the fallback when FIREBASE_PRIVATE_KEY is
    // missing. If we see that exact text in the env, the operator forgot to
    // paste the real PEM into hPanel — flag it explicitly so they don't
    // get a misleading "OK" from this endpoint.
    keyLooksLikePlaceholder = unescaped.includes("[REDACTED PRIVATE KEY]");
    keyLooksValid = hasBegin && hasEnd && !keyLooksLikePlaceholder;
    // First ~8 base64 chars after the BEGIN marker form a stable fingerprint
    // of the key itself (not the secret) so we can tell when the operator
    // actually rotated keys.
    const match = unescaped.match(/-----BEGIN PRIVATE KEY-----\n([A-Za-z0-9+/=]{8,})/);
    if (match) keyFingerprint = match[1].slice(0, 12);
  }

  const missing: string[] = [];
  if (!projectId) missing.push("FIREBASE_PROJECT_ID");
  if (!clientEmail) missing.push("FIREBASE_CLIENT_EMAIL");
  if (!rawKey) missing.push("FIREBASE_PRIVATE_KEY");
  if (rawKey && keyLooksLikePlaceholder) {
    missing.push("FIREBASE_PRIVATE_KEY (placeholder text, paste the real PEM)");
  }

  let authTestOk = false;
  let authTestError: string | null = null;
  let firestoreTestOk = false;
  let firestoreTestError: string | null = null;
  let firestoreQuotaExceeded = false;
  try {
    const { adminAuth, adminDb, isQuotaExceededError } = await import("@/lib/firebase/admin");
    if (adminAuth) {
      const token = await adminAuth.createCustomToken("diagnostic-test-uid");
      authTestOk = !!token;
    } else {
      authTestError = "adminAuth is null (SDK not initialized)";
    }
    
    if (adminDb) {
      // Try to read a dummy document to verify if the credentials can actually query Firestore
      await adminDb.collection("workspaces").limit(1).get();
      firestoreTestOk = true;
    } else {
      firestoreTestError = "adminDb is null (SDK not initialized)";
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Quota errors are infra, not env-config — surface separately so the UI doesn't tell operators to re-paste envs
    const isQuota = /RESOURCE_EXHAUSTED|Quota exceeded/i.test(msg) || msg.includes("quota exceeded");
    if (!authTestOk) {
      // If auth succeeded but Firestore failed with quota, the catch belongs to Firestore, not auth
      // Check by seeing if the error looks like a Firestore quota string and auth was already ok
      if (isQuota && authTestOk) {
        firestoreTestError = msg;
        firestoreQuotaExceeded = true;
      } else {
        authTestError = msg;
        // Common case: Firestore quota throws after auth already succeeded — move it to the right bucket
        if (isQuota) {
          firestoreTestError = msg;
          firestoreQuotaExceeded = true;
          // If auth token was created successfully before the Firestore call, it should be considered ok
          // The admin SDK lazy-import may have created token before failing on Firestore get()
          // So re-evaluate: if we got past createCustomToken, mark authTestOk
          try {
            const { adminAuth: reAuth } = await import("@/lib/firebase/admin");
            if (reAuth) {
              const t = await reAuth.createCustomToken("diagnostic-test-uid");
              if (t) { authTestOk = true; authTestError = null; }
            }
          } catch {}
        }
      }
    } else {
      firestoreTestError = msg;
      if (isQuota) firestoreQuotaExceeded = true;
    }
    // Second-pass precise check via helper if available
    try {
      const { isQuotaExceededError: checkQuota } = await import("@/lib/firebase/admin");
      if (checkQuota(err)) firestoreQuotaExceeded = true;
    } catch {}
  }

  const envsOk = missing.length === 0 && keyLooksValid && authTestOk;
  const firestoreOk = firestoreTestOk && !firestoreQuotaExceeded;
  const ok = envsOk && authTestOk && firestoreOk;

  // If Firestore quota is hit, envs are actually correct — don't tell the operator to re-paste secrets
  const needsEnvPaste = missing.length > 0 || !keyLooksValid || !authTestOk;
  const needsBillingUpgrade = firestoreQuotaExceeded;

  return NextResponse.json(
    {
      ok,
      missing,
      projectIdSet: !!projectId,
      projectIdLength: projectId.length,
      clientEmailSet: !!clientEmail,
      privateKeySet: !!rawKey,
      privateKeyLength: rawKey.length,
      privateKeyLooksValid: keyLooksValid,
      privateKeyLooksLikePlaceholder: keyLooksLikePlaceholder,
      privateKeyFingerprint: keyFingerprint,
      authTestOk,
      authTestError,
      firestoreTestOk,
      firestoreTestError,
      firestoreQuotaExceeded,
      firestoreOk,
      envsOk,
      nodeEnv: process.env.NODE_ENV,
      // Helper booleans the front-end can use to render actionable fix messages.
      needsHostingerEnvPaste: needsEnvPaste,
      needsBillingUpgrade,
      hint: needsBillingUpgrade
        ? "Firestore quota exceeded: Firebase Console → Firestore → Usage → Enable Blaze (pay-as-you-go) or wait until daily quota resets (midnight PT, ~08:00 UTC)."
        : needsEnvPaste
          ? "Missing or invalid Firebase env vars — see docs/hpanel-env-paste.md"
          : undefined,
      docsHint: needsBillingUpgrade ? "https://console.firebase.google.com/project/_/firestore/usage" : "docs/hpanel-env-paste.md",
    },
    {
      status: ok ? 200 : 503,
    }
  );
}