"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { CarouselTemplate } from "@/data/carousel-templates";
import { CAROUSEL_TEMPLATES } from "@/data/carousel-templates";
import { templateDocument } from "@/lib/carousel-gen/templates";
import { studioApi } from "./carousel-studio/client-api";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
export { CAROUSEL_TEMPLATES };
export function CarouselTemplatesGrid({
  templates,
}: {
  templates: ReadonlyArray<CarouselTemplate>;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("all"),
    [selected, setSelected] = useState<string | null>(null),
    [slide, setSlide] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [custom, setCustom] = useState<{ id: string; name: string }[]>([]),
    [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null),
    [failedPreviews, setFailedPreviews] = useState<Set<string>>(() => new Set());
  useEffect(() => {
    void studioApi<{ templates: { id: string; name: string }[] }>(
      "/api/carousels/templates",
    )
      .then((d) => setCustom(d.templates))
      .catch((e) => setError(e.message));
  }, []);
  async function applyTemplate(id: string, workspaceTemplate = false) {
    setBusy(true);
    setError("");
    try {
      const d = await studioApi<{ carouselId: string }>(
        "/api/carousels/templates",
        { action: "use", templateId: id, workspaceTemplate },
      );
      router.push(`/dashboard/carousels/${d.carouselId}/edit`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not apply template");
    } finally {
      setBusy(false);
    }
  }
  const visible = templates.filter(
    (t) =>
      (category === "all" || t.category === category || t.niche === category) &&
      `${t.name} ${t.description}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm sm:flex-row">
        <input
          aria-label="Search templates"
          className="flex-1 rounded-xl border border-zinc-200 p-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search templates"
        />
        <select
          aria-label="Template category"
          className="rounded-xl border border-zinc-200 p-3 text-sm"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="all">All categories</option>
          {Array.from(new Set(templates.map((t) => t.category || t.niche))).map(
            (c) => (
              <option key={c}>{c}</option>
            ),
          )}
        </select>
      </div>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      {custom.length > 0 && (
        <section>
          <h2 className="font-semibold text-zinc-950">Workspace templates</h2>
          <div className="flex flex-wrap gap-3">
            {custom.map((t) => (
              <div key={t.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
                <button
                  disabled={busy}
                  onClick={() => void applyTemplate(t.id, true)}
                >
                  Use {t.name}
                </button>
                <button
                  className="text-sm text-red-700 hover:underline"
                  onClick={() => setPendingDelete(t)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {visible.map((t) => (
          <article key={t.id} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <button
              className="block w-full bg-zinc-100"
              onClick={() => {
                setSelected(t.id);
                setSlide(0);
              }}
            >
              {failedPreviews.has(t.id) ? (
                <div className="flex aspect-[4/5] items-center justify-center p-6 text-center text-sm text-zinc-500">Preview unavailable</div>
              ) : (
                <img
                  loading="lazy"
                  className="aspect-[4/5] w-full object-contain"
                  src={`/api/carousels/thumbnail?template=${t.id}`}
                  alt={`${t.name} cover preview`}
                  onError={() => setFailedPreviews((current) => new Set(current).add(t.id))}
                />
              )}
            </button>
            <div className="p-4 space-y-3">
              <h2 className="text-lg font-semibold">{t.name}</h2>
              <p className="text-sm text-zinc-600">{t.description}</p>
              <p className="text-sm">
                {templateDocument(t.id).slides.length} editable slides ·
                Portrait
              </p>
              <button
                disabled={busy}
                className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50"
                onClick={() => void applyTemplate(t.id)}
              >
                Use template
              </button>
            </div>
          </article>
        ))}
      </div>
      {selected && (
        <Dialog
          open
          onClose={() => setSelected(null)}
          title={templates.find((template) => template.id === selected)?.name || "Template preview"}
          maxWidth="sm:max-w-lg"
        >
            {failedPreviews.has(`${selected}:${slide}`) ? (
              <div className="flex aspect-[4/5] items-center justify-center text-sm text-zinc-500">Preview unavailable</div>
            ) : (
              <img
                alt={`Template slide ${slide + 1}`}
                className="w-full"
                src={`/api/carousels/thumbnail?template=${selected}&slide=${slide}`}
                onError={() => setFailedPreviews((current) => new Set(current).add(`${selected}:${slide}`))}
              />
            )}
            <div className="flex justify-between p-3">
              <button
                disabled={slide === 0}
                onClick={() => setSlide((i) => i - 1)}
              >
                Previous
              </button>
              <span>
                {slide + 1} / {templateDocument(selected).slides.length}
              </span>
              <button
                disabled={
                  slide === templateDocument(selected).slides.length - 1
                }
                onClick={() => setSlide((i) => i + 1)}
              >
                Next
              </button>
            </div>
            <button
              disabled={busy}
              onClick={() => void applyTemplate(selected)}
              className="bg-zinc-900 text-white rounded p-3"
            >
              Create editable draft
            </button>
        </Dialog>
      )}
      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={async () => {
          const target = pendingDelete;
          setPendingDelete(null);
          if (!target) return;
          try {
            await studioApi("/api/carousels/templates", { action: "delete", templateId: target.id });
            setCustom((c) => c.filter((x) => x.id !== target.id));
          } catch (e) {
            setError(e instanceof Error ? e.message : "Could not remove template");
          }
        }}
        title="Remove saved template?"
        description="Existing carousel decks will remain unchanged."
        confirmLabel="Remove template"
        tone="destructive"
      />
    </div>
  );
}
