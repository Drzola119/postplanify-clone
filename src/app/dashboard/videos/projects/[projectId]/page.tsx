"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, Film, Loader2, RefreshCw } from "lucide-react";

type Project = {
  id: string; title: string; description?: string; workflow: string; lifecycle: string; renderStatus: string; reviewStatus: string; publishingStatus: string; revisionCount?: number; currentRevisionId?: string; variants?: Array<{ id: string; aspectRatio: string; assetUrl?: string; status: string }>;
};

export default function VideoProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const [projectId, setProjectId] = useState("");

  async function load(id: string) {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/videos/projects/${id}`, { credentials: "include" });
      const body = await response.json() as { project?: Project; error?: { message?: string } };
      if (!response.ok || !body.project) throw new Error(body.error?.message || "Could not load project");
      setProject(body.project);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not load project"); }
    finally { setBusy(false); }
  }

  useEffect(() => { void params.then(({ projectId: id }) => { setProjectId(id); void load(id); }); }, [params]);

  if (busy) return <main className="mx-auto max-w-6xl p-8"><div className="flex items-center gap-2 text-sm text-zinc-500"><Loader2 className="size-4 animate-spin" /> Loading project…</div></main>;
  if (error || !project) return <main className="mx-auto max-w-6xl p-8"><Link href="/dashboard/videos" className="inline-flex items-center gap-2 text-sm text-zinc-600"><ArrowLeft className="size-4" /> Video Studio</Link><p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error || "Project not found"}</p></main>;
  const variants = project.variants || [];
  return <main className="mx-auto max-w-6xl p-4 md:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><Link href="/dashboard/videos" className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-950"><ArrowLeft className="size-4" /> Video Studio</Link><button type="button" onClick={() => void load(projectId)} className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium hover:bg-zinc-50"><RefreshCw className="size-4" /> Refresh</button></div><header className="mt-7 flex flex-wrap items-start justify-between gap-5"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">{project.workflow.replaceAll("-", " ")}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">{project.title}</h1><p className="mt-2 max-w-xl text-sm text-zinc-600">{project.description || "Saved video project"}</p></div><div className="flex flex-wrap gap-2"><span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium capitalize">Render: {project.renderStatus}</span><span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium capitalize">Review: {project.reviewStatus.replaceAll("_", " ")}</span><span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium capitalize">Version {project.revisionCount || 0}</span></div></header><section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-5"><div className="flex items-center justify-between"><h2 className="font-semibold">Output variants</h2><Link href={`/dashboard/videos/${project.workflow}`} className="rounded-lg bg-zinc-950 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800">Open generator</Link></div>{variants.length === 0 ? <div className="mt-5 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center"><Film className="mx-auto size-8 text-zinc-400" /><p className="mt-3 text-sm text-zinc-600">No rendered variants yet. Open the generator to continue this project.</p></div> : <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{variants.map((variant) => <article key={variant.id} className="overflow-hidden rounded-xl border border-zinc-200"><div className="aspect-video bg-zinc-950">{variant.assetUrl ? <video controls src={variant.assetUrl} className="size-full object-contain" /> : <div className="grid size-full place-items-center text-zinc-400"><Film className="size-7" /></div>}</div><div className="flex items-center justify-between p-3"><span className="text-sm font-medium">{variant.aspectRatio}</span>{variant.assetUrl && <a href={variant.assetUrl} target="_blank" rel="noreferrer" download className="inline-flex items-center gap-1 text-sm font-medium text-zinc-700 hover:text-zinc-950"><Download className="size-4" /> Download</a>}</div></article>)}</div>}</section></main>;
}
