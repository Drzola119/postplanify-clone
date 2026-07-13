import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { getTrending } from "@/lib/db/hashtags";
import { trendingHashtagFilterSchema } from "@/lib/validation/hashtags";
import { parseSearchParams, jsonError, jsonOk } from "@/lib/validation/helpers";

export async function GET(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const url = new URL(request.url);
  const parsed = parseSearchParams(url.searchParams, trendingHashtagFilterSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid filters");
  }
  const items = await getTrending(session.workspaceId, parsed.data.platform);
  return jsonOk({ trending: items });
}
