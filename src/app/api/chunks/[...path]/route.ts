import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: any }
) {
  // Support both async (Next.js 15+) and sync (Next.js 13/14) params
  const resolvedParams = params && typeof params.then === "function" ? await params : params;
  const pathSegments = (resolvedParams && resolvedParams.path) || [];
  const rawFileName = pathSegments.join("/");

  // Sanitize: normalize, strip leading slashes/dots, block traversal
  const normalized = path.normalize(rawFileName).replace(/^(\.\.[\/\\])+/, "").replace(/^[\/\\]+/, "");
  if (!normalized || normalized.includes("..") || normalized.includes("\0") || /[<>:"|?*]/.test(normalized)) {
    return new NextResponse("Not Found", { status: 404 });
  }
  // Only allow js/css and their maps/sourcemaps inside chunks
  if (!/^[a-zA-Z0-9._\-\/]+\.(js|css)(\.map)?$/.test(normalized)) {
    return new NextResponse("Not Found", { status: 404 });
  }
  const fileName = normalized;

  // Define candidate file paths where the static chunks could be located
  const allowedBases = [
    path.join(process.cwd(), ".next", "static", "chunks"),
    path.join(process.cwd(), ".next", "standalone", ".next", "static", "chunks"),
    path.join(process.cwd(), ".next", "standalone", "static", "chunks"),
  ];
  const candidates = allowedBases.map((base) => path.join(base, fileName));

  let filePath = "";
  for (const candidate of candidates) {
    // Ensure candidate stays within allowed base
    const isInside = allowedBases.some((base) => candidate.startsWith(base + path.sep) || candidate === path.join(base, fileName));
    if (!isInside) continue;
    if (fs.existsSync(candidate)) {
      // Double-check realpath is inside base (symlink guard)
      try {
        const real = fs.realpathSync(candidate);
        if (!allowedBases.some((base) => real.startsWith(base))) continue;
      } catch {}
      filePath = candidate;
      break;
    }
  }

  // If the file exists, read and serve it
  if (filePath) {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const contentType = fileName.endsWith(".css") ? "text/css" : "application/javascript";

      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch (err) {
      // Fall through to fallback handler if read fails
    }
  }

  // File does not exist (chunk mismatch 404 due to cached HTML)
  if (fileName.endsWith(".js")) {
    const reloadScript =
      `console.warn("Chunk 404 resolved by proxy reload: ${fileName}");\n` +
      `if (!window.location.search.includes("cb=")) {\n` +
      `  var url = new URL(window.location.href);\n` +
      `  url.searchParams.set("cb", Date.now().toString());\n` +
      `  window.location.replace(url.toString());\n` +
      `} else {\n` +
      `  console.error("Chunk still missing after cache-busting reload: ${fileName}");\n` +
      `}\n`;

    return new NextResponse(reloadScript, {
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache",
      },
    });
  }

  if (fileName.endsWith(".css")) {
    // Return empty CSS to prevent stylesheet parse crash
    return new NextResponse("", {
      headers: {
        "Content-Type": "text/css",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache",
      },
    });
  }

  return new NextResponse("Not Found", { status: 404 });
}
