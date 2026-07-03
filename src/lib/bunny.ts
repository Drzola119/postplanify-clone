import "server-only";

const ZONE = process.env.BUNNY_STORAGE_ZONE!;
const HOSTNAME = process.env.BUNNY_STORAGE_HOSTNAME ?? "storage.bunnycdn.com";
const PASSWORD = process.env.BUNNY_STORAGE_PASSWORD!;
const CDN = process.env.BUNNY_CDN_HOSTNAME ?? "https://zzar.b-cdn.net";

const MAX_BYTES = 100 * 1024 * 1024; // 100 MB

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

/** PUT file to Bunny storage. Returns the cdnUrl (public) and storedPath (for delete). */
export async function uploadToBunny(args: {
  userId: string;
  folder: "posts" | "brands" | "avatars" | "assets";
  filename: string;
  contentType: string;
  body: Buffer;
}): Promise<{ cdnUrl: string; storedPath: string }> {
  if (!ZONE || !PASSWORD) {
    throw new Error("Bunny storage not configured (set BUNNY_STORAGE_ZONE and BUNNY_STORAGE_PASSWORD)");
  }
  if (args.body.length === 0) throw new Error("Empty file");
  if (args.body.length > MAX_BYTES) throw new Error("File exceeds 100 MB limit");

  const safe = sanitizeFilename(args.filename);
  const storedPath = `${args.userId}/${args.folder}/${Date.now()}_${safe}`;
  const uploadUrl = `https://${HOSTNAME}/${ZONE}/${storedPath}`;

  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      AccessKey: PASSWORD,
      "Content-Type": args.contentType,
    },
    body: new Uint8Array(args.body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Bunny upload failed (${res.status}): ${text.slice(0, 200)}`);
  }

  return {
    cdnUrl: `${CDN.replace(/\/$/, "")}/${storedPath}`,
    storedPath,
  };
}

/** DELETE a file by its storedPath. The storedPath MUST start with `${userId}/` — otherwise
 * throws to prevent IDOR (a user can only delete their own files). */
export async function deleteFromBunny(args: { userId: string; storedPath: string }): Promise<void> {
  if (!ZONE || !PASSWORD) throw new Error("Bunny storage not configured");
  const prefix = `${args.userId}/`;
  if (!args.storedPath.startsWith(prefix)) {
    throw new Error("Forbidden: storedPath does not belong to this user");
  }
  const url = `https://${HOSTNAME}/${ZONE}/${args.storedPath}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: { AccessKey: PASSWORD },
  });
  if (!res.ok && res.status !== 404) {
    const text = await res.text().catch(() => "");
    throw new Error(`Bunny delete failed (${res.status}): ${text.slice(0, 200)}`);
  }
}

/** Build a Bunny derivative/thumbnail URL for a storedPath. Optionally append a transform
 * query (?width= or ?aspect_ratio=) handled by imgproxy if configured downstream. */
export function bunnyThumbUrl(storedPath: string, width = 480): string {
  const base = `${CDN.replace(/\/$/, "")}/${storedPath}`;
  return `${base}?width=${width}`;
}

export const BUNNY_CDN_BASE = CDN;
