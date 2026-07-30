/**
 * video-gen/whiteboard/types.ts
 * Shared shapes for the Whiteboard Explainer workflow.
 * Server-only — the client receives a serialized `WhiteboardScript` JSON
 * but never imports these types directly.
 */

export interface ScriptPhase {
  index: number;
  label: string;
  startSec: number;
  endSec: number;
  durationSec: number;
  /** What the AI video model will say aloud when this phase renders. */
  voiceover: string;
  /** 2-5 bold words shown on the whiteboard during this phase. */
  onScreenText: string;
  /**
   * Full AI video generation prompt for this phase. MUST instruct the
   * video model to narrate the voiceover aloud — that is how audio
   * ends up in the final clip without any external TTS service.
   */
  visualDirection: string;
}

export interface WhiteboardScript {
  topic: string;
  totalSec: number;
  clipCount: number;
  clipDurationSec: number;
  phases: ScriptPhase[];
}
