import { z } from "zod";
import {
  access,
  route,
  db,
  validateAssets,
} from "@/lib/infographic-studio/server";
import {
  brandSchema,
  defaultBrand,
  newDocument,
} from "@/lib/infographic-studio/document";
export async function GET() {
  return route(async () => {
    const session = await access();
    if (session instanceof Response) return session;
    const snap = await db().doc(`workspaces/${session.workspaceId}`).get();
    const data = snap.data() ?? {};
    const settings = data.settings ?? {};
    const logo = settings.logoUrl
      ? (
          await db()
            .collection(`workspaces/${session.workspaceId}/mediaAssets`)
            .where("url", "==", settings.logoUrl)
            .limit(1)
            .get()
        ).docs[0]
      : undefined;
    const logoAssetId =
      logo &&
      !logo.data().deletedAt &&
      /^image\/(png|jpeg|webp)$/.test(logo.data().mime ?? "")
        ? logo.id
        : undefined;
    return Response.json({
      presets: settings.infographicPresets ?? [],
      defaultId: settings.infographicDefaultPreset ?? "",
      workspaceBrand: {
        ...defaultBrand,
        name: settings.brandName || data.name || "",
        primary: /^#[0-9a-f]{6}$/i.test(settings.primaryColor ?? "")
          ? settings.primaryColor
          : defaultBrand.primary,
        website: settings.customDomain ?? "",
        footer: settings.footerText ?? "",
        ...(logoAssetId ? { logoAssetId } : {}),
      },
      logoUrl: settings.logoUrl ?? "",
    });
  });
}
export async function PUT(request: Request) {
  return route(async () => {
    const session = await access(true, true);
    if (session instanceof Response) return session;
    const input = z
      .object({
        presets: z
          .array(z.object({ id: z.string().uuid(), brand: brandSchema }))
          .max(12),
        defaultId: z.string().uuid().or(z.literal("")),
      })
      .refine(
        (v) => !v.defaultId || v.presets.some((p) => p.id === v.defaultId),
      )
      .refine(
        (v) => new Set(v.presets.map((p) => p.id)).size === v.presets.length,
        "Preset IDs must be unique",
      )
      .parse(await request.json());
    for (const preset of input.presets)
      await validateAssets(session.workspaceId, {
        ...newDocument(),
        brand: preset.brand,
      });
    await db().doc(`workspaces/${session.workspaceId}`).update({
      "settings.infographicPresets": input.presets,
      "settings.infographicDefaultPreset": input.defaultId,
    });
    return Response.json({ ok: true });
  });
}
