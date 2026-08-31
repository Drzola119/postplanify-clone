import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/firebase/admin";
import { classifyAspectRatio, formatVideoDuration } from "@/lib/media/video-metadata";

const ALLOWED_PROTOCOLS = new Set(["https:"]);
const BLOCKED_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);
const BLOCKED_PREFIXES = ["10.", "172.16.", "172.17.", "172.18.", "172.19.", "172.20.", "172.21.", "172.22.", "172.23.", "172.24.", "172.25.", "172.26.", "172.27.", "172.28.", "172.29.", "172.30.", "172.31.", "192.168.", "169.254."];

function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(h)) return true;
  for (const p of BLOCKED_PREFIXES) if (h.startsWith(p)) return true;
  // Block .internal, .local, metadata endpoints
  if (h === "metadata.google.internal" || h.endsWith(".internal") || h.endsWith(".local")) return true;
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Missing or invalid url" }, { status: 400 });
    }
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }
    if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
      return NextResponse.json({ error: "Only https URLs are allowed" }, { status: 400 });
    }
    if (isBlockedHost(parsed.hostname)) {
      return NextResponse.json({ error: "URL host is not allowed" }, { status: 400 });
    }

    // Attempt a HEAD or range request to confirm the media is reachable and content-type is video
    const headRes = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(5000) });
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
