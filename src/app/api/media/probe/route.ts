import { NextRequest, NextResponse } from "next/server";
import { classifyAspectRatio, formatVideoDuration } from "@/lib/media/video-metadata";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Missing or invalid url" }, { status: 400 });
    }

    // Attempt a HEAD or range request to confirm the media is reachable and content-type is video
    const headRes = await fetch(url, { method: "HEAD" });
    const contentType = headRes.headers.get("content-type") || "";
    const contentLength = headRes.headers.get("content-length");

    return NextResponse.json({
      success: true,
      url,
      mimeType: contentType,
      sizeBytes: contentLength ? parseInt(contentLength, 10) : 0,
      // Default heuristic for remote URLs until client decodes:
      orientation: "unknown",
      aspectRatio: "custom",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to probe media" },
      { status: 500 }
    );
  }
}
