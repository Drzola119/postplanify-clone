/**
 * Language-output quality test.
 *
 * Runs each of the four infographic providers three times (en / fr / ar)
 * against a fixed prompt, saving every PNG to
 * test-output/language-comparison/{provider}-{language}.png and a JSON
 * summary to test-output/language-comparison/results.json.
 *
 * After running, OPEN each Arabic PNG manually and verify the on-image
 * Arabic is legible (correctly shaped, joined letterforms — not garbled
 * glyphs or Latin lookalikes). For every provider that passes, add its
 * ProviderId to ARABIC_CAPABLE_PROVIDERS in
 * src/lib/image-gen/language-support.ts. LEAVE THAT ARRAY EMPTY HERE.
 *
 * Requires provider API keys in the environment (OPENROUTER_API_KEY,
 * OPENAI_API_KEY, IDEOGRAM_API_KEY).
 *
 * Run: npm run test:language-output
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

import { GeminiFlashLiteImageProvider } from "../src/lib/image-gen/providers/openrouter-gemini-flash-lite";
import { GeminiFlashImageProvider } from "../src/lib/image-gen/providers/openrouter-gemini-flash";
import { GptImage2Provider } from "../src/lib/image-gen/providers/openai-gpt-image-2";
import { Ideogram4Provider } from "../src/lib/image-gen/providers/ideogram-4";

import { buildInfographicPrompt, buildIdeogramJsonPrompt } from "../src/lib/image-gen/prompt-builder";
import { findStyle } from "../src/lib/image-gen/prompt-styles";
import { getLanguageDirective } from "../src/lib/image-gen/language-support";
import type { ProviderId } from "../src/lib/image-gen/types";
import type { OutputLanguage } from "../src/lib/i18n/types";

const PROVIDERS: Array<{ id: ProviderId; make: () => unknown }> = [
  { id: "gemini-flash-lite-image", make: () => new GeminiFlashLiteImageProvider() },
  { id: "gpt-image-2", make: () => new GptImage2Provider() },
  { id: "gemini-flash-image", make: () => new GeminiFlashImageProvider() },
  { id: "ideogram-4", make: () => new Ideogram4Provider() },
];

const LANGUAGES: OutputLanguage[] = ["en", "fr", "ar"];

const STYLE_ID = "checklist-infographic";
const TOPIC = "growth mindset tips";
const ASPECT = "1:1";

const OUT_DIR = join(process.cwd(), "test-output", "language-comparison");

type CellResult = "saved" | `error: ${string}`;
type Summary = Record<ProviderId, Record<OutputLanguage, CellResult>>;

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const style = findStyle("instant", STYLE_ID);
  if (!style) throw new Error(`Style "${STYLE_ID}" not found`);

  const summary: Summary = {
    "gemini-flash-lite-image": { en: "saved", fr: "saved", ar: "saved" },
    "gpt-image-2": { en: "saved", fr: "saved", ar: "saved" },
    "gemini-flash-image": { en: "saved", fr: "saved", ar: "saved" },
    "ideogram-4": { en: "saved", fr: "saved", ar: "saved" },
  };

  for (const { id, make } of PROVIDERS) {
    for (const lang of LANGUAGES) {
      try {
        const prompt = buildInfographicPrompt({
          topic: TOPIC,
          style,
          aspectRatio: ASPECT as never,
          outputLanguage: lang,
        });
        const structuredPrompt = buildIdeogramJsonPrompt({
          tool: "instant",
          topic: TOPIC,
          style,
          aspectRatio: ASPECT as never,
          outputLanguage: lang,
        });

        // The directive is already appended inside the builders; this is a
        // sanity check that the token is present.
        if (!prompt.includes(getLanguageDirective(lang))) {
          throw new Error("LANGUAGE_DIRECTIVE missing from assembled prompt");
        }

        const provider = make() as {
          generate: (input: {
            workspaceId: string;
            uid: string;
            provider: ProviderId;
            prompt: string;
            structuredPrompt?: Record<string, unknown>;
            aspectRatio: string;
            outputLanguage?: OutputLanguage;
          }) => Promise<{ imageBytes: Buffer | Uint8Array }>;
        };

        const out = await provider.generate({
          workspaceId: "test-workspace",
          uid: "test-user",
          provider: id,
          prompt,
          structuredPrompt,
          aspectRatio: ASPECT,
          outputLanguage: lang,
        });

        const bytes =
          out.imageBytes instanceof Buffer
            ? out.imageBytes
            : Buffer.from(out.imageBytes);
        writeFileSync(join(OUT_DIR, `${id}-${lang}.png`), bytes);
        summary[id][lang] = "saved";
        console.log(`OK   ${id}/${lang}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        summary[id][lang] = `error: ${message}`;
        console.error(`FAIL ${id}/${lang}: ${message}`);
      }
    }
  }

  writeFileSync(join(OUT_DIR, "results.json"), JSON.stringify(summary, null, 2));
  console.log(`\nWrote summary to ${join(OUT_DIR, "results.json")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
