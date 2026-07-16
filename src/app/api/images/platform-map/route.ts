import "server-only";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import {
  PLATFORM_SPECS,
  RATIO_GROUPS,
  type PlatformSpec,
  type RatioGroup,
  type RatioKey,
} from "@/lib/images/platform-ratios";
import { createLogger } from "@/lib/log";

const log = createLogger("api/images/platform-map");

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/images/platform-map
 *
 * Returns the canonical platform→ratio reference for trustiify.agency.
 * The values mirror the engine's `/api/images/platform-map` so the UI
 * doesn't need a network round-trip to render ratio badges.
 *
 * 200: { platforms: Record<id, { width, height, ratio, ratioKey }>, ratioGroups: [...] }
 */
export async function GET() {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const platforms: Record<string, PlatformSpec> = {};
  for (const [id, spec] of Object.entries(PLATFORM_SPECS)) {
    platforms[id] = spec;
  }
  const ratioGroups: RatioGroup[] = RATIO_GROUPS.map((g) => ({
    ratioKey: g.ratioKey as RatioKey,
    ratio: g.ratio,
    width: g.width,
    height: g.height,
    platforms: [...g.platforms],
  }));

  log.debug("[api/images/platform-map] served from local copy");
  return NextResponse.json({ platforms, ratioGroups });
}