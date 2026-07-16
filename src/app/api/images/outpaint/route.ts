import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session-context";
import { EngineError, startOutpaintJob } from "@/lib/images/engine-client";
import { createLogger } from "@/lib/log";

const log = createLogger("api/images/outpaint");

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/images/outpaint
 *
 * Accepts a multipart upload (`image` file) + `platforms` JSON string +
 * optional `skipDelivery`/`promptMode`/`providerOverride` fields.
 *
 * Forwards to the adsify engine (POST /api/images/outpaint) using the
 * caller's Firebase ID token (passed through the Authorization header).
 *
 * Returns 202 with `{ jobId, status, platforms, ratioGroups, estimatedVariants }`.
 */
export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (session instanceof Response) return session;

  // Extract the user's Firebase ID token from the incoming Authorization
  // header. The composer sends this so the engine can `verifyIdToken` it.
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing Firebase ID token in Authorization header" },
      { status: 401 }
    );
  }
  const idToken = authHeader.slice("Bearer ".length).trim();
  if (!idToken) {
    return NextResponse.json({ error: "Empty Firebase ID token" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const image = form.get("image");
  if (!(image instanceof File)) {
    return NextResponse.json({ error: "Missing 'image' file field" }, { status: 400 });
  }

  const platformsRaw = form.get("platforms");
  if (typeof platformsRaw !== "string" || !platformsRaw) {
    return NextResponse.json({ error: "Missing 'platforms' field" }, { status: 400 });
  }
  let platforms: string[];
  try {
    const parsed = JSON.parse(platformsRaw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("platforms must be a non-empty array");
    }
    platforms = parsed.map((p: unknown) =>
      typeof p === "string" ? p.toLowerCase().trim() : ""
    ).filter((p) => p.length > 0);
  } catch (err) {
    return NextResponse.json(
      { error: `Invalid 'platforms' field: ${err instanceof Error ? err.message : "parse failed"}` },
      { status: 400 }
    );
  }

  const skipDeliveryRaw = form.get("skipDelivery");
  const skipDelivery =
    skipDeliveryRaw === "true" || skipDeliveryRaw === "1";

  const providerOverrideRaw = form.get("providerOverride");
  const providerOverride =
    providerOverrideRaw === "google" || providerOverrideRaw === "openai" || providerOverrideRaw === "auto"
      ? (providerOverrideRaw as "google" | "openai" | "auto")
      : undefined;

  const promptModeRaw = form.get("promptMode");
  const promptMode =
    promptModeRaw === "product_marketing" ||
    promptModeRaw === "people_lifestyle" ||
    promptModeRaw === "cars_vehicles" ||
    promptModeRaw === "interiors" ||
    promptModeRaw === "graphics_with_text"
      ? (promptModeRaw as
          | "product_marketing"
          | "people_lifestyle"
          | "cars_vehicles"
          | "interiors"
          | "graphics_with_text")
      : undefined;

  const postCaptionRaw = form.get("postCaption");
  const postCaption = typeof postCaptionRaw === "string" ? postCaptionRaw : undefined;

  // Per trustiify product requirement, the composer always uses
  // skipDelivery=true so it can publish per-platform with the
  // workspace's own upload-post credentials (not the engine's Adsify
  // profile). The flag is exposed so future server-to-server callers can
  // opt in to the engine's default delivery flow.
  const effectiveSkipDelivery = skipDelivery !== false;

  try {
    const buf = Buffer.from(await image.arrayBuffer());
    const result = await startOutpaintJob({
      sourceBuffer: buf,
      mimeType: image.type || "image/jpeg",
      platforms,
      skipDelivery: effectiveSkipDelivery,
      providerOverride,
      promptMode,
      postCaption,
      idToken,
    });
    log.info("[api/images/outpaint] engine job started", {
      jobId: result.jobId,
      estimatedVariants: result.estimatedVariants,
      platforms: result.platforms,
    });
    return NextResponse.json(result, { status: 202 });
  } catch (err) {
    if (err instanceof EngineError) {
      log.warn(`[api/images/outpaint] engine error ${err.status}`, {
        status: err.status,
        body: err.body,
      });
      return NextResponse.json(
        { error: err.message, engineStatus: err.status, engineBody: err.body },
        { status: err.status === 404 ? 404 : 502 }
      );
    }
    log.error("[api/images/outpaint] unexpected error", { err });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unexpected error" },
      { status: 500 }
    );
  }
}