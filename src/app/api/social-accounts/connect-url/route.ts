import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { resolvers, MissingServerSecretError } from "@/lib/security/server-config";
import { generateConnectUrl, ensureProfile } from "@/lib/db/upload-post-profiles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALL_PLATFORMS = [
  "tiktok",
  "instagram",
  "linkedin",
  "youtube",
  "facebook",
  "x",
  "threads",
  "pinterest",
  "discord",
  "telegram",
] as const;

export async function GET(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  let apiKey: string;
  try {
    apiKey = resolvers.uploadPostApiKey(request.headers);
  } catch (err) {
    if (err instanceof MissingServerSecretError) {
      return NextResponse.json(
        { error: `${err.secret} not configured on server` },
        { status: 500 }
      );
    }
    throw err;
  }

  // Ensure the profile exists before we try to generate a URL for it. This
  // also gives us a clearer error path if upload-post.com is down.
  try {
    await ensureProfile(session.workspaceId, apiKey);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to provision profile";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  // Build a redirect URL that points back to the accounts page. We pass
  // ?connected=1 so the UI can show a success toast.
  const reqUrl = new URL(request.url);
  const origin = reqUrl.origin;
  const redirectUrl = `${origin}/dashboard/accounts?connected=1`;

  try {
    const result = await generateConnectUrl(session.workspaceId, apiKey, {
      redirectUrl,
      platforms: [...ALL_PLATFORMS],
      connectTitle: "Connect your social accounts",
      connectDescription:
        "Link the social media accounts you want to schedule and publish to from Trustiify.",
      redirectButtonText: "Back to Trustiify",
    });
    return NextResponse.json({ ok: true, ...result, redirectUrl });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to generate connect URL";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  // Same as GET — kept as a POST so the client can call it via fetch with
  // explicit method if desired, and so future options (logoImage, etc.) can
  // be sent via body without changing the URL semantics.
  return GET(request);
}