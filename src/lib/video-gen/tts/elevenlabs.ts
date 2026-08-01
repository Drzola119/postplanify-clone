/**
 * video-gen/tts/elevenlabs.ts
 * ElevenLabs TTS provider — synthesises a single continuous narration
 * track for the Real Estate Video Studio workflow.
 *
 * Why dedicated TTS instead of the whiteboard trick of baking narration
 * into the video-model prompt: real estate listings have facts (address,
 * price, room count) that a video model can mangle or hallucinate,
 * which is an embarrassing failure. A dedicated TTS step guarantees
 * the on-screen text matches the spoken narration verbatim.
 *
 * One continuous narration file for the whole video — natural prosody,
 * no restart/breath jumps at clip boundaries.
 */

import "server-only";
import { resolvers } from "@/lib/security/server-config";
import { uploadToBunny } from "@/lib/bunny";
import { createLogger } from "@/lib/log";

const logger = createLogger("video-gen:tts:elevenlabs");

const ELEVENLABS_ENDPOINT = "https://api.elevenlabs.io/v1";

/**
 * Default voice IDs per language. Users can override via the
 * `voiceId` field. These are multilingual-capable voices that read
 * well in their respective language; replace with your account's
 * preferred voice library once you provision ElevenLabs.
 */
const DEFAULT_VOICE_IDS: Record<"fr" | "en" | "ar", string> = {
  fr: "pFZP5JQaiR8cWAxoS8H9", // Aria — multilingual, natural French
  en: "21m00Tcm4TlvDq8ikWAM", // Rachel — clean English narration
  ar: "AZnzlk1XvdvUeBnXmlld", // Domi — multilingual, supports MSA
};

const MODEL_ID = "eleven_multilingual_v2";

export interface SynthesizeVoiceoverInput {
  text: string;
  language: "fr" | "en" | "ar";
  /** Override ElevenLabs voice id; falls back to language default. */
  voiceId?: string;
  /** Request headers — needed to resolve ELEVENLABS_API_KEY via resolvers. */
  headers: Headers;
}

export interface SynthesizeVoiceoverOutput {
  audioUrl: string;
  durationSec: number;
  costUsd: number;
}

export async function synthesizeVoiceover(
  input: SynthesizeVoiceoverInput
): Promise<SynthesizeVoiceoverOutput> {
  const text = input.text.trim();
  if (!text) {
    throw new Error("synthesizeVoiceover: text is empty");
  }

  const apiKey = resolvers.elevenLabsApiKey(input.headers);
  const voiceId = input.voiceId?.trim() || DEFAULT_VOICE_IDS[input.language] || DEFAULT_VOICE_IDS.fr;

  logger.info("ElevenLabs TTS request", {
    voiceId,
    language: input.language,
    textLen: text.length,
  });

  const res = await fetch(`${ELEVENLABS_ENDPOINT}/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
      },
    }),
    signal: AbortSignal.timeout(60_000),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`ElevenLabs TTS failed (${res.status}): ${body.slice(0, 400)}`);
  }

  const arrayBuf = await res.arrayBuffer();
  const bytes = Buffer.from(arrayBuf);
  if (bytes.length === 0) {
    throw new Error("ElevenLabs TTS returned empty audio");
  }

  // ElevenLabs charges per character — the published rate is ~$0.00003/char
  // for the multilingual v2 model at the standard quality tier. Estimate
  // conservatively for usage logs.
  const costUsd = Math.round(text.length * 0.00003 * 10000) / 10000;

  // Duration: ~150 words per minute at natural pace = 2.5 words/sec.
  // Word count ~= chars / 5 for English/French; Darja-style Arabic MSA
  // is denser, use chars / 4. Treat as estimate; the FFmpeg composer
  // pads/trims to the actual video length anyway.
  const wordsApprox = input.language === "ar" ? text.length / 4 : text.length / 5;
  const durationSec = Math.max(8, Math.round((wordsApprox / 2.5) * 10) / 10);

  const filename = `voiceover-${Date.now()}.mp3`;
  const { cdnUrl } = await uploadToBunny({
    userId: "platform",
    folder: "assets",
    filename,
    contentType: "audio/mpeg",
    body: bytes,
  });

  logger.info("ElevenLabs TTS uploaded", {
    cdnUrl,
    bytes: bytes.length,
    durationSec,
    costUsd,
  });

  return { audioUrl: cdnUrl, durationSec, costUsd };
}
