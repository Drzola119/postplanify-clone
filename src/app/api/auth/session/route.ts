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
  const sessionCookie = await createSessionCookie(body.idToken);
  if (!sessionCookie) {
    return NextResponse.json(
      { error: "Server auth not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY." },
      { status: 500 }
    );
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_MS / 1000,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
