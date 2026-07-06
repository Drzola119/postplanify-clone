import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  if (!url) return new NextResponse("Missing url param", { status: 400 });

  let decoded: string;
  try {
    decoded = decodeURIComponent(url);
  } catch {
    return new NextResponse("Invalid url param", { status: 400 });
  }

  // Refuse anything that isn't a same-site public asset. The optimizer should
  // never proxy external URLs through here.
  if (
    decoded.startsWith("http://") ||
    decoded.startsWith("https://") ||
    decoded.startsWith("//") ||
    !decoded.startsWith("/")
  ) {
    return new NextResponse("Only same-origin paths are allowed", { status: 400 });
  }

  // Strip query string the original asset may have carried through.
  const cleanPath = decoded.split("?")[0].split("#")[0];

  // Prevent traversal: resolve and confirm the result is still under public/.
  const publicDir = path.join(process.cwd(), "public");
  const absPath = path.normalize(path.join(publicDir, cleanPath));
  if (!absPath.startsWith(publicDir)) {
    return new NextResponse("Path traversal blocked", { status: 400 });
  }

  if (!fs.existsSync(absPath) || !fs.statSync(absPath).isFile()) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const ext = path.extname(absPath).toLowerCase();
  const contentType = MIME[ext] || "application/octet-stream";
  const buf = fs.readFileSync(absPath);

  return new NextResponse(buf, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}