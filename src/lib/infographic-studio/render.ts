import { type StudioDocument, templateIssues } from "./document";

export type TextMeasure = (
  text: string,
  size: number,
  bold: boolean,
  font?: StudioDocument["brand"]["font"],
) => number;
export function fontRuns(text: string) {
  // Keep same-script phrases together, but position boundary whitespace explicitly.
  // This preserves Latin word/number order inside an Arabic paragraph.
  return (
    text.match(
      /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]+(?:\s+[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]+)*|\s+|[^\s\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]+(?:\s+[^\s\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]+)*/gu,
    ) ?? []
  );
}
export function runFont(text: string, font?: StudioDocument["brand"]["font"]) {
  return /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/u.test(text)
    ? "StudioArabic"
    : font === "serif"
      ? "StudioSerif"
      : "StudioSans";
}
export const escapeXml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );
const approximate: TextMeasure = (s, size) =>
  Array.from(s).reduce(
    (n, c) => n + (/\s/.test(c) ? 0.3 : /[il.,]/.test(c) ? 0.3 : 0.65) * size,
    0,
  );
export function wrapText(
  text: string,
  width: number,
  size: number,
  bold: boolean,
  measure: TextMeasure,
): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      if (line && measure(`${line} ${word}`, size, bold) > width) {
        lines.push(line);
        line = "";
      }
      if (measure(word, size, bold) > width) {
        for (const char of Array.from(word)) {
          if (line && measure(line + char, size, bold) > width) {
            lines.push(line);
            line = "";
          }
          line += char;
        }
      } else line += (line ? " " : "") + word;
    }
    if (line) lines.push(line);
  }
  return lines;
}

/** Only generated SVG elements and escaped text are emitted. No user markup. */
export function renderDocument(
  doc: StudioDocument,
  options: {
    measure?: TextMeasure;
    fontCss?: string;
    assets?: Record<string, string>;
    interactive?: boolean;
    selectedId?: string;
  } = {},
) {
  const measure: TextMeasure = (text, size, bold) =>
    (options.measure ?? approximate)(text, size, bold, doc.brand.font);
  const issues = [...templateIssues(doc)];
  const { width: w, height: h, brand } = doc;
  const rtl = doc.language === "ar";
  const pad = 64,
    inner = w - pad * 2,
    gap = doc.spacing === "compact" ? 18 : 30;
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${escapeXml(doc.title)}"><style>${options.fontCss ?? ""}</style><rect width="${w}" height="${h}" fill="${brand.background}"/><rect width="12" height="${h}" x="${rtl ? w - 12 : 0}" fill="${brand.primary}"/>`,
  ];
  function text(
    value: string,
    x: number,
    y: number,
    width: number,
    size = 28,
    bold = false,
    color = brand.text,
  ) {
    const lines = wrapText(value, width, size, bold, measure);
    for (const [i, line] of lines.entries()) {
      const runs = fontRuns(line);
      if (rtl) runs.reverse();
      let cursor = rtl ? x + width - measure(line, size, bold) : x;
      for (const run of runs) {
        parts.push(
          `<text x="${cursor}" y="${y + size + i * size * 1.6}" font-family="${runFont(run, doc.brand.font)}" font-size="${size}" font-weight="${bold ? 700 : 400}" fill="${color}" direction="ltr" text-anchor="start" xml:space="preserve">${escapeXml(run)}</text>`,
        );
        cursor += measure(run, size, bold);
      }
    }
    return lines.length * size * 1.6;
  }
  let y = pad;
  if (brand.logoAssetId) {
    const src = options.assets?.[brand.logoAssetId];
    if (src)
      parts.push(
        `<image href="${escapeXml(src)}" x="${rtl ? w - pad - 100 : pad}" y="${y}" width="100" height="64" preserveAspectRatio="xMidYMid meet"/>`,
      );
    else
      issues.push(
        "Brand logo is not loaded. Select a valid workspace image before exporting.",
      );
    y += 82;
  }
  if (brand.name)
    y += text(brand.name, pad, y, inner, 22, true, brand.primary) + 12;
  y += text(doc.title, pad, y, inner, 56, true) + 16;
  if (doc.introduction) y += text(doc.introduction, pad, y, inner, 26) + 24;
  if (doc.artworkAssetId) {
    const src = options.assets?.[doc.artworkAssetId];
    if (src)
      parts.push(
        `<image href="${escapeXml(src)}" x="${pad}" y="${y}" width="${inner}" height="160" preserveAspectRatio="xMidYMid meet"/>`,
      );
    else issues.push("Artwork is not loaded.");
    y += 180;
  }
  const columns =
    ["comparison", "statistics", "offer"].includes(doc.template) || w > h
      ? 2
      : 1;
  const cell = (inner - gap * (columns - 1)) / columns;
  const footerH = Math.max(
    72,
    wrapText(
      [doc.cta, brand.footer, brand.website].filter(Boolean).join(" • "),
      inner,
      22,
      false,
      measure,
    ).length *
      36 +
      30,
  );
  for (let row = 0; row < doc.blocks.length; row += columns) {
    let rowHeight = 0;
    for (let column = 0; column < columns; column++) {
      const b = doc.blocks[row + column];
      if (!b) continue;
      const x = pad + (rtl ? columns - 1 - column : column) * (cell + gap);
      const start = parts.length;
      parts.push("");
      let by = y + 24;
      const tx = x + 26,
        tw = cell - 52;
      parts.push(`<g data-block-id="${b.id}"${options.interactive ? ` tabindex="0" role="button" aria-label="Edit section ${row + column + 1}"` : ""}>`);
      if (doc.template === "process" || doc.template === "timeline") {
        by +=
          text(
            String(row + column + 1).padStart(2, "0"),
            tx,
            by,
            tw,
            24,
            true,
            brand.primary,
          ) + 8;
      } else {
        // Icons are native vectors, not font glyphs that may be missing in exports.
        const ix = rtl ? tx + tw - 24 : tx;
        const shape = {
          check: '<path d="M3 12l6 6L21 5"/>',
          circle: '<circle cx="12" cy="12" r="5"/>',
          star: '<path d="M12 2l3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1z"/>',
          arrow: `<path d="${rtl ? "M21 12H3m7-7-7 7 7 7" : "M3 12h18m-7-7 7 7-7 7"}"/>`,
        }[b.icon];
        parts.push(
          `<g transform="translate(${ix} ${by})" stroke="${brand.primary}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">${shape}</g>`,
        );
        by += 46.4;
      }
      if (b.type === "heading" || b.type === "paragraph")
        by += text(
          b.text,
          tx,
          by,
          tw,
          b.type === "heading" ? 34 : 27,
          b.type === "heading",
        );
      else {
        if (b.title) by += text(b.title, tx, by, tw, 30, true) + 10;
        if (b.type === "step") by += text(b.text, tx, by, tw, 26);
        if (b.type === "list")
          for (const item of b.items)
            by += text(`• ${item}`, tx, by, tw, 26) + 8;
        if (b.type === "comparison") {
          by += text(b.left, tx, by, tw, 26) + 14;
          parts.push(
            `<path d="M ${tx} ${by} h ${tw}" stroke="${brand.secondary}"/>`,
          );
          by += 14 + text(b.right, tx, by + 14, tw, 26);
        }
        if (b.type === "statistic")
          by += text(
            `${b.value.toLocaleString(doc.language)} ${b.unit}`,
            tx,
            by,
            tw,
            44,
            true,
            brand.primary,
          );
        if (b.type === "chart") {
          const max = Math.max(1, ...b.values.map((v) => v.value));
          for (const v of b.values) {
            by += text(
              `${v.label}: ${v.value.toLocaleString(doc.language)} ${b.unit}`,
              tx,
              by,
              tw,
              22,
            );
            const bar = (tw * v.value) / max;
            parts.push(
              `<rect x="${rtl ? tx + tw - bar : tx}" y="${by + 6}" width="${bar}" height="14" rx="7" fill="${brand.primary}"/>`,
            );
            by += 34;
          }
        }
      }
      parts.push("</g>");
      const height = by - y + 24;
      rowHeight = Math.max(rowHeight, height);
      parts[start] =
        `<rect x="${x}" y="${y}" width="${cell}" height="${height}" rx="20" fill="${brand.primary}" fill-opacity="0.06" stroke="${brand.primary}" stroke-opacity="0.16"/>`;
      if (doc.template === "timeline") {
        const lineX = rtl ? x + cell - 10 : x + 10;
        parts.push(
          `<path d="M${lineX} ${y + 18}V${y + height + (row + columns < doc.blocks.length ? gap : -18)}" stroke="${brand.secondary}" stroke-width="3"/><circle cx="${lineX}" cy="${y + 35}" r="6" fill="${brand.primary}"/>`,
        );
      }
      if (options.selectedId === b.id) parts.push(`<rect x="${x}" y="${y}" width="${cell}" height="${height}" rx="20" fill="none" stroke="#2563eb" stroke-width="3" pointer-events="none"/>`);
      if (by > h - pad - footerH)
        issues.push(
          `Section ${row + column + 1} overflows the canvas. Shorten it, use compact spacing, or choose a taller format.`,
        );
    }
    y += rowHeight + gap;
  }
  const footer = [doc.cta, brand.footer, brand.website]
    .filter(Boolean)
    .join(" • ");
  if (footer)
    text(footer, pad, h - pad - footerH + 20, inner, 22, false, brand.primary);
  parts.push("</svg>");
  return { svg: parts.join(""), issues: [...new Set(issues)] };
}
