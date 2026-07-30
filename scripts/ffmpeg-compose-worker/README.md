# FFmpeg Compose Worker — Local Testing

This worker runs on the same machine that has `ffmpeg` available. It polls
Firestore for whiteboard jobs in `waiting_compose` status, downloads their
clips, concatenates them, uploads the final `.mp4` to Bunny CDN, and writes
`finalAssets` back to the Firestore doc.

## Quick start (local testing)

The repo currently has no `package.json` script for the worker. From the
repo root:

```bash
# 1. Make sure the workspace has Firebase Admin SDK + ffmpeg available.
#    firebase-admin is already in package.json. ffmpeg must be on PATH.
ffmpeg -version

# 2. Set env vars. Copy from .env.local and add the firebase service account.
export FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
export BUNNY_STORAGE_ZONE=...
export BUNNY_STORAGE_PASSWORD=...
export BUNNY_STORAGE_HOSTNAME=storage.bunnycdn.com
export BUNNY_CDN_HOSTNAME=https://your-cdn.b-cdn.net

# 3. Run with tsx (or compile with tsc and run with node).
npx tsx src/lib/queue/ffmpeg-compose-worker.ts
```

You should see:
```
[ffmpeg-compose] starting (interval=20000ms, concurrency=2)
```

When a whiteboard job reaches `waiting_compose`, you'll see:
```
[ffmpeg-compose] <jobId>: composing <N> clips (workspace <wsId>)
[ffmpeg-compose] <jobId>: complete → https://your-cdn.b-cdn.net/...
```

## How to test end-to-end locally

1. Start the Next.js app: `npm run dev`
2. Start the video-render-worker polling (already runs in dev via the API route)
3. Start this worker: `npx tsx src/lib/queue/ffmpeg-compose-worker.ts`
4. From the dashboard, open `/dashboard/videos/whiteboard`, fill in topic,
   generate script, confirm render
5. Watch Firestore `videoJobs/{jobId}` transition:
   - `queued` → `generating_clips` (clip generation)
   - `generating_clips` → `waiting_compose` (all clips done)
   - `waiting_compose` → `composing` (this worker picks it up)
   - `composing` → `complete` (finalAssets populated)

## Production deployment (separate VPS)

For production we recommend running this on a dedicated 8GB VPS, not the main
app VPS, because FFmpeg concat is memory-hungry and we don't want it
competing with the Next.js app.

Install steps:

```bash
# On the FFmpeg VPS
sudo apt-get update && sudo apt-get install -y ffmpeg nodejs npm
git clone https://github.com/Drzola119/postplanify-clone.git
cd postplanify-clone
npm ci --omit=dev
npm install firebase-admin   # only needed dep for this worker

# Set env vars (use systemd EnvironmentFile or a .env loaded by pm2)
export FIREBASE_SERVICE_ACCOUNT='...'
export BUNNY_STORAGE_ZONE=...
export BUNNY_STORAGE_PASSWORD=...
export BUNNY_STORAGE_HOSTNAME=storage.bunnycdn.com
export BUNNY_CDN_HOSTNAME=https://your-cdn.b-cdn.net
export FFMPEG_COMPOSE_INTERVAL_MS=20000
export FFMPEG_COMPOSE_CONCURRENCY=2

# Run with pm2 for auto-restart + log capture
npm install -g pm2
pm2 start "npx tsx src/lib/queue/ffmpeg-compose-worker.ts" --name ffmpeg-worker
pm2 save
pm2 startup
```

## Notes

- This worker does NOT need Redis or BullMQ — it polls Firestore directly,
  matching the pattern used by every other worker in this codebase.
- Two workers against the same Firestore project will race. The doc-level
  `status: "waiting_compose"` → `composing` flip is the implicit claim —
  whichever worker writes `composing` first wins. Don't run more than one
  instance per Firestore project unless you add a `claimOwner` field.
- The worker uses `-c copy` (no re-encode). This is the fastest path and
  preserves the provider's audio intact — no TTS step is involved.
