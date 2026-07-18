import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "pp_session";
const PROTECTED_PREFIXES = ["/dashboard"];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // The Next.js image optimizer is not bundled in `output: "standalone"`,
  // so `/_next/image?...` would 404 even though `images.unoptimized` is
  // true. Forward these requests to our file-serving proxy in middleware
  // because Next.js's built-in handler intercepts the rewrite before
  // it can match.
  if (pathname === "/_next/image") {
    const url = request.nextUrl.clone();
    url.pathname = "/api/image-proxy";
    return NextResponse.rewrite(url);
  }

  // Server-side auth gate for protected prefixes. We require the
  // session cookie to be PRESENT here. The cookie is HTTPOnly + signed
  // by Firebase; cryptographic verification is performed by the API
  // routes via `verifySessionCookie` (`src/lib/firebase/admin.ts`).
  // This blocks direct URL access / link sharing for unauthenticated
  // visitors and prevents search engines from indexing the dashboard.
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtected) {
    const hasSession = request.cookies.get(SESSION_COOKIE)?.value;
    if (!hasSession) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.search = "";
      loginUrl.searchParams.set("next", pathname + search);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/_next/image"],
};
