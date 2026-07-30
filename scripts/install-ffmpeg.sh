#!/usr/bin/env bash
# scripts/install-ffmpeg.sh
#
# Installs FFmpeg on a Debian/Ubuntu VPS (Hostinger, Hetzner, DigitalOcean, etc.).
# Used by the whiteboard video pipeline — the FFmpeg compose worker on the main
# app VPS calls `ffmpeg` to concatenate whiteboard clips into the final .mp4.
#
# For production we still recommend running FFmpeg on a dedicated 8GB VPS to
# keep memory pressure off the main Next.js app — but this script installs it
# on whichever host you run it on.
#
# Usage:
#   chmod +x scripts/install-ffmpeg.sh
#   sudo ./scripts/install-ffmpeg.sh
#
# Verify after install:
#   ffmpeg -version | head -1
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "[install-ffmpeg] Re-running with sudo..."
  exec sudo bash "$0" "$@"
fi

echo "[install-ffmpeg] Refreshing apt cache..."
apt-get update -y

echo "[install-ffmpeg] Installing FFmpeg..."
# ubuntu-restricted-extras unlocks extra codecs commonly needed for whiteboard
# provider outputs (h264, aac, opus). Safe to skip if licensing is a concern.
apt-get install -y --no-install-recommends \
  ffmpeg \
  ca-certificates

echo "[install-ffmpeg] Cleaning apt cache to free disk..."
apt-get clean
rm -rf /var/lib/apt/lists/*

echo ""
echo "[install-ffmpeg] Installed version:"
ffmpeg -version | head -1

echo ""
echo "[install-ffmpeg] Verifying concat demuxer (the only operation we use)..."
ffmpeg -hide_banner -h demuxer=concat 2>&1 | head -3

echo ""
echo "[install-ffmpeg] Done. Required env vars for ffmpeg-compose-worker.ts:"
echo "  FIREBASE_SERVICE_ACCOUNT   JSON-stringified Firebase Admin service account"
echo "  BUNNY_STORAGE_ZONE         e.g. trustiify-storage"
echo "  BUNNY_STORAGE_PASSWORD     Bunny storage API key"
echo "  BUNNY_STORAGE_HOSTNAME     default: storage.bunnycdn.com"
echo "  BUNNY_CDN_HOSTNAME         default: https://trustiify.b-cdn.net"
echo ""
echo "Optional tunables:"
echo "  FFMPEG_COMPOSE_INTERVAL_MS  poll interval (default 20000)"
echo "  FFMPEG_COMPOSE_CONCURRENCY  max concurrent compose jobs (default 2)"
