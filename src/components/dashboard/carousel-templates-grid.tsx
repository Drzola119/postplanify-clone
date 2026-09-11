"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { CarouselTemplate } from "@/data/carousel-templates";
import { CAROUSEL_TEMPLATES } from "@/data/carousel-templates";
import { templateDocument } from "@/lib/carousel-gen/templates";
import { studioApi } from "./carousel-studio/client-api";
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
    [custom, setCustom] = useState<{ id: string; name: string }[]>([]);
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
      <div className="flex gap-3">
        <input
          aria-label="Search templates"
          className="border rounded-lg p-3 flex-1"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search templates"
        />
        <select
          aria-label="Template category"
          className="border rounded-lg p-3"
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
          <h2 className="font-semibold">Workspace templates</h2>
          <div className="flex flex-wrap gap-3">
            {custom.map((t) => (
              <div key={t.id} className="border rounded p-3">
                <button
                  disabled={busy}
                  onClick={() => void applyTemplate(t.id, true)}
                >
                  Use {t.name}
                </button>
                <button
                  className="ml-3 text-sm"
                  onClick={async () => {
                    if (
                      !confirm(
                        "Delete this saved template? Existing decks will remain.",
                      )
                    )
                      return;
                    await studioApi("/api/carousels/templates", {
                      action: "delete",
                      templateId: t.id,
                    });
                    setCustom((c) => c.filter((x) => x.id !== t.id));
                  }}
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
          <article key={t.id} className="border rounded-xl overflow-hidden">
            <button
              className="block w-full bg-zinc-100"
              onClick={() => {
                setSelected(t.id);
                setSlide(0);
              }}
            >
              <img
                loading="lazy"
                className="aspect-[4/5] object-contain w-full"
                src={`/api/carousels/thumbnail?template=${t.id}`}
                alt={`${t.name} cover preview`}
              />
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
                className="border rounded px-3 py-2"
                onClick={() => void applyTemplate(t.id)}
              >
                Use template
              </button>
            </div>
          </article>
        ))}
      </div>
      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Template preview"
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-5"
          onKeyDown={(e) => {
            if (e.key === "Escape") setSelected(null);
          }}
        >
          <div className="bg-white rounded-xl p-4 max-w-lg w-full max-h-[95vh] overflow-auto">
            <button
              autoFocus
              className="float-right p-2"
              onClick={() => setSelected(null)}
            >
              Close
            </button>
            <img
              alt={`Template slide ${slide + 1}`}
              className="w-full"
              src={`/api/carousels/thumbnail?template=${selected}&slide=${slide}`}
            />
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
          </div>
        </div>
      )}
    </div>
  );
}
