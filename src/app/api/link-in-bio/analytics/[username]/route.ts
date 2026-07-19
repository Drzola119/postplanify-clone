import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session-context";
import { getAnalytics, recordClick, recordView } from "@/lib/db/link-in-bio";
import { jsonOk } from "@/lib/validation/helpers";

const analyticsEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("click"), linkId: z.string().min(1) }),
  z.object({ type: z.literal("view") }),
]);

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
  const parsed = analyticsEventSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid analytics event" }, { status: 400 });
  }
  const body = parsed.data;
  if (body.type === "click") {
    void recordClick(username, body.linkId).catch(() => {});
  } else {
    void recordView(username).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}
