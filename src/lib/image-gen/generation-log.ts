import "server-only";
import { adminDb } from "@/lib/db";
import type { ImageGenLogDoc } from "@/lib/db/schema";

const SERVER_TIMESTAMP = { _methodName: "serverTimestamp" } as const;

function collection(workspaceId: string) {
  if (!adminDb) throw new Error("adminDb not configured");
  return adminDb.collection(`workspaces/${workspaceId}/imageGenLogs`);
}

export interface ImageGenLogInput {
  workspaceId: string;
  uid: string;
  provider: ImageGenLogDoc["provider"];
  model: string;
  keySource: ImageGenLogDoc["keySource"];
  costUsd: number;
  aspectRatio: string;
  tool?: "instant" | "ads";
  styleId?: string;
  durationMs: number;
  width?: number;
  height?: number;
  promptChars?: number;
  fellBack: boolean;
  requestedProvider?: string;
}

/**
 * Fire-and-forget write of one generation event. Failures are swallowed
 * so a logging hiccup never blocks the user-visible result.
 */
export async function logImageGeneration(input: ImageGenLogInput): Promise<void> {
  try {
    await collection(input.workspaceId).add({
      workspaceId: input.workspaceId,
      uid: input.uid,
      provider: input.provider,
      model: input.model,
      keySource: input.keySource,
      costUsd: input.costUsd,
      aspectRatio: input.aspectRatio,
      tool: input.tool,
      styleId: input.styleId,
      durationMs: input.durationMs,
      width: input.width,
      height: input.height,
      promptChars: input.promptChars,
      fellBack: input.fellBack,
      requestedProvider: input.requestedProvider,
      createdAt: SERVER_TIMESTAMP,
    });
  } catch {
    /* swallow — logging is best-effort */
  }
}