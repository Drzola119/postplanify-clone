import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { getAccountAnalytics } from "@/lib/db/analytics";
import { readCache } from "@/lib/db/account-health";
import { analyticsOverviewQuerySchema } from "@/lib/validation/analytics";
import { platformIdSchema } from "@/lib/validation/posts";
import { parseSearchParams, jsonError, jsonOk } from "@/lib/validation/helpers";
import type { PlatformId as DbPlatformId } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Per-account analytics.
 *
 * Resolves the platform for `id` (e.g. "nick-lorance:tiktok") from the
 * cached social-accounts snapshot, then aggregates the per-day series for
 * that platform within the date range and counts published posts.
 *
 * Platforms that exist at upload-post.com but aren't yet wired into the
 * analytics store (google_business, reddit, discord, telegram) return an
 * empty analytics payload so the page still renders.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const { id } = await params;
  if (!id) return jsonError(400, "Missing account id");

  // Default range: last 7 days.
  const url = new URL(request.url);
  const parsed = parseSearchParams(url.searchParams, analyticsOverviewQuerySchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid query");
  }

  const from = new Date(parsed.data.from);
  const to = new Date(parsed.data.to);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return jsonError(400, "Invalid date range");
  }

  // Look up the platform for this account id from the cached snapshot.
  const cache = await readCache(session.workspaceId).catch(() => null);
  const acct = cache?.accounts?.find((a) => a.id === id);
  if (!acct) {
    return jsonError(404, "Account not found in workspace snapshot. Try refreshing accounts.");
  }
  const platformCheck = platformIdSchema.safeParse(acct.platform);
  if (!platformCheck.success) {
    // Newer platforms that don't have analytics storage yet — return an empty
    // payload so the page still renders with 0s and a "collecting" state.
    return jsonOk({
      analytics: {
        accountId: id,
        platform: acct.platform,
        from: from.toISOString(),
        to: to.toISOString(),
        totals: {
          followers: 0,
          impressions: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          clicks: 0,
          engagementRate: 0,
          postsPublished: 0,
        },
        series: [],
      },
    });
  }
  const platform: DbPlatformId = platformCheck.data as DbPlatformId;

  const analytics = await getAccountAnalytics(
    session.workspaceId,
    id,
    platform,
    from,
    to
  );
  return jsonOk({ analytics });
}
