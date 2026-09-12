"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Clock3, Film, Loader2, Plus, Search, TriangleAlert } from "lucide-react";
import type { VideoProjectSummary } from "@/lib/video-gen/project-types";

const workflows = [
  { id: "cartoon", title: "Cartoon Video", description: "Animated shorts from a topic or image.", href: "/dashboard/videos/cartoon", color: "bg-sky-50 text-sky-700" },
  { id: "viral", title: "Viral / Trend Short", description: "Fast-cut, caption-driven videos for short-form platforms.", href: "/dashboard/videos/viral", color: "bg-rose-50 text-rose-700" },
  { id: "real-estate", title: "Real Estate Video", description: "Cinematic walkthroughs from listing photos.", href: "/dashboard/videos/real-estate", color: "bg-emerald-50 text-emerald-700" },
  { id: "whiteboard", title: "Whiteboard Explainer", description: "Hand-drawn explainers with editable scripts.", href: "/dashboard/videos/whiteboard", color: "bg-amber-50 text-amber-700" },
] as const;

const filters = ["all", "draft", "rendering", "in_review", "changes_requested", "approved", "scheduled", "published"];

export function VideoStudioHub({ title = "Video Studio", subtitle = "Create, review, and publish branded videos for every client." }: { title?: string; subtitle?: string }) {
  const [projects, setProjects] = useState<VideoProjectSummary[]>([]);
  const [query, setQuery] = useState("");
  const [workflow, setWorkflow] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ q: query, workflow, status });
      const response = await fetch(`/api/videos/projects?${params.toString()}`, { credentials: "include" });
      const body = await response.json() as { projects?: VideoProjectSummary[]; error?: { message?: string } };
      if (!response.ok) throw new Error(body.error?.message || "Could not load video projects");
      setProjects(body.projects || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load video projects");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [query, workflow, status]);

  const counts = useMemo(() => filters.reduce<Record<string, number>>((result, key) => {
    result[key] = key === "all" ? projects.length : projects.filter((p) => p.reviewStatus === key || p.renderStatus === key || p.publishingStatus === key).length;
    return result;
  }, {}), [projects]);

  return (
    <main className="mx-auto max-w-7xl p-4 md:p-8 space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">Content workspace</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">{title}</h1>
          <p className="mt-2 max-w-2xl text-zinc-600">{subtitle}</p>
        </div>
        <Link href="#create-video" className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800">
          <Plus className="size-4" /> Create video
        </Link>
      </header>

      <section id="create-video" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Create a video">
        {workflows.map((item) => (
          <Link key={item.id} href={item.href} className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md">
            <div className={`grid size-11 place-items-center rounded-xl ${item.color}`}><Film className="size-5" /></div>
            <h2 className="mt-4 font-semibold text-zinc-950">{item.title}</h2>
            <p className="mt-1.5 min-h-10 text-sm text-zinc-600">{item.description}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-900">Start workflow <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" /></span>
          </Link>
        ))}
      </section>

      <section className="space-y-4" aria-labelledby="projects-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 id="projects-heading" className="text-xl font-semibold text-zinc-950">Your video projects</h2><p className="text-sm text-zinc-500">Drafts, renders, reviews and published variants in one place.</p></div>
          <button type="button" onClick={() => void load()} className="text-sm font-medium text-zinc-600 hover:text-zinc-950">Refresh</button>
        </div>
        <div className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="relative sm:col-span-2"><Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-zinc-400" /><input aria-label="Search video projects" className="h-9 w-full rounded-lg border border-zinc-200 pl-9 pr-3 text-sm" placeholder="Search projects…" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <select aria-label="Workflow" className="h-9 rounded-lg border border-zinc-200 px-3 text-sm" value={workflow} onChange={(event) => setWorkflow(event.target.value)}><option value="">All workflows</option>{workflows.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
          <select aria-label="Status" className="h-9 rounded-lg border border-zinc-200 px-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}>{filters.map((item) => <option key={item} value={item}>{item === "all" ? "All statuses" : item.replaceAll("_", " ")}{counts[item] !== undefined ? ` (${counts[item]})` : ""}</option>)}</select>
        </div>
        {error && <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><TriangleAlert className="size-4" />{error}</div>}
        {loading ? <div role="status" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><div className="h-52 animate-pulse rounded-2xl bg-zinc-100" /><div className="h-52 animate-pulse rounded-2xl bg-zinc-100" /></div> : projects.length === 0 ? <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center"><Film className="mx-auto size-8 text-zinc-400" /><h3 className="mt-3 font-semibold text-zinc-900">{query || status !== "all" ? "No matching projects" : "Your first video starts here"}</h3><p className="mt-1 text-sm text-zinc-600">Choose one of the four workflows above to create a saved project.</p></div> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{projects.map((project) => <ProjectCard key={project.id} project={project} />)}</div>}
      </section>
    </main>
  );
}

function ProjectCard({ project }: { project: VideoProjectSummary }) {
  const status = project.reviewStatus !== "none" ? project.reviewStatus : project.renderStatus;
  const statusLabel = status.replaceAll("_", " ");
  return <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"><div className="aspect-video bg-zinc-100">{project.thumbnailUrl ? <img src={project.thumbnailUrl} alt="" className="size-full object-cover" /> : <div className="grid size-full place-items-center text-zinc-400"><Film className="size-8" /></div>}</div><div className="space-y-3 p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-zinc-950">{project.title}</h3><p className="mt-1 text-xs capitalize text-zinc-500">{project.workflow.replaceAll("-", " ")}</p></div><span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-1 text-[11px] font-medium capitalize text-zinc-700">{status === "complete" || status === "approved" ? <CheckCircle2 className="size-3 text-emerald-600" /> : status === "rendering" || status === "queued" ? <Loader2 className="size-3 animate-spin" /> : <Clock3 className="size-3" />}{statusLabel}</span></div><p className="text-xs text-zinc-500">{project.variants.length} output variant{project.variants.length === 1 ? "" : "s"}{project.legacyJobId ? " · Legacy job" : ""}</p><Link href={project.legacyJobId ? `/dashboard/videos/${project.workflow}` : `/dashboard/videos/projects/${project.id}`} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-semibold hover:bg-zinc-50">Open project <ArrowRight className="size-3.5" /></Link></div></article>;
}
