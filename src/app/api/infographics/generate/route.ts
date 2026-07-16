import "server-only";
import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import {
  generateInfographic,
  ImageGenExhaustedError,
  buildInfographicPrompt,
  buildAdsInfographicPrompt,
  buildIdeogramJsonPrompt,
} from "@/lib/image-gen";
import { findStyle } from "@/lib/image-gen/prompt-styles";
import {
  imageGenInstantRequestSchema,
  imageGenAdsRequestSchema,
} from "@/lib/validation/image-gen";
import { jsonError, jsonOk, parseBody } from "@/lib/validation/helpers";
import { createLogger } from "@/lib/log";

const log = createLogger("infographics/generate");

/**
 * POST /api/infographics/generate
 *
 * Wizard endpoint. The body shape depends on `tool`:
 *   - "instant": { tool, topic, prompt?, structuredPrompt?, provider, aspectRatio, colorScheme, styleId, footerCta?, apiKeyOverride? }
 *   - "ads":     { tool, offerTitle, offerCopy, offerUrl?, provider, aspectRatio, colorScheme, styleId, footerCta?, apiKeyOverride? }
 *
 * `prompt` and `structuredPrompt` are accepted directly when the caller
 * wants to fully control them (e.g. the test script in scripts/test-image-gen.ts).
 * Otherwise the route builds them server-side from the structured inputs
 * via buildInfographicPrompt / buildAdsInfographicPrompt.
 */
export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  const raw = await parseBody(
    request,
    imageGenInstantRequestSchema.or(imageGenAdsRequestSchema)
  );
  if (!raw.ok || !raw.data) {
    return jsonError(
      raw.error?.status ?? 400,
      raw.error?.message ?? "Invalid payload",
      raw.error?.issues
    );
  }
  const body = raw.data;
  const tool = body.tool;

  const styleId = body.context?.styleId;
  if (!styleId) {
    return jsonError(400, "Missing styleId in context");
  }
  const style = findStyle(tool, styleId);
  if (!style) {
    return jsonError(400, `Unknown style id "${styleId}" for tool "${tool}"`);
  }

  const colorScheme = body.colorScheme ?? "light";
  const footerCta = body.context?.campaignId;

  // Build the prompt unless the client already supplied one. The test
  // script and a few advanced flows pass their own prompt/structuredPrompt.
  let prompt = body.prompt;
  let structuredPrompt = body.structuredPrompt as Record<string, unknown> | undefined;

  if (!prompt) {
    if (tool === "ads") {
      const ads = body as typeof body & {
        offerTitle: string;
        offerCopy: string;
      };
      prompt = buildAdsInfographicPrompt({
        offerTitle: ads.offerTitle,
        offerCopy: ads.offerCopy,
        style,
        colorScheme,
        aspectRatio: body.aspectRatio,
        footerCta,
      });
      structuredPrompt = buildIdeogramJsonPrompt({
        tool: "ads",
        topic: ads.offerTitle,
        offerTitle: ads.offerTitle,
        offerCopy: ads.offerCopy,
        style,
        colorScheme,
        aspectRatio: body.aspectRatio,
        footerCta,
      });
    } else {
      const inst = body as typeof body & { topic: string };
      prompt = buildInfographicPrompt({
        topic: inst.topic,
        style,
        colorScheme,
        aspectRatio: body.aspectRatio,
        footerCta,
      });
      structuredPrompt = buildIdeogramJsonPrompt({
        tool: "instant",
        topic: inst.topic,
        style,
        colorScheme,
        aspectRatio: body.aspectRatio,
        footerCta,
      });
    }
  }

  try {
    const out = await generateInfographic({
      workspaceId: session.workspaceId,
      uid: session.uid,
      provider: body.provider,
      prompt,
      structuredPrompt,
      aspectRatio: body.aspectRatio,
      apiKeyOverride: body.apiKeyOverride,
      context: {
        tool,
        styleId: style.id,
        campaignId: body.context?.campaignId,
        abBucket: body.context?.abBucket,
      },
      headers: request.headers,
    });

    return jsonOk({
      provider: out.provider,
      model: out.model,
      assetId: out.assetId,
      assetUrl: out.assetUrl,
      width: out.width,
      height: out.height,
      costUsd: out.costUsd,
      durationMs: out.durationMs,
      fellBackFrom: out.fellBackFrom ?? null,
      styleId: style.id,
      tool,
    });
  } catch (err) {
    if (err instanceof ImageGenExhaustedError) {
      log.error("image-gen exhausted", {
        workspaceId: session.workspaceId,
        attempts: err.attempts,
      });
      return jsonError(502, "All image-gen providers failed", err.attempts);
    }
    const message = err instanceof Error ? err.message : "Generation failed";
    log.error("image-gen error", { workspaceId: session.workspaceId, message });
    return jsonError(500, message);
  }
}
