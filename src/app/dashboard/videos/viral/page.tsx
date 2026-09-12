"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";

type Job = { status: string; finalAssets?: Array<{ assetUrl: string }>; error?: string | null };

export default function ViralVideoPage() {
  const [hookLine, setHookLine] = useState("");
  const [platformTarget, setPlatformTarget] = useState("reels");
  const [pacing, setPacing] = useState("fast-cut");
  const [durationSec, setDurationSec] = useState("15");
  const [captionStyle, setCaptionStyle] = useState("bold");
  const [voiceoverMode, setVoiceoverMode] = useState("none");
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!jobId || job?.status === "complete" || job?.status === "failed") return;
    const timer = window.setInterval(async () => {
      const response = await fetch(`/api/videos/${jobId}`, { credentials: "include" });
      if (response.ok) setJob(await response.json() as Job);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [jobId, job?.status]);

  async function generate() {
    setBusy(true); setError(""); setJob(null);
    try {
      const response = await fetch("/api/videos/generate", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflow: "viral", provider: "auto", styleId: "viral-default", aspectRatios: ["9:16"], hookLine, platformTarget, pacing, durationSec: Number(durationSec), captionStyle, voiceoverMode }),
      });
      const body = await response.json() as { jobId?: string; error?: string };
      if (!response.ok || !body.jobId) throw new Error(body.error || "Could not queue video");
      setJobId(body.jobId); setJob({ status: "queued" });
    } catch (err) { setError(err instanceof Error ? err.message : "Could not queue video"); }
    finally { setBusy(false); }
  }

  const result = job?.finalAssets?.[0]?.assetUrl;
  return <main className="mx-auto max-w-5xl p-4 md:p-8"><Link href="/dashboard/videos" className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-950"><ArrowLeft className="size-4" /> Video Studio</Link><div className="mt-5 grid gap-6 lg:grid-cols-[1fr_360px]"><section className="rounded-2xl border border-zinc-200 bg-white p-6"><div className="flex items-start gap-3"><div className="grid size-11 place-items-center rounded-xl bg-rose-50 text-rose-700"><Sparkles className="size-5" /></div><div><h1 className="text-2xl font-semibold">Viral / Trend Short</h1><p className="mt-1 text-sm text-zinc-600">Build a hook-first short for Reels, TikTok or Shorts.</p></div></div><label className="mt-7 block text-sm font-medium">Opening hook<textarea value={hookLine} onChange={(e) => setHookLine(e.target.value)} className="mt-1 min-h-24 w-full rounded-lg border border-zinc-200 p-3" placeholder="Stop scrolling if you want…" /></label><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Platform<select value={platformTarget} onChange={(e) => setPlatformTarget(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-zinc-200 px-3"><option value="reels">Instagram Reels</option><option value="tiktok">TikTok</option><option value="shorts">YouTube Shorts</option></select></label><label className="text-sm font-medium">Pacing<select value={pacing} onChange={(e) => setPacing(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-zinc-200 px-3"><option value="fast-cut">Fast cut</option><option value="single-take">Single take</option></select></label><label className="text-sm font-medium">Duration<select value={durationSec} onChange={(e) => setDurationSec(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-zinc-200 px-3"><option value="5">5 seconds</option><option value="8">8 seconds</option><option value="10">10 seconds</option><option value="15">15 seconds</option><option value="30">30 seconds</option><option value="60">60 seconds</option></select></label><label className="text-sm font-medium">Captions<select value={captionStyle} onChange={(e) => setCaptionStyle(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-zinc-200 px-3"><option value="bold">Bold captions</option><option value="none">No captions</option></select></label></div><label className="mt-4 block text-sm font-medium">Voiceover<select value={voiceoverMode} onChange={(e) => setVoiceoverMode(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-zinc-200 px-3"><option value="none">No voiceover</option><option value="auto">Generate voiceover</option></select></label>{error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button type="button" disabled={busy || !hookLine.trim() || Boolean(jobId && job?.status !== "failed")} onClick={() => void generate()} className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-zinc-950 px-5 text-sm font-semibold text-white disabled:opacity-50">{busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}{busy ? "Starting…" : "Generate short"}</button></section><aside className="rounded-2xl border border-zinc-200 bg-white p-4"><p className="text-sm font-semibold">Preview</p><div className="mt-3 aspect-[9/16] max-h-[520px] overflow-hidden rounded-xl bg-zinc-950">{result ? <video controls src={result} className="size-full object-contain" /> : job ? <div className="grid size-full place-items-center p-6 text-center text-sm text-zinc-300">{job.status === "failed" ? job.error || "Generation failed" : <span><Loader2 className="mx-auto mb-3 size-6 animate-spin" />{job.status.replaceAll("_", " ")}</span>}</div> : <div className="grid size-full place-items-center p-6 text-center text-sm text-zinc-400">Your generated short will appear here.</div>}</div>{result && <Link href="/dashboard/assets" className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-zinc-200 px-3 py-2 text-sm font-semibold hover:bg-zinc-50">Open in Media Library</Link>}</aside></div></main>;
}
