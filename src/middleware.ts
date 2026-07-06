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

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // If server-side admin SDK isn't configured, let everything through
  // and rely on client-side auth guards instead
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKey) {
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
  matcher: ["/dashboard/:path*", "/_next/image"],
};
