import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { listAssets } from "@/lib/db/media-assets";
import { z } from "zod";
import { parseSearchParams } from "@/lib/validation/helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  folder: z.enum(["posts", "brands", "avatars", "assets"]).optional(),
  mime: z.string().max(120).optional(),
  tag: z.string().max(64).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  cursor: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const url = new URL(request.url);
  const parsed = parseSearchParams(url.searchParams, schema);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error?.message ?? "Invalid query" },
      { status: parsed.error?.status ?? 400 },
    );
  }
  const { folder, mime, pageSize, cursor } = parsed.data ?? {};
  const result = await listAssets(session.workspaceId, { folder, mime, pageSize, cursor });
  const tag = parsed.data?.tag;
  const items = tag ? result.items.filter((a) => a.tags.includes(tag)) : result.items;
  return NextResponse.json({ assets: items, nextCursor: result.nextCursor });
}