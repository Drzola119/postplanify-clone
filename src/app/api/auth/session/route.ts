import { NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_MAX_AGE_MS, createSessionCookie, getCurrentUser } from "@/lib/firebase/admin";

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({ user });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { idToken?: string } | null;
  if (!body?.idToken) {
    return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
  }

  try {
    // Server must be configured to mint a verified session cookie. Without
    // Firebase Admin credentials, an unverified bearer would persist and the
    // verify path would have nothing to trust — so we refuse, not fall back.
    const sessionCookie = await createSessionCookie(body.idToken);
    if (!sessionCookie) {
      const isProd = process.env.NODE_ENV === "production";
      return NextResponse.json(
        {
          error: isProd
            ? "Authentication server is not configured. Contact the administrator."
            : "Auth server not configured. Set FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY to enable login.",
        },
        { status: 503 }
      );
    }
    const res = NextResponse.json({ ok: true, fallback: false });
    res.cookies.set(SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_MS / 1000,
    });
    return res;
  } catch (error) {
    console.error("[Auth Session] Error creating session cookie:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
