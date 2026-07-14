import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { adminDb } from "@/lib/db";
import { jsonError, jsonOk, parseBody } from "@/lib/validation/helpers";
import { z } from "zod";

const brandingSchema = z.object({
  brandName: z.string().min(1).max(80).optional(),
  logoUrl: z.string().url().max(2048).optional().or(z.literal("")),
  primaryColor: z.string().regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i).optional(),
  customDomain: z.string().max(253).regex(/^[a-z0-9.-]+$/i).optional().or(z.literal("")),
  whiteLabelEnabled: z.boolean().optional(),
  footerText: z.string().max(160).optional(),
  hidePoweredBy: z.boolean().optional(),
});

export async function GET() {
  const session = await requireSession();
  if (session instanceof Response) return session;
  if (!adminDb) return jsonError(503, "Database not configured");
  const ref = adminDb.doc(`workspaces/${session.workspaceId}`);
  const snap = await ref.get();
  const data = snap.data() ?? {};
  const settings = (data.settings ?? {}) as Record<string, unknown>;
  return jsonOk({
    branding: {
      brandName: settings.brandName ?? data.name ?? "",
      logoUrl: settings.logoUrl ?? "",
      primaryColor: settings.primaryColor ?? "#0f172a",
      customDomain: settings.customDomain ?? "",
      whiteLabelEnabled: settings.whiteLabelEnabled ?? false,
      footerText: settings.footerText ?? "",
      hidePoweredBy: settings.hidePoweredBy ?? false,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  if (!adminDb) return jsonError(503, "Database not configured");

  const parsed = await parseBody(request, brandingSchema);
  if (!parsed.ok) return jsonError(400, "Invalid branding payload", parsed.error.issues);

  await adminDb.doc(`workspaces/${session.workspaceId}`).set(
    { settings: parsed.data, updatedAt: new Date() },
    { merge: true },
  );
  return jsonOk({ ok: true });
}
