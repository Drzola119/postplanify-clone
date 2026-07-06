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
  const fileName = pathSegments.join("/");

  // Define candidate file paths where the static chunks could be located
  const candidates = [
    path.join(process.cwd(), ".next", "static", "chunks", fileName),
    path.join(process.cwd(), ".next", "standalone", ".next", "static", "chunks", fileName),
    path.join(process.cwd(), "..", ".next", "static", "chunks", fileName),
    path.join(process.cwd(), ".next", "standalone", "static", "chunks", fileName),
    path.join(process.cwd(), "static", "chunks", fileName),
    path.resolve(process.cwd(), ".next/static/chunks", fileName),
  ];

  let filePath = "";
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      filePath = candidate;
      break;
    }
  }

  // Log details to server logs for diagnostics
  console.log(
    `[Chunk Proxy] Request: "${fileName}" | Resolved: "${filePath || "NOT FOUND"}" | cwd: "${process.cwd()}"`
  );

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
