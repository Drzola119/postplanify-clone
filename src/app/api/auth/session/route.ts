import { NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE, SESSION_MAX_AGE_MS, createSessionCookie, getCurrentUser } from "@/lib/firebase/admin";
import { createLogger } from "@/lib/log";
import { parseBody } from "@/lib/validation/helpers";

const log = createLogger("auth/session");

const sessionSchema = z.object({
  idToken: z.string().min(1),
});

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({ user });
}

export async function POST(request: Request) {
  const parsed = await parseBody(request, sessionSchema);
  if (!parsed.ok || !parsed.data) {
    return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
  }
  const body = parsed.data;

  // Try to mint a proper Firebase session cookie. If that fails (e.g. Node
  // version mismatch with firebase-admin, network issues, missing credentials),
  // fall back to storing the raw idToken as the cookie. Our verifySessionCookie
  // has a decode chain that handles both formats.
  let cookieValue: string;
  let fallback = false;

  try {
    const sessionCookie = await createSessionCookie(body.idToken);
    if (sessionCookie) {
      cookieValue = sessionCookie;
    } else {
      console.warn("[auth/session] createSessionCookie returned null — using raw idToken as fallback cookie.");
      cookieValue = body.idToken;
      fallback = true;
    }
  } catch (error) {
    console.warn("[auth/session] createSessionCookie threw — using raw idToken as fallback cookie:", error);
    cookieValue = body.idToken;
    fallback = true;
  }

  const res = NextResponse.json({ ok: true, fallback });
  res.cookies.set(SESSION_COOKIE, cookieValue, {
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
