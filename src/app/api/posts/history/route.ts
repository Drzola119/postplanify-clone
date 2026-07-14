import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { listPostsHistory } from "@/lib/db/posts";
import { historyFiltersSchema } from "@/lib/validation/posts";
import { jsonError, jsonOk, parseSearchParams } from "@/lib/validation/helpers";
import type { PlatformId } from "@/lib/db/schema";

export async function GET(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const url = new URL(request.url);
  const parsed = parseSearchParams(url.searchParams, historyFiltersSchema);
  if (!parsed.ok) return jsonError(400, "Invalid history filters", parsed.error.issues);
  const filters = parsed.data;

  const result = await listPostsHistory(session.workspaceId, {
    platform: filters.platform,
    status: filters.status,
    from: filters.from ? new Date(filters.from) : undefined,
    to: filters.to ? new Date(filters.to) : undefined,
    pageSize: filters.pageSize,
  });

  const items = result.items;
  const stats = computeStats(items);

  return jsonOk({ posts: items, stats });
}

function computeStats(items: Array<{ status: string; platforms: PlatformId[]; publishedAt?: string }>) {
  let published = 0;
  let failed = 0;
  const byPlatform = {} as Record<string, { published: number; failed: number }>;

  for (const p of items) {
    if (p.status === "published") published++;
    else if (p.status === "failed") failed++;
    for (const plat of p.platforms ?? []) {
      const bucket = byPlatform[plat] ?? { published: 0, failed: 0 };
      if (p.status === "published") bucket.published++;
      else if (p.status === "failed") bucket.failed++;
      byPlatform[plat] = bucket;
    }
  }

  const total = published + failed;
  const successRate = total === 0 ? null : Math.round((published / total) * 1000) / 10;

  return { published, failed, total, successRate, byPlatform };
}
