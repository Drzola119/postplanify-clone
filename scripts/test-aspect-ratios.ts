/**
 * Console check: run all 8 supported AspectRatio values through the
 * three per-provider conversion helpers and print the resulting
 * size/ratio string for each. Lets us visually confirm every
 * combination produces a valid, in-range output before hitting any
 * live API.
 *
 * Usage:
 *   npx tsx scripts/test-aspect-ratios.ts
 *
 * Note: inlined here (no imports from `src/lib/image-gen/resolution`)
 * so this script runs without needing the `server-only` package to be
 * installed at the repo root. The logic mirrors `resolution.ts`
 * verbatim — keep them in sync.
 */

const SUPPORTED_ASPECT_RATIOS = [
  "1:1",
  "2:3",
  "3:2",
  "3:4",
  "4:3",
  "9:16",
  "16:9",
  "21:9",
] as const;

const MAX_NON_IDEOGRAM_EDGE_PX = 1024;
const MAX_IDEOGRAM_EDGE_PX = 2048;

function aspectDimensions(ratio: string, maxEdge: number): { width: number; height: number } {
  const [w, h] = ratio.split(":").map(Number);
  if (w >= h) {
    const width = maxEdge;
    const height = Math.max(16, Math.round((maxEdge * h) / w / 16) * 16);
    return { width, height };
  }
  const height = maxEdge;
  const width = Math.max(16, Math.round((maxEdge * w) / h / 16) * 16);
  return { width, height };
}

function aspectRatioToGemini(ratio: string): string {
  return ratio;
}

function aspectRatioToOpenAiSize(ratio: string, maxEdge: number = MAX_NON_IDEOGRAM_EDGE_PX): string {
  const { width, height } = aspectDimensions(ratio, maxEdge);
  return `${width}x${height}`;
}

function aspectRatioToIdeogram(ratio: string): string {
  return ratio.replace(":", "x");
}

const HDR = "ratio  | gemini      | openai_1k  | openai_2k  | ideogram   | dims_1k          | dims_2k          | ok";
const SEP = "-".repeat(HDR.length);

function row(ratio: string): string {
  const dims1k = aspectDimensions(ratio, MAX_NON_IDEOGRAM_EDGE_PX);
  const dims2k = aspectDimensions(ratio, MAX_IDEOGRAM_EDGE_PX);
  const ok1k = dims1k.width <= MAX_NON_IDEOGRAM_EDGE_PX && dims1k.height <= MAX_NON_IDEOGRAM_EDGE_PX;
  const ok2k = dims2k.width <= MAX_IDEOGRAM_EDGE_PX && dims2k.height <= MAX_IDEOGRAM_EDGE_PX;
  return [
    ratio.padEnd(7),
    aspectRatioToGemini(ratio).padEnd(12),
    aspectRatioToOpenAiSize(ratio, MAX_NON_IDEOGRAM_EDGE_PX).padEnd(11),
    aspectRatioToOpenAiSize(ratio, MAX_IDEOGRAM_EDGE_PX).padEnd(11),
    aspectRatioToIdeogram(ratio).padEnd(11),
    `${dims1k.width}x${dims1k.height}`.padEnd(17),
    `${dims2k.width}x${dims2k.height}`.padEnd(17),
    `${ok1k && ok2k ? "yes" : "NO"}`,
  ].join("| ");
}

function main() {
  console.log("─".repeat(HDR.length));
  console.log("Aspect-ratio conversion table (8 supported ratios × 3 providers)");
  console.log("─".repeat(HDR.length));
  console.log(HDR);
  console.log(SEP);
  for (const ratio of SUPPORTED_ASPECT_RATIOS) {
    console.log(row(ratio));
  }
  console.log(SEP);
  console.log(
    `Legends: gemini = image_config.aspect_ratio (verbatim), ` +
      `openai_1k = size at 1K long edge, openai_2k = size at 2K long edge, ` +
      `ideogram = aspect_ratio string for v3 API.`
  );
  console.log(
    `Caps: maxEdge(GeminiLite/2.5/GPT) = ${MAX_NON_IDEOGRAM_EDGE_PX}px, ` +
      `maxEdge(Ideogram4) = ${MAX_IDEOGRAM_EDGE_PX}px.`
  );
}

main();
