import "server-only";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/firebase/admin";
import { deleteFromBunny } from "@/lib/bunny";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { storedPath?: string } | null;
  const storedPath = body?.storedPath?.trim();
  if (!storedPath) {
    return NextResponse.json({ error: "Missing storedPath" }, { status: 400 });
  }

  try {
    await deleteFromBunny({ userId: user.uid, storedPath });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Delete failed";
    const status = msg.startsWith("Forbidden") ? 403 : 502;
    return NextResponse.json({ error: msg }, { status });
  }
}
