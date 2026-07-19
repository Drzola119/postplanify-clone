import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: ["/admin/:path*"],
};

export async function middleware(req: NextRequest) {
  const sessionCookie = req.cookies.get("session")?.value;

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login?redirect=" + encodeURIComponent(req.nextUrl.pathname), req.url));
  }

  // Verify the Firebase session cookie via the Admin REST endpoint.
  // We cannot import firebase-admin here (Edge runtime), so we call the
  // Identity Toolkit REST API directly.
  try {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const adminEmail = process.env.ADMIN_EMAIL ?? "edylabels@gmail.com";

    if (!apiKey || !projectId) {
      // Missing env — fail open in development so local work isn't blocked,
      // but log a loud warning.
      console.warn("[middleware] Firebase env vars missing — admin route unprotected!");
      return NextResponse.next();
    }

    // Exchange the session cookie for user data via the Identity Toolkit.
    const verifyRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: sessionCookie }),
      }
    );

    if (!verifyRes.ok) {
      throw new Error(`identity toolkit ${verifyRes.status}`);
    }

    const payload = await verifyRes.json();
    const user = payload?.users?.[0];

    if (!user) throw new Error("no user in token");

    const email: string = (user.email ?? "").toLowerCase();
    if (email !== adminEmail.toLowerCase()) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  } catch (err) {
    console.error("[middleware] Admin auth check failed:", err);
    return NextResponse.redirect(new URL("/login?redirect=" + encodeURIComponent(req.nextUrl.pathname), req.url));
  }
}
