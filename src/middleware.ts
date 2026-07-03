import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "pp_session";
const PROTECTED_PREFIXES = ["/dashboard"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Intercept missing JS chunks to trigger self-healing reload
  if (pathname.startsWith("/_next/static/chunks/") && pathname.endsWith(".js")) {
    if (request.headers.get("x-bypass-middleware") === "1") {
      return NextResponse.next();
    }

    try {
      const checkUrl = new URL(request.url);
      checkUrl.searchParams.set("check_cb", Date.now().toString());

      const res = await fetch(checkUrl.toString(), {
        headers: { "x-bypass-middleware": "1" },
        method: "HEAD",
      });

      if (res.status === 404) {
        return new NextResponse(
          `console.warn("Chunk load failed: ${pathname}. Triggering self-healing reload.");` +
          `var url = new URL(window.location.href);` +
          `url.searchParams.set("cb", Date.now().toString());` +
          `window.location.replace(url.toString());`,
          {
            headers: {
              "Content-Type": "application/javascript",
              "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            },
          }
        );
      }
    } catch (err) {
      // Fallback silently if fetch fails
    }
  }

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // If server-side admin SDK isn't configured, let everything through
  // and rely on client-side auth guards instead
  if (!process.env.FIREBASE_PRIVATE_KEY) {
    return NextResponse.next();
  }

  // Only check cookie existence here (Edge-compatible).
  // Actual verification happens in API routes (Node.js runtime).
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/_next/static/chunks/:path*",
  ],
};
