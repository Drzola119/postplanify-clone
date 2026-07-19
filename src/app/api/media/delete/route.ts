import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/firebase/admin";
import { deleteFromBunny } from "@/lib/bunny";
import { parseBody } from "@/lib/validation/helpers";

const deleteMediaSchema = z.object({
  storedPath: z.string().min(1),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await parseBody(request, deleteMediaSchema);
  if (!parsed.ok || !parsed.data) {
    return NextResponse.json({ error: "Missing storedPath" }, { status: 400 });
  }
  const storedPath = parsed.data.storedPath.trim();

  try {
    await deleteFromBunny({ userId: user.uid, storedPath });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Delete failed";
    const status = msg.startsWith("Forbidden") ? 403 : 502;
    return NextResponse.json({ error: msg }, { status });
  }
}
