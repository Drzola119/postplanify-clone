import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { listAssets, createAsset } from "@/lib/db/media-assets";
import {
  createMediaAssetSchema,
  mediaAssetListFiltersSchema,
} from "@/lib/validation/media";
import { parseBody, parseSearchParams, jsonError, jsonOk } from "@/lib/validation/helpers";

export async function GET(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const url = new URL(request.url);
  const parsed = parseSearchParams(url.searchParams, mediaAssetListFiltersSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid filters");
  }

  const result = await listAssets(session.workspaceId, parsed.data);
  return jsonOk({ assets: result.items, nextCursor: result.nextCursor });
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const parsed = await parseBody(request, createMediaAssetSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(parsed.error?.status ?? 400, parsed.error?.message ?? "Invalid payload", parsed.error?.issues);
  }

  const id = await createAsset(session.workspaceId, session.uid, parsed.data);
  return jsonOk({ id }, 201);
}
