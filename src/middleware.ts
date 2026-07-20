import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "pp_session";
const PROTECTED_PREFIXES = ["/dashboard", "/admin"];

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
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtected) {
    const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;
    if (!sessionCookie) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.search = "";
      loginUrl.searchParams.set("next", pathname + search);
      return NextResponse.redirect(loginUrl);
    }

    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      try {
        const payloadBase64 = sessionCookie.split(".")[1];
        if (payloadBase64) {
          const base64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join("")
          );
          const decoded = JSON.parse(jsonPayload);
          // Allow if admin custom claim is set, or if email matches the owner fallback
          const isAdmin = decoded.admin === true || decoded?.email?.toLowerCase() === "edylabels@gmail.com";
          if (!isAdmin) {
            const dashboardUrl = request.nextUrl.clone();
            dashboardUrl.pathname = "/dashboard";
            dashboardUrl.search = "error=access_denied";
            return NextResponse.redirect(dashboardUrl);
          }
        }
      } catch {
        // Fallback to server layout check if decoding fails
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/_next/image"],
};
