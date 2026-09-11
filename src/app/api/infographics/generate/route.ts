import "server-only";
import { NextRequest } from "next/server";
import { z } from "zod";
import { access, claimOperation, route, db } from "@/lib/infographic-studio/server";
import { randomUUID } from "node:crypto";
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
 *   - "instant": { tool, topic, prompt?, structuredPrompt?, provider, aspectRatio, colorScheme, styleId, footerCta? }
 *   - "ads":     { tool, offerTitle, offerCopy, offerUrl?, provider, aspectRatio, colorScheme, styleId, footerCta? }
 *
 * `prompt` and `structuredPrompt` are accepted directly when the caller
 * wants to fully control them (e.g. the test script in scripts/test-image-gen.ts).
 * Otherwise the route builds them server-side from the structured inputs
 * via buildInfographicPrompt / buildAdsInfographicPrompt.
 *
 * All generations are billed to the platform — there is no per-user API
 * key override. Clients pay for usage through our subscription/credit
 * system; see src/lib/image-gen/usage.ts.
 */
export async function POST(request: NextRequest) {
  return route(async () => {
  const session = await access(true);
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
  const body = raw.data as
    | z.infer<typeof imageGenInstantRequestSchema>
    | z.infer<typeof imageGenAdsRequestSchema>;
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
  const footerCta = body.footerCta ?? body.context?.campaignId;
  if (tool === "ads" && "offerCopy" in body && !body.offerCopy.trim()) return jsonError(400, "Supply and review the offer details before generating.");

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
        outputLanguage: body.outputLanguage,
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
        outputLanguage: body.outputLanguage,
      });
    } else {
      const inst = body as typeof body & { topic: string };
      prompt = buildInfographicPrompt({
        topic: inst.topic,
        style,
        colorScheme,
        aspectRatio: body.aspectRatio,
        footerCta,
        outputLanguage: body.outputLanguage,
      });
      structuredPrompt = buildIdeogramJsonPrompt({
        tool: "instant",
        topic: inst.topic,
        style,
        colorScheme,
        aspectRatio: body.aspectRatio,
        footerCta,
        outputLanguage: body.outputLanguage,
      });
    }
  }

  const operationId = body.operationId ?? randomUUID();
  const { ref, existing } = await claimOperation(session, operationId, body);
  if (existing) {
    if (existing.result) return jsonOk(existing.result);
    return jsonError(409, "This generation is already pending or failed. Refresh its status; do not repeat an ambiguous request.");
  }
  try {
    const out = await generateInfographic({
      workspaceId: session.workspaceId,
      uid: session.uid,
      provider: body.provider,
      prompt,
      structuredPrompt,
      aspectRatio: body.aspectRatio,
      outputLanguage: body.outputLanguage,
      context: {
        tool,
        styleId: style.id,
        campaignId: body.context?.campaignId,
        abBucket: body.context?.abBucket,
      },
      headers: request.headers,
    });

    const result = {
      operationId,
      createdAt: new Date().toISOString(),
      provider: out.provider,
      model: out.model,
      assetId: out.assetId,
      assetUrl: out.assetUrl,
      width: out.width,
      height: out.height,
      aspectRatio: body.aspectRatio,
      costUsd: out.costUsd,
      durationMs: out.durationMs,
      fellBackFrom: out.fellBackFrom ?? null,
      styleId: style.id,
      tool,
    };
    try {
      const history = db().doc(`workspaces/${session.workspaceId}/infographicImageHistory/${session.uid}-${tool}`);
      await db().runTransaction(async tx => {
        const saved = await tx.get(history);
        const items = (saved.data()?.items ?? []) as Array<{ operationId: string }>;
        tx.set(history, { items: [result, ...items.filter(item => item.operationId !== operationId)].slice(0, 20), updatedAt: result.createdAt });
        tx.update(ref, { status: "completed", result, completedAt: result.createdAt });
      });
    }
    catch { return jsonOk({ ...result, persistenceWarning: "Image generated, but operation history could not be saved. Keep this result; do not regenerate to retry saving." }); }
    return jsonOk(result);
  } catch (err) {
    await ref.update({ status: "failed", error: "Generation failed or was interrupted. Check the result before starting another paid operation." }).catch(() => undefined);
    if (err instanceof ImageGenExhaustedError) {
      log.error("image-gen exhausted", {
        workspaceId: session.workspaceId,
        attempts: err.attempts,
      });
      const allMissingKeys = err.attempts.every(
        (a) => a.status === 0 && a.message.includes("missing platform env var")
      );
      const userMessage = allMissingKeys
        ? "Image generation is not available: no API keys configured. "
          + "Ask your administrator to set OPENROUTER_API_KEY, OPENAI_API_KEY, "
          + "or IDEOGRAM_API_KEY in the server environment."
        : "All image-gen providers failed. Try a different provider or style, or try again later.";
      return jsonError(502, userMessage, err.attempts);
    }
    const message = err instanceof Error ? err.message : "Generation failed";
    log.error("image-gen error", { workspaceId: session.workspaceId, message });
    return jsonError(500, message);
  }
  });
}
