/**
 * ffmpeg-compose-worker.ts
 *
 * Standalone Node.js worker that lives on a dedicated FFmpeg VPS. It is
 * NOT part of the Next.js application — it is its own process, run with
 * `node ffmpeg-compose-worker.js` (or via PM2/systemd).
 *
 * Flow:
 *   1. Poll Firestore `collectionGroup("videoJobs").where("status","==","waiting_compose")`.
 *   2. For each ready job, transition to `composing`, download all clips,
 *      run a single FFmpeg concat (`-c copy`), upload the final .mp4 to
 *      Bunny CDN, then write `finalAssets` and status `complete`.
 *   3. On any error, transition to `failed` with a message.
 *
 * Cross-VPS coordination:
 *   The main app's video-render-worker flips whiteboard jobs from
 *   `generating_clips` to `waiting_compose` once every clip is rendered.
 *   This worker is the single owner of `composing → complete` for that
 *   state machine — never run two copies against the same Firestore
 *   project unless you add a claim mechanism.
 *
 * Deployment:
 *   VPS: 8GB RAM (FFmpeg is memory-hungry during large concats).
 *   apt-get install -y ffmpeg
 *   npm i firebase-admin
 *   env: FIREBASE_SERVICE_ACCOUNT, BUNNY_STORAGE_ZONE, BUNNY_STORAGE_PASSWORD,
 *        BUNNY_STORAGE_HOSTNAME, BUNNY_CDN_HOSTNAME,
 *        FFMPEG_COMPOSE_INTERVAL_MS, FFMPEG_COMPOSE_CONCURRENCY
 *   pm2 start ffmpeg-compose-worker.js --name ffmpeg-worker
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, rm, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import {
  initializeApp,
  cert,
  getApps,
  type App,
} from "firebase-admin/app";
import {
  getFirestore,
  FieldValue,
  type Firestore,
} from "firebase-admin/firestore";

const execFileAsync = promisify(execFile);

// ─── Firebase Admin bootstrap (no Next.js) ────────────────────────────────────

function loadServiceAccount(): Record<string, unknown> {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT env var is required (JSON-stringified service account)"
    );
  }
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch (err) {
    throw new Error(
      `FIREBASE_SERVICE_ACCOUNT is not valid JSON: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
}

function initFirebase(): { app: App; db: Firestore } {
  const existing = getApps()[0];
  const app =
    existing ??
    initializeApp({
      credential: cert(loadServiceAccount() as Parameters<typeof cert>[0]),
    });
  const db = getFirestore(app);
  return { app, db };
}

// ─── Bunny upload (mirror of src/lib/bunny.ts without the Next.js wrapper) ──

const BUNNY_HOSTNAME = process.env.BUNNY_STORAGE_HOSTNAME ?? "storage.bunnycdn.com";
const BUNNY_ZONE = process.env.BUNNY_STORAGE_ZONE ?? "";
const BUNNY_KEY = process.env.BUNNY_STORAGE_PASSWORD ?? "";
const BUNNY_CDN = process.env.BUNNY_CDN_HOSTNAME ?? "";

async function uploadFinal(args: {
  workspaceId: string;
  jobId: string;
  buffer: Buffer;
}): Promise<{ cdnUrl: string; storedPath: string }> {
  if (!BUNNY_ZONE || !BUNNY_KEY) {
    throw new Error(
      "Bunny storage not configured (set BUNNY_STORAGE_ZONE and BUNNY_STORAGE_PASSWORD)"
    );
  }
  const filename = `whiteboard-${args.jobId}-${Date.now()}.mp4`;
  const storedPath = `${args.workspaceId}/videos/${filename}`;
  const uploadUrl = `https://${BUNNY_HOSTNAME}/${BUNNY_ZONE}/${storedPath}`;

  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      AccessKey: BUNNY_KEY,
      "Content-Type": "video/mp4",
    },
    body: new Uint8Array(args.buffer),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Bunny upload failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const cdnUrl = `${BUNNY_CDN.replace(/\/$/, "")}/${storedPath}`;
  return { cdnUrl, storedPath };
}

// ─── FFmpeg concat ───────────────────────────────────────────────────────────

interface ComposeJobShape {
  workspaceId: string;
  jobId: string;
  clipUrls: string[];
  aspectRatio: "9:16" | "16:9" | "1:1";
}

async function composeFinalVideo(job: ComposeJobShape): Promise<{
  cdnUrl: string;
  storedPath: string;
}> {
  const workdir = join(tmpdir(), `compose-${job.jobId}-${randomUUID()}`);
  await mkdir(workdir, { recursive: true });

  try {
    // 1. Download every clip sequentially — keeps FFmpeg VPS I/O sane.
    const clipPaths: string[] = [];
    for (let i = 0; i < job.clipUrls.length; i++) {
      const url = job.clipUrls[i];
      if (!url) {
        throw new Error(`Missing clip URL at index ${i}`);
      }
      const clipPath = join(workdir, `clip-${String(i).padStart(3, "0")}.mp4`);
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to download clip ${i} (${url}): ${res.status}`);
      }
      const buf = Buffer.from(await res.arrayBuffer());
      await writeFile(clipPath, buf);
      clipPaths.push(clipPath);
    }

    // 2. Write concat list file.
    const listPath = join(workdir, "concat.txt");
    const listBody = clipPaths
      .map((p) => `file '${p.replace(/'/g, "'\\''")}'`)
      .join("\n");
    await writeFile(listPath, listBody);

    // 3. FFmpeg concat demuxer with stream copy.
    const outPath = join(workdir, "final.mp4");
    await execFileAsync(
      "ffmpeg",
      [
        "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", listPath,
        "-c", "copy",
        "-movflags", "+faststart",
        outPath,
      ],
      { maxBuffer: 64 * 1024 * 1024 }
    );

    // 4. Upload to Bunny CDN.
    const finalBuffer = await readFile(outPath);
    return await uploadFinal({
      workspaceId: job.workspaceId,
      jobId: job.jobId,
      buffer: finalBuffer,
    });
  } finally {
    await rm(workdir, { recursive: true, force: true });
  }
}

// ─── Worker tick ─────────────────────────────────────────────────────────────

const INTERVAL_MS = Number(process.env.FFMPEG_COMPOSE_INTERVAL_MS ?? 20_000);
const MAX_CONCURRENCY = Number(process.env.FFMPEG_COMPOSE_CONCURRENCY ?? 2);

let running = false;
let inFlight = 0;
let timer: NodeJS.Timeout | null = null;

async function tickOnce(db: Firestore): Promise<void> {
  if (inFlight >= MAX_CONCURRENCY) return;

  let snapshot;
  try {
    snapshot = await db
      .collectionGroup("videoJobs")
      .where("status", "==", "waiting_compose")
      .orderBy("updatedAt", "asc")
      .limit(MAX_CONCURRENCY - inFlight)
      .get();
  } catch (err) {
    console.error("[ffmpeg-compose] failed to query videoJobs", err);
    return;
  }
  if (snapshot.empty) return;

  for (const jobSnap of snapshot.docs) {
    inFlight++;
    // Don't await — process jobs concurrently up to MAX_CONCURRENCY.
    void processComposeJob(db, jobSnap.ref).finally(() => {
      inFlight--;
    });
  }
}

async function processComposeJob(
  db: Firestore,
  jobRef: FirebaseFirestore.DocumentReference
): Promise<void> {
  const jobId = jobRef.id;
  const workspaceId = jobRef.parent.parent?.id;
  if (!workspaceId) {
    console.error(`[ffmpeg-compose] ${jobId}: could not resolve workspaceId`);
    return;
  }

  try {
    const snap = await jobRef.get();
    const data = snap.data();
    if (!data || data.status !== "waiting_compose") {
      // Already taken by another worker or transitioned.
      return;
    }
    const clips = (data.clips ?? []) as Array<{
      status: string;
      assetUrl?: string;
      index: number;
    }>;
    const orderedClips = [...clips]
      .filter((c) => c.status === "complete" && c.assetUrl)
      .sort((a, b) => a.index - b.index);
    if (orderedClips.length === 0) {
      throw new Error("No completed clips found for compose job");
    }
    const aspectRatio = (data.aspectRatio ?? "16:9") as ComposeJobShape["aspectRatio"];

    await jobRef.update({
      status: "composing",
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log(
      `[ffmpeg-compose] ${jobId}: composing ${orderedClips.length} clips (workspace ${workspaceId})`
    );

    const { cdnUrl } = await composeFinalVideo({
      workspaceId,
      jobId,
      aspectRatio,
      clipUrls: orderedClips.map((c) => c.assetUrl!),
    });

    await jobRef.update({
      status: "complete",
      finalAssets: [{ aspectRatio, assetId: `whiteboard-${jobId}-final`, assetUrl: cdnUrl }],
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log(`[ffmpeg-compose] ${jobId}: complete → ${cdnUrl}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[ffmpeg-compose] ${jobId} failed:`, message);
    try {
      await jobRef.update({
        status: "failed",
        error: `FFmpeg compose: ${message}`,
        updatedAt: FieldValue.serverTimestamp(),
      });
    } catch (writeErr) {
      console.error(`[ffmpeg-compose] ${jobId} could not write failure status:`, writeErr);
    }
  }
}

// ─── Entry point ─────────────────────────────────────────────────────────────

function main(): void {
  console.log(
    `[ffmpeg-compose] starting (interval=${INTERVAL_MS}ms, concurrency=${MAX_CONCURRENCY})`
  );
  const { db } = initFirebase();

  const run = () => {
    if (running) return;
    running = true;
    tickOnce(db)
      .catch((err) => console.error("[ffmpeg-compose] tick error", err))
      .finally(() => {
        running = false;
      });
  };

  run();
  timer = setInterval(run, INTERVAL_MS);
  // Intentionally do NOT call .unref() here — the timer is what keeps this
  // long-running worker alive between firestore polls. With .unref(), Node
  // would exit after the first poll cycle once the gRPC connection goes idle.
}

function shutdown(signal: string): void {
  console.log(`[ffmpeg-compose] received ${signal}, shutting down`);
  if (timer) clearInterval(timer);
  // Give in-flight jobs 5s to commit before exiting.
  setTimeout(() => process.exit(0), 5_000).unref();
}

/**
 * Detect whether this module is the entry point. Supports both CJS
 * (`node ffmpeg-compose-worker.cjs`) and ESM (`node --experimental-modules`)
 * runtimes — the FFmpeg VPS deployment may use either depending on the
 * build toolchain.
 */
function isMain(): boolean {
  // CJS path — guarded so TypeScript ESM projects don't choke on the reference.
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
    const req = (globalThis as any).require;
    if (typeof req === "function") {
      const m = req("node:module");
      if (m && typeof m === "object" && "main" in m) {
        return m.main === req("./" + (typeof __filename !== "undefined" ? __filename : ""));
      }
    }
  } catch {
    // fall through to ESM detection
  }
  // ESM path.
  try {
    const entry = fileURLToPath(import.meta.url);
    return resolve(entry) === resolve(process.argv[1] ?? "");
  } catch {
    return false;
  }
}

if (isMain()) {
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  main();
}
