/**
 * carousel-gen/vision-qa.ts
 *
 * M4 consistency QA pass. After the workflow generates all 5 slides,
 * we fire off a single Groq vision call that looks at every slide URL
 * and reports which (if any) slides drift visually — wrong palette,
 * different typography, a slide that doesn't match the deck's
 * cohesion.
 *
 * The verdict is stored on the job doc as `visionQa` so the wizard
 * can show a small "drift" badge on inconsistent slides next to the
 * regenerate button.
 *
 * This is intentionally conservative — a failure here never breaks
 * generation; the job stays "complete" if QA itself fails. Users
 * who don't want QA running can ignore the badge entirely.
 */

import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { callGroq, extractJson, GROQ_VISION_MODEL } from "@/lib/ai/groq";
import { resolvers } from "@/lib/security/server-config";
import type {
  CarouselJobDoc,
  CarouselVisionQa,
} from "./types";

const SYSTEM_PROMPT = `You are a visual QA reviewer for a 5-slide Instagram carousel. Look at all 5 images as one cohesive deck. Report which slides (if any) break the visual cohesion — wrong palette, different typography family, decorative elements that aren't on the other slides, or any other visual drift. Be conservative: only flag a slide if the difference is obvious and would make a viewer think "this is a different deck". Stay in JSON.`;

const USER_PROMPT_TEMPLATE = `These 5 images are one carousel deck.

Return strict JSON of the shape:
{
  "drift": [<indices 0-4 that break the deck>],
  "notes": "<one short paragraph: which slides break and why>"
}

If all 5 slides are consistent, return {"drift": [], "notes": "All 5 slides are visually consistent."}.
Do not return any prose outside the JSON. Do not wrap the JSON in a code fence.`;

export async function runVisionQaPass(args: {
  jobRef: FirebaseFirestore.DocumentReference;
  workspaceId: string;
  uid: string;
  /** All 5 generated asset URLs in deck order. */
  assetUrls: Array<{ index: number; type: string; url: string }>;
  headers?: Headers;
}): Promise<void> {
  // Mark as running first so the wizard can show a spinner on the
  // relevant slides. Failure modes fall back to leaving the previous
  // verdict (or undefined) in place.
  await args.jobRef.update({
    visionQa: {
      status: "running",
      model: GROQ_VISION_MODEL,
      drift: [],
      notes: "",
    },
    updatedAt: FieldValue.serverTimestamp(),
  });

  const groqApiKey = resolvers.groqApiKey(args.headers ?? new Headers());
  if (!groqApiKey) {
    await args.jobRef.update({
      visionQa: {
        status: "failed",
        model: GROQ_VISION_MODEL,
        drift: [],
        notes: "",
        error: "GROQ_API_KEY not configured",
      },
      updatedAt: FieldValue.serverTimestamp(),
    });
    return;
  }

  try {
    const userContent: Array<
      { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }
    > = [
      { type: "text", text: USER_PROMPT_TEMPLATE },
      ...args.assetUrls.map((s) => ({
        type: "image_url" as const,
        image_url: { url: s.url },
      })),
    ];

    const res = await callGroq({
      apiKey: groqApiKey,
      model: GROQ_VISION_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      temperature: 0.2,
      maxTokens: 500,
    });

    const parsed = extractJson<{ drift?: number[]; notes?: string }>(
      res.content
    );
    if (!parsed) {
      throw new Error("QA model returned non-JSON response");
    }
    const drift = Array.isArray(parsed.drift)
      ? parsed.drift.filter((n) => Number.isInteger(n) && n >= 0 && n <= 4)
      : [];
    const notes =
      typeof parsed.notes === "string" ? parsed.notes.slice(0, 800) : "";

    const verdict: CarouselVisionQa = {
      status: "complete",
      model: res.model,
      drift,
      notes,
      completedAt: FieldValue.serverTimestamp(),
    };
    await args.jobRef.update({
      visionQa: verdict,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await args.jobRef.update({
      visionQa: {
        status: "failed",
        model: GROQ_VISION_MODEL,
        drift: [],
        notes: "",
        error: message,
      },
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
}

/**
 * Read visionQa safely from a job snapshot. The wizard polls the
 * doc on every 2s tick — the field may not exist yet or may have
 * failed; this returns a normalised shape the wizard can render
 * without conditional logic.
 */
export function readVisionQa(job: CarouselJobDoc | null | undefined): CarouselVisionQa | null {
  if (!job?.visionQa) return null;
  return job.visionQa;
}
