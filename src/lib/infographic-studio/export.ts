import "server-only";
import { Resvg } from "@resvg/resvg-js";
import { studioFonts } from "./fonts";
import { renderDocument } from "./render";
import { type StudioDocument } from "./document";
import { db, StudioError } from "./server";
import { BUNNY_CDN_BASE } from "@/lib/bunny";

export async function embeddedAssets(workspaceId: string, doc: StudioDocument) {
  const assets: Record<string, string> = {};
  for (const id of [doc.brand.logoAssetId, doc.artworkAssetId].filter(
    (s): s is string => !!s,
  )) {
    const asset = (
      await db().doc(`workspaces/${workspaceId}/mediaAssets/${id}`).get()
    ).data();
    if (
      !asset ||
      asset.deletedAt ||
      !/^image\/(png|jpeg|webp)$/.test(asset.mime)
    )
      throw new StudioError(400, "Artwork is unavailable or unsupported.");
    const url = new URL(asset.url);
    // Only our configured CDN may supply export images, never arbitrary URLs.
    const configured = BUNNY_CDN_BASE;
    if (
      !configured ||
      url.origin !==
        new URL(
          configured.startsWith("http") ? configured : `https://${configured}`,
        ).origin
    )
      throw new StudioError(
        400,
        "This asset is not on the configured media CDN.",
      );
    const response = await fetch(url, {
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok || !response.body)
      throw new StudioError(502, "Artwork could not be loaded.");
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const item = await reader.read();
      if (item.done) break;
      size += item.value.length;
      if (size > 8_000_000) {
        await reader.cancel();
        throw new StudioError(400, "Artwork must be smaller than 8 MB.");
      }
      chunks.push(item.value);
    }
    assets[id] =
      `data:${asset.mime};base64,${Buffer.concat(chunks).toString("base64")}`;
  }
  return assets;
}
export async function exportDocument(workspaceId: string, doc: StudioDocument) {
  const { fonts, measure, css } = await studioFonts();
  const assets = await embeddedAssets(workspaceId, doc);
  const rendered = renderDocument(doc, { measure, fontCss: css, assets });
  if (rendered.issues.length)
    throw new StudioError(422, rendered.issues.join(" "));
  const text = JSON.stringify([
    doc.title,
    doc.introduction,
    doc.cta,
    doc.blocks,
    doc.brand.name,
    doc.brand.footer,
  ]);
  const missing = Array.from(
    new Set(
      Array.from(text).filter(
        (c) =>
          !/\s/.test(c) &&
          !fonts.some((f) => f.font.hasGlyphForCodePoint(c.codePointAt(0)!)),
      ),
    ),
  );
  if (missing.length)
    throw new StudioError(
      422,
      `Unsupported characters: ${missing.slice(0, 10).join(" ")}. Replace them before exporting.`,
    );
  const renderer = new Resvg(
    rendered.svg
      .replaceAll("StudioSans", "Noto Sans")
      .replaceAll("StudioArabic", "Noto Sans Arabic")
      .replaceAll("StudioSerif", "Noto Serif"),
    {
      font: {
        fontFiles: fonts.map((f) => f.file),
        loadSystemFonts: false,
        defaultFontFamily: "Noto Sans",
        sansSerifFamily: "Noto Sans",
      },
    },
  );
  return { svg: rendered.svg, png: renderer.render().asPng() };
}
