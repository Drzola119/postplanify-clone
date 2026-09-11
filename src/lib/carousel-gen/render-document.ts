import "server-only";
import { Resvg } from "@resvg/resvg-js";
import { studioFonts } from "@/lib/infographic-studio/fonts";
import { escapeXml, wrapText } from "@/lib/infographic-studio/render";
import { ASPECT_RATIO_DIMENSIONS, type CarouselDocument } from "./types";
import { safeFetch } from "./safe-fetch";

/** The same renderer supplies editing, review, exports and publishing assets. */
export async function renderCarouselSlide(
  deck: CarouselDocument,
  index: number,
) {
  const slide = deck.slides[index];
  if (!slide) throw Error("Slide not found");
  const { width: w, height: h } = ASPECT_RATIO_DIMENSIONS[deck.aspectRatio];
  const { fonts, measure } = await studioFonts();
  const kit = deck.brandSnapshot;
  const bg =
    slide.backgroundColor ||
    kit?.colors.background ||
    deck.style.colors.background;
  const fg = slide.textColor || kit?.colors.text || deck.style.colors.primary;
  const accent =
    slide.accentColor || kit?.colors.accent || deck.style.colors.accent;
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="${escapeXml(bg)}"/>`,
  ];
  const issues: string[] = [];
  async function image(
    url: string,
    x: number,
    y: number,
    width: number,
    height: number,
    opacity = 1,
    fit = "xMidYMid slice",
  ) {
    const asset = await safeFetch(url, 8_000_000);
    if (!["image/png", "image/jpeg", "image/webp"].includes(asset.type))
      throw Error("Images must be PNG, JPEG or WebP");
    parts.push(
      `<image href="data:${asset.type};base64,${asset.body.toString("base64")}" x="${x}" y="${y}" width="${width}" height="${height}" opacity="${opacity}" preserveAspectRatio="${fit}"/>`,
    );
  }
  if (slide.isLegacyFlat && slide.renderedImageUrl) {
    await image(slide.renderedImageUrl, 0, 0, w, h, 1, "xMidYMid meet");
  } else {
    if (slide.backgroundImageUrl)
      await image(
        slide.backgroundImageUrl,
        0,
        0,
        w,
        h,
        (slide.backgroundOpacity ?? 35) / 100,
        slide.backgroundPosition === "contain"
          ? "xMidYMid meet"
          : slide.backgroundPosition === "top"
            ? "xMidYMin slice"
            : slide.backgroundPosition === "bottom"
              ? "xMidYMax slice"
              : "xMidYMid slice",
      );
    const scale = slide.fontSizeScale ?? 1;
    const centered = slide.layoutId === "centered";
    const align = slide.textAlign || (centered ? "center" : "left");
    const anchor =
      align === "right" ? "end" : align === "center" ? "middle" : "start";
    const x = align === "right" ? w - 84 : align === "center" ? w / 2 : 84;
    let y = centered ? h * 0.25 : 150;
    function text(
      value: string | undefined,
      size: number,
      bold: boolean,
      color = fg,
    ) {
      if (!value) return;
      const serif = /serif/i.test(
        bold
          ? slide.displayFont || kit?.fonts.display || deck.style.fonts.display
          : slide.bodyFont || kit?.fonts.body || deck.style.fonts.body,
      );
      const rtl = /[\u0600-\u06ff]/.test(value);
      const family = rtl
        ? "Noto Sans Arabic"
        : serif
          ? "Noto Serif"
          : "Noto Sans";
      const weight = bold ? (slide.fontWeight ?? 700) : 400;
      const lines = wrapText(
        value,
        w - 168,
        size,
        weight === 700,
        (s, n, b) =>
          measure(s, n, b, serif ? "serif" : "sans") +
          Math.max(0, Array.from(s).length - 1) * (slide.letterSpacing ?? 0),
      );
      for (const line of lines) {
        if (
          measure(line, size, weight === 700, serif ? "serif" : "sans") +
            Math.max(0, Array.from(line).length - 1) *
              (slide.letterSpacing ?? 0) >
          w - 168
        )
          issues.push(
            "Text exceeds the safe content width. Shorten it or reduce its size.",
          );
        if (y + size > h - 120)
          issues.push(
            "Text exceeds the safe content area. Shorten it or reduce its size.",
          );
        parts.push(
          `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" letter-spacing="${slide.letterSpacing ?? 0}" fill="${escapeXml(color)}"${rtl ? ' direction="rtl"' : ""}>${escapeXml(line)}</text>`,
        );
        y += size * (slide.lineHeight ?? 1.3);
      }
      y += 28;
    }
    parts.push(
      `<rect x="84" y="${Math.max(55, y - 75)}" width="80" height="8" rx="4" fill="${escapeXml(accent)}"/>`,
    );
    text(slide.subheadline, 26 * scale, false, accent);
    text(slide.statsValue, 110 * scale, true, accent);
    text(
      slide.headline,
      (slide.layoutId === "bold-headline" ? 84 : 64) * scale,
      true,
    );
    text(slide.statsLabel, 34 * scale, false);
    text(slide.body, 34 * scale, false);
    slide.bulletPoints?.forEach((point, i) =>
      text(`${i + 1}. ${point}`, 32 * scale, false),
    );
    slide.comparisonItems?.forEach((row) =>
      text(`${row.left}  /  ${row.right}`, 30 * scale, false),
    );
    text(slide.quoteAuthor, 26 * scale, false, accent);
    if (kit?.logoUrl && kit.showWatermark !== false)
      await image(kit.logoUrl, 84, h - 104, 64, 64, 1, "xMidYMid meet");
    const footer = kit?.socialHandle || kit?.websiteUrl || "";
    parts.push(
      `<text x="170" y="${h - 60}" font-size="24" font-family="Noto Sans" fill="${escapeXml(fg)}">${escapeXml(footer)}</text>`,
    );
    if (deck.showSlideNumbers !== false && kit?.showSlideNumbers !== false)
      parts.push(
        `<text x="${w - 84}" y="${h - 60}" text-anchor="end" font-family="Noto Sans" font-size="24" fill="${escapeXml(fg)}">${index + 1} / ${deck.slides.length}</text>`,
      );
  }
  parts.push("</svg>");
  const svg = parts.join("");
  const renderer = new Resvg(svg, {
    font: {
      fontFiles: fonts.map((f) => f.file),
      loadSystemFonts: false,
      defaultFontFamily: "Noto Sans",
    },
  });
  return { png: renderer.render().asPng(), svg, issues: [...new Set(issues)] };
}
