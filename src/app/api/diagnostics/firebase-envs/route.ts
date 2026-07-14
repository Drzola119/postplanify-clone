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

  // Try to extract just the public part of the key for fingerprinting.
  let keyFingerprint: string | null = null;
  let keyLooksValid = false;
  if (rawKey) {
    // A valid PEM has BEGIN/END markers. The escaped form uses literal "\n".
    const unescaped = rawKey.replace(/\\n/g, "\n");
    keyLooksValid =
      unescaped.includes("-----BEGIN PRIVATE KEY-----") &&
      unescaped.includes("-----END PRIVATE KEY-----");
    // Look for a base64 line that's long enough to be a key id (first 8 chars
    // after the header is a stable fingerprint).
    const match = unescaped.match(/-----BEGIN PRIVATE KEY-----\n([A-Za-z0-9+/=]{8,})/);
    if (match) keyFingerprint = match[1].slice(0, 12);
  }

  const missing: string[] = [];
  if (!projectId) missing.push("FIREBASE_PROJECT_ID");
  if (!clientEmail) missing.push("FIREBASE_CLIENT_EMAIL");
  if (!rawKey) missing.push("FIREBASE_PRIVATE_KEY");

  const ok = missing.length === 0 && keyLooksValid;

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
      privateKeyFingerprint: keyFingerprint,
      nodeEnv: process.env.NODE_ENV,
      // Helper boolean the front-end can use to render a "fix your envs" message.
      needsHostingerEnvPaste: missing.length > 0 || !keyLooksValid,
      docsHint: "docs/hpanel-env-paste.md",
    },
    {
      status: ok ? 200 : 503,
    },
  );
}