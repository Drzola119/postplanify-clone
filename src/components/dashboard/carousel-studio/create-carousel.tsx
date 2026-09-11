"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { studioApi } from "./client-api";
import type {
  CarouselDocument,
  CarouselSlideItem,
} from "@/lib/carousel-gen/types";
type Outline = {
  title: string;
  hook: string;
  outlineSteps: {
    type: CarouselSlideItem["type"];
    headline: string;
    keyPoints: string;
  }[];
  suggestedCta: string;
  caption: string;
};
export function CreateCarousel({ workspaceId }: { workspaceId: string }) {
  const sourceKey = `carousel-source:${workspaceId}`;
  const router = useRouter();
  const [source, setSource] = useState(""),
    [kind, setKind] = useState<"text" | "url">("text"),
    [language, setLanguage] = useState("en"),
    [tone, setTone] = useState("Professional"),
    [audience, setAudience] = useState(""),
    [count, setCount] = useState(5),
    [outline, setOutline] = useState<Outline | null>(null),
    [draft, setDraft] = useState<CarouselDocument | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    try {
      setSource(sessionStorage.getItem(sourceKey) || "");
    } catch {}
  }, [sourceKey]);
  async function blank() {
    setBusy(true);
    try {
      const { carouselId } = await studioApi<{ carouselId: string }>(
        "/api/carousels/save",
        { title: "Untitled carousel" },
      );
      router.push(`/dashboard/carousels/${carouselId}/edit`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create draft");
      setBusy(false);
    }
  }
  async function generate() {
    setBusy(true);
    setError("");
    try {
      let doc = draft;
      if (!doc) {
        const result = await studioApi<{ carousel: CarouselDocument }>(
          "/api/carousels/save",
          { title: source.slice(0, 100) || "New carousel" },
        );
        doc = result.carousel;
        setDraft(doc);
      }
      const result = await studioApi<{ outline: Outline }>(
        "/api/carousels/repurpose",
        {
          sourceType: kind,
          text: kind === "text" ? source : undefined,
          url: kind === "url" ? source : undefined,
          language,
          tone,
          audience,
          slideCount: count,
        },
      );
      setOutline(result.outline);
      await saveOutline(result.outline, doc);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setBusy(false);
    }
  }
  async function saveOutline(value: Outline, doc: CarouselDocument) {
    const slides: CarouselSlideItem[] = [
      { id: "hook", index: 0, type: "hook" as const, headline: value.hook },
      ...value.outlineSteps.map((s, i) => ({
        id: `content_${i}`,
        index: i + 1,
        type: s.type,
        headline: s.headline,
        body: s.keyPoints,
      })),
      {
        id: "cta",
        index: value.outlineSteps.length + 1,
        type: "cta" as const,
        headline: value.suggestedCta,
      },
    ].map((s) => ({
      ...s,
      textAlign: language === "ar" ? "right" : "left",
      layoutId: s.type === "hook" ? "bold-headline" : "split",
    }));
    const result = await studioApi<{ carousel: CarouselDocument }>(
      `/api/carousels/${doc.id}`,
      {
        title: value.title,
        slides,
        caption: value.caption,
        description:
          kind === "url"
            ? `Source: ${source}`
            : "Created from supplied source text",
        expectedRevisionId: doc.currentRevisionId,
      },
      "PUT",
    );
    setDraft(result.carousel);
    return result.carousel;
  }
  const input = "w-full rounded-xl border border-zinc-200 bg-white p-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20";
  return (
    <main className="mx-auto max-w-5xl space-y-7 p-4 md:p-8">
      <Link href="/dashboard/carousels" className="text-sm font-medium text-zinc-600 hover:text-zinc-950">
        Back to carousels
      </Link>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">Carousel Studio</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">Create a carousel</h1>
        <p className="mt-2 max-w-2xl text-zinc-600">Choose a starting point, shape the story, then polish every slide in the editor.</p>
      </div>
      <section aria-labelledby="starting-point" className="grid gap-4 md:grid-cols-3">
        <h2 id="starting-point" className="sr-only">Choose a starting point</h2>
        <button
          disabled={busy}
          className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50"
          onClick={() => void blank()}
        >
          <span className="text-sm font-semibold text-amber-900">Start blank</span>
          <span className="mt-1 block text-sm text-amber-800/80">A clean editable deck for your own ideas.</span>
        </button>
        <Link
          className="rounded-2xl border border-zinc-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
          href="/dashboard/carousels/templates"
        >
          <span className="text-sm font-semibold text-zinc-900">Use a visual template</span>
          <span className="mt-1 block text-sm text-zinc-600">Start from a proven story structure.</span>
        </Link>
        <Link
          className="rounded-2xl border border-zinc-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
          href="/dashboard/carousels/new?mode=images"
        >
          <span className="text-sm font-semibold text-zinc-900">Generate illustrated slides</span>
          <span className="mt-1 block text-sm text-zinc-600">Turn a brief into an AI-image carousel.</span>
        </Link>
      </section>
      <section className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
        <div>
          <h2 className="text-xl font-semibold text-zinc-950">Generate an editable outline</h2>
          <p className="mt-1 text-sm text-zinc-600">Use text or a public article as the source for your story.</p>
        </div>
        <div className="flex gap-3">
          <button
            aria-pressed={kind === "text"}
            onClick={() => setKind("text")}
          >
            Topic or text
          </button>
          <button aria-pressed={kind === "url"} onClick={() => setKind("url")}>
            Article URL
          </button>
        </div>
        <label className="block">
          {kind === "url"
            ? "Public article URL"
            : "Topic, brief, or source text"}
          <textarea
            className={input}
            rows={6}
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              try {
                sessionStorage.setItem(sourceKey, e.target.value);
              } catch {}
            }}
          />
        </label>
        <label className="block">
          Import a text document (.txt or .md, up to 200 KB)
          <input
            className={input}
            type="file"
            accept=".txt,.md,text/plain,text/markdown"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              if (f.size > 200000 || !/\.(txt|md)$/i.test(f.name)) {
                setError("Choose a .txt or .md document under 200 KB");
                return;
              }
              const text = await f.text();
              if (text.includes("\u0000")) {
                setError("This file is not plain text");
                return;
              }
              setKind("text");
              setSource(text.slice(0, 30000));
            }}
          />
        </label>
        <div className="grid sm:grid-cols-2 gap-4">
          <label>
            Audience
            <input
              className={input}
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
            />
          </label>
          <label>
            Tone
            <input
              className={input}
              value={tone}
              onChange={(e) => setTone(e.target.value)}
            />
          </label>
          <label>
            Language
            <select
              className={input}
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="en">English</option>
              <option value="fr">French</option>
              <option value="ar">Arabic</option>
            </select>
          </label>
          <label>
            Slide count
            <input
              className={input}
              type="number"
              min="3"
              max="15"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            />
          </label>
        </div>
        <p className="text-sm text-zinc-600">
          Uses the configured AI service. Review facts and wording before
          publishing.
        </p>
        <button
          className="bg-zinc-900 text-white rounded-lg p-3"
          disabled={busy || !source.trim()}
          onClick={() => void generate()}
        >
          {busy ? "Working…" : "Generate outline"}
        </button>
        {draft && (
          <Link
            href={`/dashboard/carousels/${draft.id}/edit`}
            className="ml-4 underline"
          >
            Resume saved draft
          </Link>
        )}
      </section>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      {outline && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Review your outline</h2>
          <label className="block">
            Title
            <input
              className={input}
              value={outline.title}
              onChange={(e) =>
                setOutline({ ...outline, title: e.target.value })
              }
            />
          </label>
          <label className="block">
            Opening hook
            <textarea
              className={input}
              value={outline.hook}
              onChange={(e) => setOutline({ ...outline, hook: e.target.value })}
            />
          </label>
          {outline.outlineSteps.map((s, i) => (
            <div className="border rounded-xl p-4" key={i}>
              <label className="block">
                Slide {i + 2} heading
                <input
                  className={input}
                  value={s.headline}
                  onChange={(e) =>
                    setOutline({
                      ...outline,
                      outlineSteps: outline.outlineSteps.map((step, n) =>
                        n === i ? { ...step, headline: e.target.value } : step,
                      ),
                    })
                  }
                />
              </label>
              <label className="block">
                Supporting text
                <textarea
                  className={input}
                  value={s.keyPoints}
                  onChange={(e) =>
                    setOutline({
                      ...outline,
                      outlineSteps: outline.outlineSteps.map((step, n) =>
                        n === i ? { ...step, keyPoints: e.target.value } : step,
                      ),
                    })
                  }
                />
              </label>
            </div>
          ))}
          <label className="block">
            Closing call to action
            <textarea
              className={input}
              value={outline.suggestedCta}
              onChange={(e) =>
                setOutline({ ...outline, suggestedCta: e.target.value })
              }
            />
          </label>
          <label className="block">
            Caption
            <textarea
              className={input}
              value={outline.caption}
              onChange={(e) =>
                setOutline({ ...outline, caption: e.target.value })
              }
            />
          </label>
          <button
            disabled={busy}
            className="bg-zinc-900 text-white rounded-lg p-3"
            onClick={async () => {
              if (!draft) return;
              setBusy(true);
              try {
                const doc = await saveOutline(outline, draft);
                router.push(`/dashboard/carousels/${doc.id}/edit`);
              } catch (e) {
                setError(e instanceof Error ? e.message : "Save failed");
                setBusy(false);
              }
            }}
          >
            Save outline & open design editor
          </button>
        </section>
      )}
    </main>
  );
}
