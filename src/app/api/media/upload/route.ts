import "server-only";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/firebase/admin";
import { headers } from "next/headers";
import { uploadToBunny } from "@/lib/bunny";

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
  const buf = Buffer.from(await file.arrayBuffer());

  try {
    const headersList = await headers();
    const zone = headersList.get("x-bunny-zone") || undefined;
    const password = headersList.get("x-bunny-password") || undefined;

    const { cdnUrl, storedPath } = await uploadToBunny({
      userId: user.uid,
      folder: safeFolder,
      filename: file.name || "upload",
      contentType: file.type,
      body: buf,
      zone,
      password,
    });
    return NextResponse.json({
      ok: true,
      url: cdnUrl,
      storedPath,
      size: file.size,
      contentType: file.type,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
