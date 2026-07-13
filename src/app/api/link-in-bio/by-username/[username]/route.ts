import { NextRequest, NextResponse } from "next/server";
import { getByUsername, recordClick } from "@/lib/db/link-in-bio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public, unauthenticated read of a link-in-bio by username.
 * Records a click for analytics when called with ?block=ID.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  if (!/^[a-z0-9_-]{3,30}$/.test(username)) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }
  const bio = await getByUsername(username);
  if (!bio) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Record click (fire-and-forget). The blockId query param is set when
  // the user clicks a specific link block.
  const blockId = new URL(request.url).searchParams.get("block");
  void recordClick(username, blockId).catch(() => {
    /* analytics is best-effort */
  });

  return NextResponse.json({ bio });
}
