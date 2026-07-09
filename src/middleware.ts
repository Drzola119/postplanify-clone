import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "pp_session";
const PROTECTED_PREFIXES = ["/dashboard"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

  // Dashboard auth is handled client-side by the DashboardLayout component
  // (src/app/dashboard/layout.tsx) which checks AuthContext status and
  // redirects to /login when unauthenticated. The middleware no longer
  // enforces cookie-based auth because the Firebase Admin SDK may not
  // initialize correctly on all hosting providers (e.g. Hostinger env var
  // formatting issues), which creates an infinite redirect loop.
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/_next/image"],
};
