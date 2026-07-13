import "server-only";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/firebase/admin";
import { resolvers } from "@/lib/security/server-config";
import { uploadToBunny } from "@/lib/bunny";
import { createAsset } from "@/lib/db/media-assets";
import { ensureDefaultWorkspace } from "@/lib/db/workspaces";

const MAX_BYTES = 100 * 1024 * 1024; // 100 MB
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const file = form.get("file");
  const folder = (form.get("folder") as string | null) ?? "assets";
  const tagsRaw = form.get("tags");
  const widthRaw = form.get("width");
  const heightRaw = form.get("height");
  const durationRaw = form.get("duration");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "Empty file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File exceeds 100 MB limit" }, { status: 413 });
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: `Unsupported media type: ${file.type}` }, { status: 415 });
  }

  const allowedFolders = ["posts", "brands", "avatars", "assets"] as const;
  type Folder = (typeof allowedFolders)[number];
  const safeFolder: Folder = (allowedFolders as readonly string[]).includes(folder)
    ? (folder as Folder)
    : "assets";

  const tags = typeof tagsRaw === "string"
    ? tagsRaw.split(",").map((t) => t.trim()).filter((t) => t.length > 0 && t.length <= 64).slice(0, 30)
    : [];
  const width = typeof widthRaw === "string" ? Math.max(0, Math.min(20000, parseInt(widthRaw, 10) || 0)) : undefined;
  const height = typeof heightRaw === "string" ? Math.max(0, Math.min(20000, parseInt(heightRaw, 10) || 0)) : undefined;
  const duration = typeof durationRaw === "string" ? Math.max(0, Math.min(86400, parseFloat(durationRaw) || 0)) : undefined;

  const buf = Buffer.from(await file.arrayBuffer());

  try {
    const bunny = resolvers.bunny(request.headers);

    const { cdnUrl, storedPath } = await uploadToBunny({
      userId: user.uid,
      folder: safeFolder,
      filename: file.name || "upload",
      contentType: file.type,
      body: buf,
      zone: bunny.zone,
      password: bunny.password,
    });

    let assetId: string | null = null;
    try {
      const workspaceId = await ensureDefaultWorkspace(user.uid, user.email);
      assetId = await createAsset(workspaceId, user.uid, {
        url: cdnUrl,
        storedPath,
        mime: file.type,
        size: file.size,
        width,
        height,
        duration,
        tags,
        folder: safeFolder,
      });
    } catch (err) {
      // Don't fail the upload just because the metadata row failed to persist.
      console.error("[media/upload] failed to persist mediaAsset row:", err);
    }

    return NextResponse.json({
      ok: true,
      url: cdnUrl,
      storedPath,
      size: file.size,
      contentType: file.type,
      assetId,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
