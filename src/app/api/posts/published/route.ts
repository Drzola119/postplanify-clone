import "server-only";
import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { adminDb } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/validation/helpers";
import type { PlatformId } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface PublishedPostDTO {
  id: string;
  caption: string;
  platforms: string[];
  publishedAt: string | null;
  mediaUrls: string[];
}

/**
 * GET /api/posts/published?from=...&to=...&platform=...&limit=50
 *
 * Returns published posts for the workspace in the given date range,
 * optionally filtered to a specific platform. Sorted by publishedAt desc.
 */
export async function GET(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  if (!adminDb) return jsonError(503, "Database not configured");

  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const platform = url.searchParams.get("platform");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 100);

  if (!from || !to) return jsonError(400, "Missing from/to query params");

  const fromDate = new Date(from);
  const toDate = new Date(to);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return jsonError(400, "Invalid date range");
  }

  let query: FirebaseFirestore.Query = adminDb
    .collection(`workspaces/${session.workspaceId}/posts`)
    .where("status", "==", "published");

  if (platform) {
    query = query.where("platforms", "array-contains", platform as PlatformId);
  }

  const snapshot = await query.get();

  const posts: PublishedPostDTO[] = snapshot.docs
    .map((doc) => {
      const d = doc.data() as Record<string, unknown>;
      return {
        id: doc.id,
        caption: (d.caption as string) ?? "",
        platforms: (d.platforms as string[]) ?? [],
        publishedAt: d.publishedAt
          ? typeof d.publishedAt === "string"
            ? d.publishedAt
            : (d.publishedAt as { toDate?: () => Date }).toDate?.().toISOString() ?? null
          : null,
        mediaUrls: (d.mediaUrls as string[]) ?? [],
      };
    })
    .filter((p) => {
      if (!p.publishedAt) return false;
      const t = new Date(p.publishedAt).getTime();
      return t >= fromDate.getTime() && t <= toDate.getTime();
    })
    .sort((a, b) => {
      if (!a.publishedAt || !b.publishedAt) return 0;
      return b.publishedAt.localeCompare(a.publishedAt);
    })
    .slice(0, limit);

  return jsonOk({ posts });
}
