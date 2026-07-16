import "server-only";
import { resolvers } from "@/lib/security/server-config";
import { uploadToBunny } from "@/lib/bunny";
import { createAsset } from "@/lib/db/media-assets";
import { createLogger } from "@/lib/log";

const log = createLogger("image-gen/asset-saver");

export interface PersistedAsset {
  assetId: string;
  cdnUrl: string;
  storedPath: string;
}

/**
 * Upload a generated image to Bunny CDN and persist a MediaAsset record.
 *
 * Tagging convention: `["infographic", tool, styleId]` so the media
 * library filters can find these images later.
 */
export async function persistGeneratedImage(args: {
  workspaceId: string;
  uid: string;
  bytes: Buffer;
  mime: "image/png" | "image/jpeg" | "image/webp";
  width?: number;
  height?: number;
  tool?: "instant" | "ads";
  styleId?: string;
  headers?: Headers;
}): Promise<PersistedAsset> {
  const tags = ["infographic"];
  if (args.tool) tags.push(`tool:${args.tool}`);
  if (args.styleId) tags.push(`style:${args.styleId}`);

  const ext = args.mime === "image/png" ? "png" : args.mime === "image/webp" ? "webp" : "jpg";
  const filename = `infographic_${Date.now()}.${ext}`;

  const bunny = resolvers.bunny(args.headers ?? new Headers());

  const { cdnUrl, storedPath } = await uploadToBunny({
    userId: args.uid,
    folder: "assets",
    filename,
    contentType: args.mime,
    body: args.bytes,
    zone: bunny.zone,
    password: bunny.password,
  });

  try {
    const assetId = await createAsset(args.workspaceId, args.uid, {
      url: cdnUrl,
      storedPath,
      mime: args.mime,
      size: args.bytes.length,
      width: args.width,
      height: args.height,
      tags,
      folder: "assets",
    });
    return { assetId, cdnUrl, storedPath };
  } catch (err) {
    log.error(err, { step: "createAsset", url: cdnUrl });
    // We have the URL — fall through and return a synthetic id so the
    // caller can still surface the image even if Firestore failed.
    return { assetId: "", cdnUrl, storedPath };
  }
}