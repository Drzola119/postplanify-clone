import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { getAnalytics, recordClick, recordView } from "@/lib/db/link-in-bio";
import { jsonOk } from "@/lib/validation/helpers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { username } = await params;
  const data = await getAnalytics(username);
  return jsonOk(data);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  if (!/^[a-z0-9_-]{3,30}$/.test(username)) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }
  const body = await request.json().catch(() => ({})) as { type?: string; linkId?: string };
  if (body.type === "click" && body.linkId) {
    void recordClick(username, body.linkId).catch(() => {});
  } else if (body.type === "view") {
    void recordView(username).catch(() => {});
  } else {
    return NextResponse.json({ error: "Invalid analytics event" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
