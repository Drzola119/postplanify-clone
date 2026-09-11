"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Plus,
  RefreshCw,
  Sparkles,
  Globe,
  Copy,
} from "lucide-react";
import {
  templates,
  templateLabels,
  sampleDocument,
  type Project,
} from "@/lib/infographic-studio/document";
import { api, button, primary, Preview } from "./shared";
export function StudioHome() {
  const [items, setItems] = useState<Project[]>([]),
    [cursor, setCursor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function refresh(next?: string) {
    setBusy(true);
    setError("");
    try {
      const data = await api<{ items: Project[]; nextCursor: string | null }>(
        `/api/infographics/projects${next ? `?cursor=${encodeURIComponent(next)}` : ""}`,
      );
      setItems((prev) =>
        next
          ? [
              ...prev,
              ...data.items.filter((i) => !prev.some((p) => p.id === i.id)),
            ]
          : data.items,
      );
      setCursor(data.nextCursor);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void refresh();
  }, []);
  async function duplicate(id: string) {
    setBusy(true);
    try {
      const data = await api<{ project: Project }>(
        `/api/infographics/projects/${id}`,
        { action: "duplicate" },
      );
      setItems((prev) => [data.project, ...prev]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto max-w-7xl space-y-9 p-6 lg:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[.18em] text-blue-600">
            Content studio
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Infographics
          </h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-500">
            Turn a useful idea into a visual worth saving. Shape the story, make
            it yours, and share it.
          </p>
        </div>
        <Link className={primary} href="/dashboard/infographics/studio">
          <Plus size={16} />
          Create infographic
        </Link>
      </header>
      <section
        className="grid gap-4 md:grid-cols-2"
        aria-label="Start creating"
      >
        {[
          {
            mode: "idea",
            title: "Start with an idea",
            body: "Bring your knowledge, checklist, or story.",
            Icon: Sparkles,
          },
          {
            mode: "offer",
            title: "Bring an offer or URL",
            body: "Turn confirmed offer details into a clear visual.",
            Icon: Globe,
          },
        ].map(({ mode, title, body, Icon }) => (
          <Link
            key={mode}
            href={`/dashboard/infographics/studio?mode=${mode}`}
            className="group flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-6 hover:border-blue-400"
          >
            <span className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <Icon size={22} />
            </span>
            <div className="flex-1">
              <h2 className="font-semibold">{title}</h2>
              <p className="mt-1 text-sm text-zinc-500">{body}</p>
            </div>
            <ArrowRight size={18} />
          </Link>
        ))}
      </section>
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">A strong starting point</h2>
            <p className="text-xs text-zinc-500">
              Six editable layouts. Samples are illustrative.
            </p>
          </div>
          <div className="flex gap-4 text-xs">
            <Link className="underline" href="/dashboard/infographics/instant">
              AI image mode
            </Link>
            <Link className="underline" href="/dashboard/infographics/ads">
              AI offer images
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {templates.map((template) => (
            <Link
              href={`/dashboard/infographics/studio?template=${template}`}
              key={template}
              className="overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="bg-zinc-50 p-3">
                <Preview document={sampleDocument(template)} />
              </div>
              <div className="p-3">
                <h3 className="text-sm font-semibold">
                  {templateLabels[template]}
                </h3>
                <p className="mt-1 text-xs text-zinc-500">Editable layout</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Recent projects</h2>
            <p className="text-xs text-zinc-500">
              Saved work, ready for your next idea.
            </p>
          </div>
          <button
            className={button}
            onClick={() => void refresh()}
            disabled={busy}
          >
            <RefreshCw size={15} className={busy ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
        {error && (
          <p
            role="alert"
            className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            {error}{" "}
            <button className="underline" onClick={() => void refresh()}>
              Retry
            </button>
          </p>
        )}
        {!items.length && (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-12 text-center">
            <p className="font-medium">
              {busy
                ? "Loading your projects…"
                : error
                  ? "Projects are unavailable"
                  : "Your next great visual starts here"}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              {!busy && !error
                ? "Choose a template above and save your first project."
                : ""}
            </p>
          </div>
        )}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((p) => (
            <article
              key={p.id}
              className="overflow-hidden rounded-xl border border-zinc-200 bg-white"
            >
              <Link
                href={`/dashboard/infographics/studio?project=${p.id}`}
                className="block max-h-64 overflow-hidden bg-zinc-50 p-5"
              >
                <Preview document={p.document} />
              </Link>
              <div className="space-y-2 p-4">
                <h3 className="truncate font-medium">{p.title}</h3>
                <p className="text-xs text-zinc-500">
                  {p.exportRevision === p.revision ? "Exported" : "Draft"} · v
                  {p.revision} · {new Date(p.updatedAt).toLocaleDateString()}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    className={button}
                    href={`/dashboard/infographics/studio?project=${p.id}`}
                  >
                    Open
                  </Link>
                  <button
                    className={button}
                    disabled={busy}
                    aria-label={`Duplicate ${p.title}`}
                    onClick={() => void duplicate(p.id)}
                  >
                    <Copy size={14} />
                  </button>
                  {p.exportAssetId && p.exportRevision === p.revision && (
                    <Link
                      className={button}
                      href={`/dashboard/posts/create?infographicAsset=${p.exportAssetId}`}
                    >
                      Create post
                    </Link>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
        {cursor && (
          <button
            className={`${button} mt-5`}
            disabled={busy}
            onClick={() => void refresh(cursor)}
          >
            Load more
          </button>
        )}
      </section>
    </main>
  );
}
