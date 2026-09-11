"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Save,
  Undo2,
  Redo2,
  Maximize,
  Smartphone,
  Download,
  Plus,
  Trash2,
  History,
  RefreshCw,
} from "lucide-react";
import {
  newDocument,
  templates,
  templateLabels,
  formats,
  prepareOutline,
  templateIssues,
  type StudioDocument,
  type Template,
  type Project,
  type Version,
  type Block,
  type Brand,
} from "@/lib/infographic-studio/document";
import {
  api,
  ApiError,
  button,
  primary,
  input,
  Preview,
  Field,
} from "./shared";

type Preset = { id: string; brand: Brand };
type Asset = { id: string; url: string; mime: string };
export function StudioEditor() {
  const params = useSearchParams();
  const router = useRouter();
  const [history, setHistory] = useState<StudioDocument[]>(() => [
    newDocument(
      templates.includes(params.get("template") as Template)
        ? (params.get("template") as Template)
        : "checklist",
      params.get("mode") === "offer" ? "offer" : "idea",
    ),
  ]);
  const [position, setPosition] = useState(0);
  const doc = history[position];
  const [project, setProject] = useState<Project | null>(null),
    [saved, setSaved] = useState("");
  const [step, setStep] = useState(0),
    [selected, setSelected] = useState(doc.blocks[0].id);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [conflict, setConflict] = useState(false);
  const [zoom, setZoom] = useState(1),
    [phone, setPhone] = useState(false),
    [mobileTab, setMobileTab] = useState("canvas");
  const [versions, setVersions] = useState<Version[]>([]),
    [showHistory, setShowHistory] = useState(false),
    [compare, setCompare] = useState<number[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]),
    [defaultId, setDefaultId] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("");
  const [assets, setAssets] = useState<Asset[]>([]),
    [assetCursor, setAssetCursor] = useState<string | null>(null);
  const [proposal, setProposal] = useState<StudioDocument | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const working = useRef(false);
  const edited = useRef(false);
  const [recoveryUrl, setRecoveryUrl] = useState("");
  const dirty = saved !== JSON.stringify(doc);
  const assetMap = Object.fromEntries(assets.map((a) => [a.id, a.url]));
  function change(next: StudioDocument) {
    edited.current = true;
    setHistory((prev) => [
      ...prev.slice(Math.max(0, position - 49), position + 1),
      next,
    ]);
    setPosition(Math.min(position + 1, 50));
    setNotice("");
  }
  function patch(value: Partial<StudioDocument>) {
    change({ ...doc, ...value });
  }
  function editBlock(block: Block) {
    patch({
      blocks: doc.blocks.map((b) => (b.id === block.id ? block : b)),
      brief: { ...doc.brief, confirmed: false },
    });
  }
  function acceptProject(p: Project) {
    setProject(p);
    setHistory([p.document]);
    setPosition(0);
    setSaved(JSON.stringify(p.document));
    setSelected(p.document.blocks[0].id);
    setConflict(false);
  }
  async function task(fn: () => Promise<void>) {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    setError("");
    setRecoveryUrl("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
      if (e instanceof ApiError) {
        if (e.status === 409) setConflict(true);
        if (e.recoveryUrl && /^https:\/\//.test(e.recoveryUrl))
          setRecoveryUrl(e.recoveryUrl);
      }
    } finally {
      setBusy(false);
      working.current = false;
    }
  }
  useEffect(() => {
    let cancelled = false;
    const id = params.get("project");
    if (id)
      void api<{ project: Project }>(
        `/api/infographics/projects/${encodeURIComponent(id)}`,
      )
        .then((r) => {
          if (!cancelled) {
            acceptProject(r.project);
            setStep(2);
          }
        })
        .catch((e) => {
          if (!cancelled) setError(e.message);
        });
    void api<{ presets: Preset[]; defaultId: string; workspaceBrand: Brand }>(
      "/api/infographics/brands",
    )
      .then((r) => {
        if (cancelled) return;
        setPresets(r.presets);
        setDefaultId(r.defaultId);
        if (!id && !edited.current)
          setHistory((prev) => [
            {
              ...prev[0],
              brand:
                r.presets.find((p) => p.id === r.defaultId)?.brand ??
                r.workspaceBrand,
            },
          ]);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
    // Initialize once per mounted editor; saves update the URL without resetting local edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    let cancelled = false;
    const ids = [doc.brand.logoAssetId, doc.artworkAssetId].filter(
      (id): id is string => !!id,
    );
    void Promise.all(
      ids.map((id) =>
        api<{ asset: Asset }>(
          `/api/infographics/assets/${encodeURIComponent(id)}`,
        ),
      ),
    )
      .then((results) => {
        if (!cancelled)
          setAssets((prev) => [
            ...prev.filter((a) => !ids.includes(a.id)),
            ...results.map((r) => r.asset),
          ]);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [doc.brand.logoAssetId, doc.artworkAssetId]);
  useEffect(() => {
    if (!dirty) return;
    const unload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const click = (e: MouseEvent) => {
      const a = (e.target as Element).closest("a[href]");
      if (
        a &&
        a.getAttribute("target") !== "_blank" &&
        !a.hasAttribute("download") &&
        !a.getAttribute("href")?.startsWith("#") &&
        !window.confirm("Leave the studio? Your unsaved changes will be lost.")
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const editorUrl = window.location.href;
    const editorState: unknown = window.history.state;
    const back = (e: PopStateEvent) => {
      if (!window.confirm("Leave the studio? Your unsaved changes will be lost.")) {
        e.stopImmediatePropagation();
        window.history.pushState(editorState, "", editorUrl);
      }
    };
    window.addEventListener("beforeunload", unload);
    window.addEventListener("popstate", back, true);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      window.removeEventListener("popstate", back, true);
      document.removeEventListener("click", click, true);
    };
  }, [dirty]);
  async function save(copy = false) {
    const result = await api<{ project: Project }>(
      project && !copy
        ? `/api/infographics/projects/${project.id}`
        : "/api/infographics/projects",
      {
        document: doc,
        ...(project && !copy ? { revision: project.revision } : {}),
      },
      project && !copy ? "PATCH" : "POST",
    );
    setProject(result.project);
    setSaved(JSON.stringify(doc));
    setConflict(false);
    setNotice("Saved successfully.");
    window.history.replaceState(
      null,
      "",
      `/dashboard/infographics/studio?project=${result.project.id}`,
    );
    return result.project;
  }
  function reorder(id: string, to: number) {
    const list = [...doc.blocks];
    const from = list.findIndex((b) => b.id === id);
    if (from < 0 || to < 0 || to >= list.length) return;
    const [item] = list.splice(from, 1);
    list.splice(to, 0, item);
    patch({ blocks: list });
  }
  function selectTemplate(template: Template) {
    const issues = templateIssues(doc, template);
    if (issues.length) {
      setError(issues.join(" "));
      return;
    }
    patch({ template });
  }
  async function loadAssets(cursor?: string) {
    const result = await api<{ items: Asset[]; nextCursor: string | null }>(
      `/api/infographics/assets${cursor ? `?cursor=${cursor}` : ""}`,
    );
    setAssets((prev) => (cursor ? [...prev, ...result.items] : result.items));
    setAssetCursor(result.nextCursor);
  }
  async function download(
    format: "png" | "svg",
    library = false,
    handoff?: "post" | "schedule",
  ) {
    const p = dirty || !project ? await save() : project;
    const response = await fetch(`/api/infographics/projects/${p.id}/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        revision: p.revision,
        format,
        save: library || !!handoff,
      }),
    });
    if (!response.ok) {
      const r = await response.json();
      throw new ApiError(
        r.error?.message ?? "Export failed",
        response.status,
        r.recoveryUrl,
      );
    }
    if (library || handoff) {
      const r = await response.json();
      setProject({
        ...p,
        exportAssetId: r.assetId,
        exportRevision: p.revision,
      });
      setNotice("Saved to your media library.");
      if (handoff)
        router.push(
          `/dashboard/posts/create?infographicAsset=${r.assetId}${handoff === "schedule" ? "&infographicIntent=schedule" : ""}`,
        );
    } else {
      const url = URL.createObjectURL(await response.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = `infographic-v${p.revision}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }
  async function loadVersions() {
    if (!project) return;
    const r = await api<{ items: Version[] }>(
      `/api/infographics/projects/${project.id}/versions`,
    );
    setVersions(r.items);
    setShowHistory(true);
  }
  async function shorten() {
    const id = crypto.randomUUID();
    setOperation(id);
    const r = await api<{
      document: StudioDocument;
      persistenceWarning?: string;
    }>("/api/infographics/content", {
      action: "shorten",
      operationId: id,
      document: doc,
    });
    setProposal(r.document);
    if (r.persistenceWarning) setNotice(r.persistenceWarning);
    setOperation(null);
  }
  async function managePreset(action: "update" | "delete" | "default") {
    if (!selectedPreset) return;
    if (
      action === "delete" &&
      !window.confirm(
        "Delete this shared preset? Existing projects keep their saved brand snapshot.",
      )
    )
      return;
    const next =
      action === "delete"
        ? presets.filter((p) => p.id !== selectedPreset)
        : action === "update"
          ? presets.map((p) =>
              p.id === selectedPreset ? { ...p, brand: { ...doc.brand } } : p,
            )
          : presets;
    const nextDefault =
      action === "default"
        ? selectedPreset
        : action === "delete" && defaultId === selectedPreset
          ? ""
          : defaultId;
    await api(
      "/api/infographics/brands",
      { presets: next, defaultId: nextDefault },
      "PUT",
    );
    setPresets(next);
    setDefaultId(nextDefault);
    if (action === "delete") setSelectedPreset("");
    setNotice(
      "Shared presets updated. Existing project snapshots are unchanged.",
    );
  }
  const block = doc.blocks.find((b) => b.id === selected) ?? doc.blocks[0];
  return (
    <main className="space-y-5 p-4 lg:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/infographics"
            className={button}
            aria-label="All infographics"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold">Infographic studio</h1>
            <p className="text-xs text-zinc-500">
              Structured editor ·{" "}
              {dirty ? "Unsaved changes" : `Saved · v${project?.revision ?? 1}`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className={button}
            disabled={busy || position === 0}
            onClick={() => setPosition((p) => p - 1)}
            aria-label="Undo"
          >
            <Undo2 size={16} />
          </button>
          <button
            className={button}
            disabled={busy || position >= history.length - 1}
            onClick={() => setPosition((p) => p + 1)}
            aria-label="Redo"
          >
            <Redo2 size={16} />
          </button>
          <button
            className={button}
            disabled={busy || !project}
            onClick={() => void task(loadVersions)}
          >
            <History size={16} />
            History
          </button>
          <button
            className={primary}
            disabled={busy}
            onClick={() =>
              void task(async () => {
                await save();
              })
            }
          >
            <Save size={16} />
            {busy ? "Working…" : "Save"}
          </button>
        </div>
      </header>
      <nav className="flex flex-wrap gap-2" aria-label="Creation steps">
        {[
          "Brief",
          "Review content",
          "Design and edit",
          "Export or create post",
        ].map((s, i) => (
          <button
            key={s}
            className={`${button} ${step === i ? "!border-blue-600 !bg-blue-50 !text-blue-700" : ""}`}
            aria-current={step === i ? "step" : undefined}
            onClick={() => setStep(i)}
          >
            {i + 1}. {s}
          </button>
        ))}
      </nav>
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
          {conflict && (
            <div className="mt-2 flex gap-2">
              <button
                className={button}
                onClick={() =>
                  void task(async () => {
                    await save(true);
                  })
                }
              >
                Save as copy
              </button>
              <button
                className={button}
                onClick={() =>
                  void task(async () => {
                    if (
                      project &&
                      window.confirm(
                        "Discard local edits and load the latest saved version?",
                      )
                    )
                      acceptProject(
                        (
                          await api<{ project: Project }>(
                            `/api/infographics/projects/${project.id}`,
                          )
                        ).project,
                      );
                  })
                }
              >
                Reload latest
              </button>
            </div>
          )}
        </div>
      )}
      {recoveryUrl && (
        <a
          href={recoveryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={button}
        >
          Open recovery image
        </a>
      )}
      {notice && (
        <p
          role="status"
          className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800"
        >
          {notice}
        </p>
      )}
      <fieldset
        disabled={busy}
        className="min-w-0 space-y-4 disabled:opacity-70"
      >
        {step === 0 && (
          <section className="mx-auto max-w-3xl space-y-5 rounded-2xl border border-zinc-200 bg-white p-6">
            <h2 className="text-lg font-semibold">
              What should this visual communicate?
            </h2>
            <Field label="Starting point">
              <select
                className={input}
                value={doc.brief.mode}
                onChange={(e) =>
                  patch({
                    brief: {
                      ...doc.brief,
                      mode: e.target.value as "idea" | "offer",
                    },
                  })
                }
              >
                <option value="idea">An idea or supplied content</option>
                <option value="offer">An offer or source URL</option>
              </select>
            </Field>
            <Field label="Headline / offer title">
              <input
                className={input}
                maxLength={160}
                value={doc.title}
                onChange={(e) => patch({ title: e.target.value })}
              />
            </Field>
            {doc.brief.mode === "offer" && (
              <Field label="Source URL (optional)">
                <div className="flex gap-2">
                  <input
                    className={input}
                    type="url"
                    value={doc.brief.sourceUrl}
                    onChange={(e) =>
                      patch({
                        brief: { ...doc.brief, sourceUrl: e.target.value },
                      })
                    }
                  />
                  <button
                    className={button}
                    disabled={!doc.brief.sourceUrl}
                    onClick={() =>
                      void task(async () => {
                        const r = await api<{
                          text: string;
                          title?: string;
                          truncated: boolean;
                        }>(
                          `/api/infographics/scrape?url=${encodeURIComponent(doc.brief.sourceUrl)}`,
                        );
                        patch({
                          brief: {
                            ...doc.brief,
                            content: r.text,
                            confirmed: false,
                          },
                        });
                        setNotice(
                          `Imported source text${r.truncated ? " (source was truncated)" : ""}. Review its claims and organize it into short sections below.`,
                        );
                      })
                    }
                  >
                    Import
                  </button>
                </div>
              </Field>
            )}
            <Field label="Your facts and supporting details — one section per line">
              <textarea
                className={input}
                rows={8}
                maxLength={20000}
                placeholder="Add the actual details you want to communicate. No facts or offer claims will be invented."
                value={doc.brief.content}
                onChange={(e) =>
                  patch({
                    brief: {
                      ...doc.brief,
                      content: e.target.value,
                      confirmed: false,
                    },
                  })
                }
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Audience">
                <input
                  className={input}
                  maxLength={200}
                  value={doc.brief.audience}
                  onChange={(e) =>
                    patch({ brief: { ...doc.brief, audience: e.target.value } })
                  }
                />
              </Field>
              <Field label="Communication goal">
                <input
                  className={input}
                  maxLength={200}
                  value={doc.brief.goal}
                  onChange={(e) =>
                    patch({ brief: { ...doc.brief, goal: e.target.value } })
                  }
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Output language">
                <select
                  className={input}
                  value={doc.language}
                  onChange={(e) =>
                    patch({
                      language: e.target.value as StudioDocument["language"],
                    })
                  }
                >
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                  <option value="ar">العربية</option>
                </select>
              </Field>
              <Field label="Call to action">
                <input
                  className={input}
                  maxLength={160}
                  value={doc.cta}
                  onChange={(e) => patch({ cta: e.target.value })}
                />
              </Field>
            </div>
            <p className="text-xs text-zinc-500">
              Preparing your supplied content uses no image generation. Output
              language is independent of the interface; supplied wording is
              preserved.
            </p>
            <button
              className={primary}
              onClick={() => {
                try {
                  if (
                    doc.blocks.some((b) => "text" in b && b.text) &&
                    !window.confirm(
                      "Replace the current outline with your supplied content? Undo remains available.",
                    )
                  )
                    return;
                  change(prepareOutline(doc));
                  setStep(1);
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              Prepare outline
            </button>
          </section>
        )}
        {(step === 1 || step === 2) && (
          <>
            <div className="flex gap-2 xl:hidden">
              {["sections", "canvas", "settings"].map((tab) => (
                <button
                  key={tab}
                  className={button}
                  aria-pressed={mobileTab === tab}
                  onClick={() => setMobileTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="grid items-start gap-5 xl:grid-cols-[240px_minmax(0,1fr)_280px]">
              <aside
                className={`space-y-4 rounded-xl border border-zinc-200 bg-white p-4 ${mobileTab !== "sections" ? "hidden xl:block" : ""}`}
              >
                <h2 className="font-semibold">Content sections</h2>
                <Field label="Headline">
                  <input
                    className={input}
                    value={doc.title}
                    maxLength={160}
                    onChange={(e) =>
                      patch({
                        title: e.target.value,
                        brief: { ...doc.brief, confirmed: false },
                      })
                    }
                  />
                </Field>
                <Field label="Introduction">
                  <textarea
                    className={input}
                    value={doc.introduction}
                    maxLength={400}
                    onChange={(e) => patch({ introduction: e.target.value })}
                  />
                </Field>
                <div className="space-y-2">
                  {doc.blocks.map((b, i) => (
                    <div
                      key={b.id}
                      draggable
                      onDragStart={(e) =>
                        e.dataTransfer.setData("text/plain", b.id)
                      }
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        reorder(e.dataTransfer.getData("text/plain"), i);
                      }}
                      className={`rounded-lg border p-2 ${selected === b.id ? "border-blue-500 bg-blue-50" : "border-zinc-200"}`}
                    >
                      <button
                        className="w-full truncate text-start text-sm"
                        onClick={() => {
                          setSelected(b.id);
                          setMobileTab("settings");
                        }}
                      >
                        {i + 1}.{" "}
                        {"title" in b ? b.title || b.type : b.text || b.type}
                      </button>
                      <div className="mt-1 flex gap-3">
                        <button
                          disabled={i === 0}
                          onClick={() => reorder(b.id, i - 1)}
                          aria-label={`Move section ${i + 1} up`}
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          disabled={i === doc.blocks.length - 1}
                          onClick={() => reorder(b.id, i + 1)}
                          aria-label={`Move section ${i + 1} down`}
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          disabled={doc.blocks.length === 1}
                          onClick={() =>
                            patch({
                              blocks: doc.blocks.filter((x) => x.id !== b.id),
                            })
                          }
                          aria-label={`Remove section ${i + 1}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  className={button}
                  disabled={doc.blocks.length >= 8}
                  onClick={() => {
                    const id = crypto.randomUUID();
                    patch({
                      blocks: [
                        ...doc.blocks,
                        {
                          id,
                          type: "step",
                          title: "",
                          text: "",
                          icon: "check",
                        },
                      ],
                    });
                    setSelected(id);
                  }}
                >
                  <Plus size={14} />
                  Add section
                </button>
                <Field label="Call to action">
                  <input
                    className={input}
                    value={doc.cta}
                    maxLength={160}
                    onChange={(e) => patch({ cta: e.target.value })}
                  />
                </Field>
                <label className="flex gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={doc.brief.confirmed}
                    onChange={(e) =>
                      patch({
                        brief: { ...doc.brief, confirmed: e.target.checked },
                      })
                    }
                  />
                  I reviewed the wording and confirmed all facts and offer
                  claims.
                </label>
              </aside>
              <section
                className={`${mobileTab !== "canvas" ? "hidden xl:block" : ""}`}
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex gap-1">
                    <button
                      className={button}
                      onClick={() => {
                        setZoom(1);
                        setPhone(false);
                      }}
                    >
                      Fit
                    </button>
                    <button
                      className={button}
                      onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                      aria-label="Zoom out"
                    >
                      −
                    </button>
                    <span className="p-2 text-xs">
                      {Math.round(zoom * 100)}%
                    </span>
                    <button
                      className={button}
                      onClick={() => setZoom((z) => Math.min(2, z + 0.25))}
                      aria-label="Zoom in"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex gap-1">
                    <button
                      className={button}
                      aria-pressed={phone}
                      onClick={() => setPhone((v) => !v)}
                      aria-label="Phone preview"
                    >
                      <Smartphone size={16} />
                    </button>
                    <button
                      className={button}
                      onClick={() =>
                        void canvas.current
                          ?.requestFullscreen()
                          .catch(() =>
                            setError(
                              "Fullscreen is unavailable in this browser.",
                            ),
                          )
                      }
                      aria-label="Fullscreen"
                    >
                      <Maximize size={16} />
                    </button>
                  </div>
                </div>
                <div
                  ref={canvas}
                  className="max-h-[85vh] overflow-auto rounded-2xl border border-zinc-200 bg-zinc-100 p-5"
                >
                  <div
                    className="mx-auto shadow-lg"
                    style={{
                      width: phone ? 320 : `${zoom * 100}%`,
                      maxWidth: phone ? "100%" : undefined,
                    }}
                  >
                    <Preview
                      document={doc}
                      assets={assetMap}
                      onSelect={(id) => {
                        setSelected(id);
                        setMobileTab("settings");
                      }}
                      selectedId={selected}
                      report
                    />
                  </div>
                </div>
                <p className="mt-2 text-center text-xs text-zinc-500">
                  {doc.width} × {doc.height} · {doc.language.toUpperCase()} ·
                  Editable text
                </p>
              </section>
              <aside
                className={`space-y-5 rounded-xl border border-zinc-200 bg-white p-4 ${mobileTab !== "settings" ? "hidden xl:block" : ""}`}
              >
                <h2 className="font-semibold">Selected section</h2>
                <BlockEditor block={block} onChange={editBlock} />
                <details open={step === 2} className="border-t pt-4">
                  <summary className="cursor-pointer text-sm font-semibold">
                    Design and format
                  </summary>
                  <div className="mt-3 space-y-3">
                    <Field label="Template">
                      <select
                        className={input}
                        value={doc.template}
                        onChange={(e) =>
                          selectTemplate(e.target.value as Template)
                        }
                      >
                        {templates.map((t) => (
                          <option key={t} value={t}>
                            {templateLabels[t]}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Output format">
                      <select
                        className={input}
                        value={`${doc.width}x${doc.height}`}
                        onChange={(e) => {
                          const f = formats.find(
                            (f) => `${f.width}x${f.height}` === e.target.value,
                          )!;
                          patch({ width: f.width, height: f.height });
                        }}
                      >
                        {formats.map((f) => (
                          <option key={f.name} value={`${f.width}x${f.height}`}>
                            {f.name} · {f.width}×{f.height}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Spacing">
                      <select
                        className={input}
                        value={doc.spacing}
                        onChange={(e) =>
                          patch({
                            spacing: e.target
                              .value as StudioDocument["spacing"],
                          })
                        }
                      >
                        <option value="comfortable">Comfortable</option>
                        <option value="compact">Compact</option>
                      </select>
                    </Field>
                  </div>
                </details>
                <details className="border-t pt-4">
                  <summary className="cursor-pointer text-sm font-semibold">
                    Brand and artwork
                  </summary>
                  <div className="mt-3 space-y-3">
                    <Field label="Apply saved preset">
                      <select
                        className={input}
                        value={selectedPreset}
                        onChange={(e) => {
                          setSelectedPreset(e.target.value);
                          const p = presets.find(
                            (p) => p.id === e.target.value,
                          );
                          if (p) patch({ brand: { ...p.brand } });
                        }}
                      >
                        <option value="">Choose / reapply preset</option>
                        {presets.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.brand.name || "Brand"}
                            {p.id === defaultId ? " (default)" : ""}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Preset / brand name">
                      <input
                        className={input}
                        value={doc.brand.name}
                        maxLength={80}
                        onChange={(e) =>
                          patch({
                            brand: { ...doc.brand, name: e.target.value },
                          })
                        }
                      />
                    </Field>
                    {(
                      ["primary", "secondary", "background", "text"] as const
                    ).map((key) => (
                      <Field key={key} label={key}>
                        <input
                          type="color"
                          className="h-9 w-full"
                          value={doc.brand[key]}
                          onChange={(e) =>
                            patch({
                              brand: { ...doc.brand, [key]: e.target.value },
                            })
                          }
                        />
                      </Field>
                    ))}
                    <Field label="Font">
                      <select
                        className={input}
                        value={doc.brand.font}
                        onChange={(e) =>
                          patch({
                            brand: {
                              ...doc.brand,
                              font: e.target.value as Brand["font"],
                            },
                          })
                        }
                      >
                        <option value="sans">Noto Sans</option>
                        <option value="arabic">Noto Sans Arabic</option>
                        <option value="serif">Noto Serif · editorial</option>
                      </select>
                    </Field>
                    {(["website", "footer"] as const).map((key) => (
                      <Field key={key} label={key}>
                        <input
                          className={input}
                          value={doc.brand[key]}
                          maxLength={160}
                          onChange={(e) =>
                            patch({
                              brand: { ...doc.brand, [key]: e.target.value },
                            })
                          }
                        />
                      </Field>
                    ))}
                    <button
                      className={button}
                      onClick={() =>
                        void task(async () => {
                          const id = crypto.randomUUID();
                          const next = [
                            ...presets,
                            { id, brand: { ...doc.brand } },
                          ];
                          await api(
                            "/api/infographics/brands",
                            { presets: next, defaultId: id },
                            "PUT",
                          );
                          setPresets(next);
                          setDefaultId(id);
                          setNotice(
                            "Saved as the default creative preset. Existing projects retain their own snapshot.",
                          );
                        })
                      }
                    >
                      Save as default preset
                    </button>
                    <p className="text-xs text-zinc-500">
                      Workspace owners and admins manage shared presets.
                    </p>
                    {selectedPreset && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          className={button}
                          onClick={() => {
                            const preset = presets.find(
                              (p) => p.id === selectedPreset,
                            );
                            if (preset) patch({ brand: { ...preset.brand } });
                          }}
                        >
                          Reapply saved preset
                        </button>
                        <button
                          className={button}
                          onClick={() =>
                            void task(() => managePreset("update"))
                          }
                        >
                          Update selected preset
                        </button>
                        <button
                          className={button}
                          onClick={() =>
                            void task(() => managePreset("default"))
                          }
                        >
                          Make default
                        </button>
                        <button
                          className={button}
                          onClick={() =>
                            void task(() => managePreset("delete"))
                          }
                        >
                          Delete preset
                        </button>
                      </div>
                    )}
                    <button
                      className={button}
                      onClick={() => void task(() => loadAssets())}
                    >
                      Load / refresh media
                    </button>
                    {assetCursor && (
                      <button
                        className={button}
                        onClick={() => void task(() => loadAssets(assetCursor))}
                      >
                        More media
                      </button>
                    )}
                    <Field label="Logo asset">
                      <select
                        className={input}
                        value={doc.brand.logoAssetId ?? ""}
                        onChange={(e) => {
                          const brand = { ...doc.brand };
                          if (e.target.value)
                            brand.logoAssetId = e.target.value;
                          else delete brand.logoAssetId;
                          patch({ brand });
                        }}
                      >
                        <option value="">No logo</option>
                        {assets.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.id}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Artwork asset">
                      <select
                        className={input}
                        value={doc.artworkAssetId ?? ""}
                        onChange={(e) => {
                          const next = { ...doc };
                          if (e.target.value)
                            next.artworkAssetId = e.target.value;
                          else delete next.artworkAssetId;
                          change(next);
                        }}
                      >
                        <option value="">No artwork</option>
                        {assets.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.id}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </details>
                <details className="border-t pt-4">
                  <summary className="cursor-pointer text-sm font-semibold">
                    Focused revisions
                  </summary>
                  <div className="mt-3 flex flex-col gap-2">
                    <button
                      className={button}
                      onClick={() =>
                        setProposal({
                          ...doc,
                          brand: {
                            ...doc.brand,
                            text: "#172033",
                            background: "#ffffff",
                            primary: "#1746a2",
                          },
                        })
                      }
                    >
                      Increase contrast
                    </button>
                    <button
                      className={button}
                      onClick={() =>
                        setProposal({
                          ...doc,
                          spacing: "compact",
                          template: "checklist",
                        })
                      }
                    >
                      Simplify layout
                    </button>
                    <button
                      className={button}
                      onClick={() => {
                        const candidates = templates.filter(
                          (t) =>
                            t !== doc.template &&
                            !templateIssues(doc, t).length,
                        );
                        if (candidates[0])
                          setProposal({ ...doc, template: candidates[0] });
                        else
                          setError(
                            "No compatible alternative. Review section types first.",
                          );
                      }}
                    >
                      Try another template
                    </button>
                    <p className="text-xs text-zinc-500">
                      AI shortening uses the configured text service. No new
                      credit price is introduced; existing account terms apply.
                    </p>
                    <button
                      className={button}
                      disabled={!!operation}
                      onClick={() => void task(shorten)}
                    >
                      Shorten text with AI
                    </button>
                    {operation && (
                      <button
                        className={button}
                        onClick={() =>
                          void task(async () => {
                            const r = await api<{
                              status: string;
                              result?: { document: StudioDocument };
                              error?: string;
                            }>(`/api/infographics/operations/${operation}`);
                            if (r.result) {
                              setProposal(r.result.document);
                              setOperation(null);
                            } else if (r.status === "failed") {
                              setOperation(null);
                              throw new Error(r.error || "Revision failed.");
                            } else
                              setNotice(
                                "Still pending or interrupted. No new paid request was started.",
                              );
                          })
                        }
                      >
                        <RefreshCw size={14} />
                        Refresh revision status
                      </button>
                    )}
                  </div>
                </details>
              </aside>
            </div>
          </>
        )}
        {step === 3 && (
          <section className="mx-auto grid max-w-5xl gap-6 rounded-2xl border border-zinc-200 bg-white p-6 md:grid-cols-2">
            <Preview document={doc} assets={assetMap} report />
            <div className="space-y-5">
              <h2 className="text-2xl font-semibold">Ready to share?</h2>
              <p className="text-sm text-zinc-500">
                Export the exact saved version. PNG is ready for publishing; SVG
                preserves the structured visual as a vector file.
              </p>
              <label className="flex gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={doc.brief.confirmed}
                  onChange={(e) =>
                    patch({
                      brief: { ...doc.brief, confirmed: e.target.checked },
                    })
                  }
                />
                I reviewed the content and confirmed its claims.
              </label>
              <div className="flex flex-wrap gap-2">
                {(["png", "svg"] as const).map((format) => (
                  <button
                    key={format}
                    disabled={!doc.brief.confirmed}
                    className={button}
                    onClick={() => void task(() => download(format))}
                  >
                    <Download size={16} />
                    Download {format.toUpperCase()}
                  </button>
                ))}
                <button
                  className={button}
                  disabled={!doc.brief.confirmed}
                  onClick={() => void task(() => download("png", true))}
                >
                  Save to media library
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className={primary}
                  disabled={!doc.brief.confirmed}
                  onClick={() => void task(() => download("png", true, "post"))}
                >
                  Create post
                </button>
                <button
                  className={button}
                  disabled={!doc.brief.confirmed}
                  onClick={() =>
                    void task(() => download("png", true, "schedule"))
                  }
                >
                  Schedule
                </button>
              </div>
              <p className="text-xs text-zinc-500">
                You will review accounts, captions, and timing in the existing
                composer before anything is published.
              </p>
            </div>
          </section>
        )}
      </fieldset>
      {proposal && (
        <section className="rounded-xl border border-blue-200 bg-blue-50 p-5">
          <h2 className="font-semibold">
            Proposed revision — review before applying
          </h2>
          <p className="mt-1 text-xs">
            Check wording and facts. The current version remains unchanged until
            you apply.
          </p>
          <div className="mt-3 grid max-h-[60vh] grid-cols-2 gap-4 overflow-auto">
            <Preview document={doc} assets={assetMap} />
            <Preview document={proposal} assets={assetMap} />
          </div>
          <div className="mt-4 flex gap-2">
            <button
              className={primary}
              onClick={() => {
                change({
                  ...proposal,
                  brief: { ...proposal.brief, confirmed: false },
                });
                setProposal(null);
              }}
            >
              Apply
            </button>
            <button className={button} onClick={() => setProposal(null)}>
              Discard
            </button>
          </div>
        </section>
      )}
      {showHistory && (
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Version history</h2>
            <button className={button} onClick={() => setShowHistory(false)}>
              Close
            </button>
          </div>
          <p className="my-3 text-xs text-zinc-500">
            Latest 20 versions retained. Restoring creates a new version;
            exported media is never pruned here.
          </p>
          <div className="flex flex-wrap gap-2">
            {versions.map((v) => (
              <div key={v.revision} className="rounded-lg border p-3">
                <label className="flex gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={compare.includes(v.revision)}
                    onChange={(e) =>
                      setCompare((prev) =>
                        e.target.checked
                          ? [...prev.slice(-1), v.revision]
                          : prev.filter((n) => n !== v.revision),
                      )
                    }
                  />
                  v{v.revision} · {new Date(v.createdAt).toLocaleString()}
                </label>
                <button
                  className={`${button} mt-2`}
                  disabled={busy}
                  onClick={() =>
                    void task(async () => {
                      if (
                        dirty &&
                        !window.confirm(
                          "Restore a saved version and discard local edits?",
                        )
                      )
                        return;
                      const r = await api<{ project: Project }>(
                        `/api/infographics/projects/${project!.id}`,
                        {
                          action: "restore",
                          revision: project!.revision,
                          version: v.revision,
                        },
                      );
                      acceptProject(r.project);
                      await loadVersions();
                    })
                  }
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
          <div className="mt-4 grid max-h-[65vh] grid-cols-2 gap-4 overflow-auto">
            {compare
              .map((n) => versions.find((v) => v.revision === n))
              .filter((v): v is Version => !!v)
              .map((v) => (
                <div key={v.revision}>
                  <p>Version {v.revision}</p>
                  <Preview document={v.document} assets={assetMap} />
                </div>
              ))}
          </div>
        </section>
      )}
    </main>
  );
}

function BlockEditor({
  block: b,
  onChange,
}: {
  block: Block;
  onChange: (b: Block) => void;
}) {
  function convert(type: Block["type"]) {
    if (type === b.type) return;
    const content =
      "text" in b
        ? b.text
        : "items" in b
          ? b.items.join("\n")
          : b.type === "comparison"
            ? `${b.left}\n${b.right}`
            : b.type === "statistic"
              ? `${b.value} ${b.unit}`
              : b.type === "chart"
                ? b.values
                    .map((v) => `${v.label}: ${v.value} ${b.unit}`)
                    .join("\n")
                : "";
    if (
      !window.confirm(
        "Convert this section? Its existing wording will be retained in the title/details for review. Undo is available.",
      )
    )
      return;
    const common = { id: b.id, icon: b.icon };
    const title = "title" in b ? b.title : "";
    if (type === "heading" || type === "paragraph")
      onChange({
        ...common,
        type,
        text: [title, content].filter(Boolean).join("\n"),
      });
    else if (type === "step")
      onChange({ ...common, type, title, text: content });
    else if (type === "list")
      onChange({ ...common, type, title, items: content.split("\n") });
    else if (type === "comparison")
      onChange({ ...common, type, title, left: content, right: "" });
    else if (type === "statistic")
      onChange({
        ...common,
        type,
        title: [title, content].filter(Boolean).join(" — "),
        value: 0,
        unit: "",
        confirmed: false,
      });
    else
      onChange({
        ...common,
        type,
        title: [title, content].filter(Boolean).join(" — "),
        unit: "",
        confirmed: false,
        values: [{ label: "", value: 0 }],
      });
  }
  return (
    <div className="space-y-3">
      <Field label="Section type">
        <select
          className={input}
          value={b.type}
          onChange={(e) => convert(e.target.value as Block["type"])}
        >
          {[
            "heading",
            "paragraph",
            "list",
            "step",
            "comparison",
            "statistic",
            "chart",
          ].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </Field>
      <Field label="Icon">
        <select
          className={input}
          value={b.icon}
          onChange={(e) =>
            onChange({ ...b, icon: e.target.value as Block["icon"] })
          }
        >
          {["check", "circle", "star", "arrow"].map((i) => (
            <option key={i}>{i}</option>
          ))}
        </select>
      </Field>
      {"title" in b && (
        <Field label="Section title">
          <input
            className={input}
            maxLength={600}
            value={b.title}
            onChange={(e) => onChange({ ...b, title: e.target.value })}
          />
        </Field>
      )}
      {"text" in b && (
        <Field label="Text">
          <textarea
            className={input}
            rows={4}
            maxLength={600}
            value={b.text}
            onChange={(e) => onChange({ ...b, text: e.target.value })}
          />
        </Field>
      )}
      {b.type === "list" && (
        <Field label="Items (one per line)">
          <textarea
            className={input}
            rows={5}
            value={b.items.join("\n")}
            onChange={(e) =>
              onChange({ ...b, items: e.target.value.split("\n") })
            }
          />
        </Field>
      )}
      {b.type === "comparison" &&
        (["left", "right"] as const).map((key) => (
          <Field
            key={key}
            label={key === "left" ? "First option" : "Second option"}
          >
            <textarea
              className={input}
              maxLength={600}
              value={b[key]}
              onChange={(e) => onChange({ ...b, [key]: e.target.value })}
            />
          </Field>
        ))}
      {b.type === "statistic" && (
        <Field label="Value">
          <input
            type="number"
            className={input}
            value={b.value}
            onChange={(e) =>
              onChange({
                ...b,
                value: Number(e.target.value),
                confirmed: false,
              })
            }
          />
        </Field>
      )}
      {(b.type === "statistic" || b.type === "chart") && (
        <>
          <Field label="Unit">
            <input
              className={input}
              maxLength={30}
              value={b.unit}
              onChange={(e) =>
                onChange({ ...b, unit: e.target.value, confirmed: false })
              }
            />
          </Field>
          {b.type === "chart" && (
            <div className="space-y-2">
              {b.values.map((v, i) => (
                <div key={i} className="flex flex-wrap gap-1">
                  <input
                    aria-label={`Bar ${i + 1} label`}
                    className={input}
                    value={v.label}
                    maxLength={60}
                    onChange={(e) =>
                      onChange({
                        ...b,
                        confirmed: false,
                        values: b.values.map((x, j) =>
                          i === j ? { ...x, label: e.target.value } : x,
                        ),
                      })
                    }
                  />
                  <input
                    aria-label={`Bar ${i + 1} value`}
                    className={input}
                    type="number"
                    min={0}
                    value={v.value}
                    onChange={(e) =>
                      onChange({
                        ...b,
                        confirmed: false,
                        values: b.values.map((x, j) =>
                          i === j ? { ...x, value: Number(e.target.value) } : x,
                        ),
                      })
                    }
                  />
                  <button
                    className={button}
                    disabled={b.values.length === 1}
                    onClick={() =>
                      onChange({
                        ...b,
                        values: b.values.filter((_, j) => i !== j),
                        confirmed: false,
                      })
                    }
                  >
                    Remove bar
                  </button>
                </div>
              ))}
              <button
                className={button}
                disabled={b.values.length >= 6}
                onClick={() =>
                  onChange({
                    ...b,
                    values: [...b.values, { label: "", value: 0 }],
                    confirmed: false,
                  })
                }
              >
                Add bar
              </button>
            </div>
          )}
          <label className="flex gap-2 text-xs">
            <input
              type="checkbox"
              checked={b.confirmed}
              onChange={(e) => onChange({ ...b, confirmed: e.target.checked })}
            />
            I confirmed these values and units.
          </label>
        </>
      )}
    </div>
  );
}
