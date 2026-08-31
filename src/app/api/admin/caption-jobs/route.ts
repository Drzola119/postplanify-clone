import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/firebase/admin";
import { isAdminUser } from "@/lib/firebase/admin-auth";
import { adminDb } from "@/lib/db";
import type { CaptionJobDoc } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isAdminUser(user)) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required." }, { status: 403 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const workspaceId = searchParams.get("workspaceId");
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50", 10), 1), 200);

  try {
    let query = adminDb.collection("captionJobs") as FirebaseFirestore.Query;

    if (status) {
      query = query.where("status", "==", status);
    }
    if (workspaceId) {
      query = query.where("workspaceId", "==", workspaceId);
    }

    const snap = await query.limit(limit).get();
    const items: CaptionJobDoc[] = [];

    for (const doc of snap.docs) {
      items.push({
        id: doc.id,
        ...(doc.data() as CaptionJobDoc),
      });
    }

    // Sort by priorityScore descending, then scheduledAt ascending
    items.sort((a, b) => {
      if ((b.priorityScore || 0) !== (a.priorityScore || 0)) {
        return (b.priorityScore || 0) - (a.priorityScore || 0);
      }
      return new Date(a.scheduledAt || 0).getTime() - new Date(b.scheduledAt || 0).getTime();
    });

    return NextResponse.json({
      ok: true,
      total: items.length,
      items,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
