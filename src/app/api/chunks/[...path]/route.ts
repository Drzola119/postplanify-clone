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

  // Construct the absolute path to the file in the .next/static/chunks directory
  const filePath = path.join(
    process.cwd(),
    ".next",
    "static",
    "chunks",
    fileName
  );

  // If the file exists on the server's local disk, read and return it
  if (fs.existsSync(filePath)) {
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
      `var url = new URL(window.location.href);\n` +
      `url.searchParams.set("cb", Date.now().toString());\n` +
      `window.location.replace(url.toString());\n`;

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
