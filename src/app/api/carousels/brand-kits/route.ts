import "server-only";
import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { listBrandKits, saveBrandKit, checkContrastRatio } from "@/lib/carousel-gen/brand-kits";
import { jsonError, jsonOk, parseBody } from "@/lib/validation/helpers";
import { z } from "zod";

const brandKitSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(100),
  colors: z.object({
    primary: z.string().regex(/^#[0-9a-fA-F]{3,8}$/),
    secondary: z.string().regex(/^#[0-9a-fA-F]{3,8}$/),
    accent: z.string().regex(/^#[0-9a-fA-F]{3,8}$/),
    background: z.string().regex(/^#[0-9a-fA-F]{3,8}$/),
    text: z.string().regex(/^#[0-9a-fA-F]{3,8}$/),
    cardBg: z.string().regex(/^#[0-9a-fA-F]{3,8}$/).optional(),
  }),
  fonts: z.object({
    display: z.string().min(1).max(60),
    body: z.string().min(1).max(60),
  }),
  logoUrl: z.string().url().max(2048).optional(),
  logoDarkUrl: z.string().url().max(2048).optional(),
  socialHandle: z.string().max(80).optional(),
  websiteUrl: z.string().max(200).optional(),
  showWatermark: z.boolean().optional(),
  showSlideNumbers: z.boolean().optional(),
  showSwipeIndicator: z.boolean().optional(),
});

export async function GET() {
  const session = await requireSession();
  if (session instanceof Response) return session;

  try {
    const kits = await listBrandKits(session.workspaceId);
    return jsonOk({ brandKits: kits });
  } catch (error) {
    return jsonError(500, "Failed to load brand kits");
  }
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const parsed = await parseBody(request, brandKitSchema);
  if (!parsed.ok || !parsed.data) {
    return jsonError(
      parsed.error?.status ?? 400,
      parsed.error?.message ?? "Invalid payload",
      parsed.error?.issues
    );
  }

  try {
    const saved = await saveBrandKit(session.workspaceId, parsed.data);
    return jsonOk({ brandKit: saved });
  } catch (error) {
    return jsonError(500, "Failed to save brand kit");
  }
}
