import { NextRequest } from "next/server";
import { adminDb } from "@/lib/db";
import { ingestDailyMetric } from "@/lib/db/analytics";
import { analyticsIngestSchema } from "@/lib/validation/analytics";
import { parseBody, jsonError, jsonOk } from "@/lib/validation/helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Service-to-service ingestion endpoint for daily per-platform analytics.
 * Auth: shared secret in `X-Ingest-Secret` header (env: ANALYTICS_INGEST_SECRET).
 *
 * Body: { date: ISO date, platform: PlatformId, followers?, engagementRate?, ... }
 * Required: workspaceId (header `X-Workspace-Id`) — caller is trusted to provide
 * the right one because they hold the shared secret.
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-ingest-secret");
  const expected = process.env.ANALYTICS_INGEST_SECRET?.trim();
  if (!expected || secret !== expected) {
    return jsonError(401, "Unauthorized");
  }

  const workspaceId = request.headers.get("x-workspace-id")?.trim();
  if (!workspaceId) return jsonError(400, "Missing X-Workspace-Id header");
  if (!adminDb) return jsonError(503, "Database not configured");

  const parsed = await parseBody(request, analyticsIngestSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid payload", parsed.error?.issues);
  }

  const date = new Date(parsed.data.date);
  if (Number.isNaN(date.getTime())) return jsonError(400, "Invalid date");

  await ingestDailyMetric(workspaceId, date, parsed.data.platform, {
    followers: parsed.data.followers,
    engagementRate: parsed.data.engagementRate,
    impressions: parsed.data.impressions,
    likes: parsed.data.likes,
    comments: parsed.data.comments,
    shares: parsed.data.shares,
    clicks: parsed.data.clicks,
  });

  return jsonOk({ ingested: true });
}
