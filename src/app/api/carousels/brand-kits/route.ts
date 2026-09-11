import "server-only";
import { NextRequest } from "next/server";
import { requireCarouselAccess as requireSession } from "@/lib/carousel-gen/access";
import { listBrandKits, saveBrandKit } from "@/lib/carousel-gen/brand-kits";
import { jsonError, jsonOk, parseBody } from "@/lib/validation/helpers";
import { z } from "zod";
import { documentId, color } from "@/lib/carousel-gen/document-schema";
import { adminDb } from "@/lib/firebase/admin";

const brandKitSchema = z.object({
  id: documentId.optional(),
  name: z.string().min(1).max(100),
  colors: z.object({
    primary: color,
    secondary: color,
    accent: color,
    background: color,
    text: color,
    cardBg: color.optional(),
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
  const session = await requireSession(false);
  if (session instanceof Response) return session;

  try {
    const kits = await listBrandKits(session.workspaceId);
    return jsonOk({ brandKits: kits });
  } catch {
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
      parsed.error?.issues,
    );
  }

  try {
    const saved = await saveBrandKit(session.workspaceId, parsed.data);
    return jsonOk({ brandKit: saved });
  } catch {
    return jsonError(500, "Failed to save brand kit");
  }
}

export async function DELETE(request: Request) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  if (!adminDb) return jsonError(503, "Database unavailable");
  const id = documentId.safeParse(new URL(request.url).searchParams.get("id"));
  if (!id.success) return jsonError(400, "Invalid brand kit");
  await adminDb
    .doc(`workspaces/${session.workspaceId}/brandKits/${id.data}`)
    .delete();
  return jsonOk({ success: true });
}
