import "server-only";
import { readFile, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { create } from "fontkit";
import { decompress } from "wawoff2";
import type { TextMeasure } from "./render";
import { fontRuns, runFont } from "./render";
let pending: ReturnType<typeof load> | undefined;
async function load() {
  const directory = await mkdtemp(path.join(tmpdir(), "infographic-fonts-"));
  const specs = [
    ["noto-sans", "latin", 400, "StudioSans"],
    ["noto-sans", "latin", 700, "StudioSans"],
    ["noto-sans-arabic", "arabic", 400, "StudioArabic"],
    ["noto-sans-arabic", "arabic", 700, "StudioArabic"],
    ["noto-serif", "latin", 400, "StudioSerif"],
    ["noto-serif", "latin", 700, "StudioSerif"],
  ] as const;
  async function loadOne([
    family,
    subset,
    weight,
    name,
  ]: (typeof specs)[number]) {
    const woff = await readFile(
      path.join(
        process.cwd(),
        "node_modules",
        "@fontsource",
        family,
        "files",
        `${family}-${subset}-${weight}-normal.woff2`,
      ),
    );
    const buffer = Buffer.from(await decompress(woff));
    const font = create(buffer);
    if (!("layout" in font)) throw new Error("Invalid studio font");
    const file = path.join(directory, `${name}-${weight}.ttf`);
    await writeFile(file, buffer);
    return {
      buffer,
      file,
      font,
      weight,
      name,
      css: `@font-face{font-family:${name};font-style:normal;font-weight:${weight};src:url(data:font/ttf;base64,${buffer.toString("base64")}) format('truetype');}`,
    };
  }
  // wawoff2 shares a WASM heap; concurrent decompressions corrupt font buffers.
  const fonts: Awaited<ReturnType<typeof loadOne>>[] = [];
  for (const spec of specs) fonts.push(await loadOne(spec));
  const measure: TextMeasure = (text, size, bold, preference) => {
    const weight = bold ? 700 : 400;
    return fontRuns(text).reduce((total, run) => {
      const font = fonts.find(
        (f) => f.weight === weight && f.name === runFont(run, preference),
      )!.font;
      return (
        total +
        (font.layout(run).positions.reduce((n, p) => n + p.xAdvance, 0) /
          font.unitsPerEm) *
          size
      );
    }, 0);
  };
  return { fonts, measure, css: fonts.map((f) => f.css).join("") };
}
export function studioFonts() {
  return (pending ??= load().catch((e) => {
    pending = undefined;
    throw e;
  }));
}
