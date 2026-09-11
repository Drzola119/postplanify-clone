"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type {
  CarouselDocument,
  CarouselFolder,
  BrandKit,
} from "@/lib/carousel-gen/types";
import { studioApi } from "./carousel-studio/client-api";
import { WorkspaceAssets } from "./carousel-studio/workspace-assets";
type Row = {
  performanceSync?: { status: string; message?: string; attemptedAt: number };
  performanceByPlatform?: Record<
    string,
    { engagementRate: number; lastSyncedAt: number }
  >;
  deliveryStatus?: string;
  id: string;
  title: string;
  status: string;
  slideCount: number;
  updatedAt: number;
  aspectRatio?: string;
  folderId?: string;
  brandKitId?: string;
  tags?: string[];
  variantGroupId?: string;
  performance?: {
    engagementRate: number;
    lastSyncedAt: number;
    platform?: string;
  };
};
type Page = {
  items: Row[];
  counts: Record<string, number>;
  total: number;
  nextOffset: number | null;
};
export function CarouselsHub() {
  const [page, setPage] = useState<Page>({
      items: [],
      counts: {},
      total: 0,
      nextOffset: null,
    }),
    [q, setQ] = useState(""),
    [status, setStatus] = useState("all"),
    [sort, setSort] = useState("edited"),
    [folder, setFolder] = useState(""),
    [brand, setBrand] = useState(""),
    [platform, setPlatform] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [offset, setOffset] = useState(0),
    [version, setVersion] = useState(0),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [selected, setSelected] = useState<string[]>([]),
    [folders, setFolders] = useState<CarouselFolder[]>([]),
    [brands, setBrands] = useState<BrandKit[]>([]),
    [manage, setManage] = useState(false);
  useEffect(() => {
    let active = true;
    void Promise.all([
      studioApi<{ folders: CarouselFolder[] }>("/api/carousels/folders"),
      studioApi<{ brandKits: BrandKit[] }>("/api/carousels/brand-kits"),
    ])
      .then(([f, b]) => {
        if (active) {
          setFolders(f.folders);
          setBrands(b.brandKits);
        }
      })
      .catch((e) => setError(e.message));
    return () => {
      active = false;
    };
  }, [version]);
  useEffect(() => {
    setOffset(0);
    setSelected([]);
  }, [q, status, folder, brand, platform, sort, from, to]);
  useEffect(() => {
    const abort = new AbortController();
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          q,
          status,
          folder,
          brand,
          platform,
          sort,
          offset: String(offset),
          from: from ? String(new Date(from).getTime()) : "",
          to: to ? String(new Date(to).getTime() + 86400000 - 1) : "",
        });
        const r = await fetch(`/api/carousels/list?${params}`, {
          signal: abort.signal,
        });
        const data = await r.json();
        if (!r.ok) throw Error(data.error?.message || "Library unavailable");
        setPage(data);
        setError("");
      } catch (e) {
        if (!abort.signal.aborted)
          setError(e instanceof Error ? e.message : "Library unavailable");
      } finally {
        if (!abort.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [q, status, folder, brand, platform, sort, offset, version, from, to]);
  async function mutate(ids: string[], updates: Partial<CarouselDocument>) {
    setBusy(true);
    setError("");
    let done = 0;
    const failed: string[] = [];
    for (const id of ids) {
      try {
        const { carousel } = await studioApi<{ carousel: CarouselDocument }>(
          `/api/carousels/${id}`,
        );
        await studioApi(
          `/api/carousels/${id}`,
          { ...updates, expectedRevisionId: carousel.currentRevisionId },
          "PUT",
        );
        done++;
      } catch (e) {
        failed.push(`${id}: ${e instanceof Error ? e.message : "Failed"}`);
      }
    }
    setNotice(`${done} carousel${done === 1 ? "" : "s"} updated.`);
    setError(failed.join(" "));
    setSelected(failed.map((s) => s.split(":")[0]));
    setVersion((v) => v + 1);
    setBusy(false);
  }
  async function action(id: string, kind: "duplicate" | "variant" | "sync", metricsPlatform?:string) {
    setBusy(true);
    setError("");
    try {
      await studioApi(
        kind === "sync"
          ? "/api/carousels/sync-performance"
          : "/api/carousels/duplicate",
        { carouselId: id, ...(metricsPlatform?{platform:metricsPlatform}:{}), ...(kind === "variant" ? { asVariantB: true } : {}) },
      );
      setVersion((v) => v + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }
  async function bulkExport() {
    setBusy(true);
    setError("");
    const failed: string[] = [];
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      for (const id of selected) {
        try {
          const { carousel } = await studioApi<{ carousel: CarouselDocument }>(
            `/api/carousels/${id}`,
          );
          zip.file(`${id}/post-caption.txt`, carousel.caption || "");
          for (let i = 0; i < carousel.slides.length; i++) {
            const { dataUrl, issues } = await studioApi<{
              dataUrl: string;
              issues: string[];
            }>("/api/carousels/render", { deck: carousel, index: i });
            if (issues.length) throw Error(issues.join(" "));
            zip.file(
              `${id}/${String(i + 1).padStart(2, "0")}.png`,
              dataUrl.split(",")[1],
              { base64: true },
            );
          }
        } catch (e) {
          failed.push(`${id}: ${e instanceof Error ? e.message : "Failed"}`);
        }
      }
      if (failed.length) zip.file("export-errors.txt", failed.join("\n"));
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "carousels.zip";
      a.click();
      URL.revokeObjectURL(url);
      setNotice(`${selected.length - failed.length} decks exported.`);
      setError(failed.join(" "));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setBusy(false);
    }
  }
  const control =
    "border border-zinc-200 rounded-lg px-3 py-2 bg-white text-sm";
  return (
    <main className="max-w-7xl p-4 md:p-8 space-y-6">
      <header className="flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Carousel Studio
          </h1>
          <p className="mt-2 text-zinc-600">
            Create, review, and publish your next carousel.
          </p>
        </div>
        <div className="flex items-center flex-wrap gap-3">
          <Link className={control} href="/dashboard/carousels/templates">
            Templates
          </Link>
          <Link className={control} href="/dashboard/carousels/analytics">
            Analytics
          </Link>
          <button className={control} onClick={() => setManage((v) => !v)}>
            Brands & folders
          </button>
          <Link
            className="px-4 py-2 bg-zinc-900 text-white rounded-lg"
            href="/dashboard/carousels/new"
          >
            Create carousel
          </Link>
        </div>
      </header>
      {manage && (
        <WorkspaceAssets
          brands={brands}
          folders={folders}
          onChanged={() => setVersion((v) => v + 1)}
        />
      )}
      <div className="flex flex-wrap gap-3">
        <input
          aria-label="Search carousels"
          className={`${control} flex-1 min-w-48`}
          placeholder="Search all carousels…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          aria-label="Brand"
          className={control}
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
        >
          <option value="">All brands</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Folder"
          className={control}
          value={folder}
          onChange={(e) => setFolder(e.target.value)}
        >
          <option value="">All folders</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Platform"
          className={control}
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
        >
          <option value="">All platforms</option>
          {["instagram", "linkedin", "facebook", "tiktok"].map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <select
          aria-label="Sort"
          className={control}
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="edited">Recently edited</option>
          <option value="newest">Newest</option>
          <option value="engagement">Highest observed engagement</option>
        </select>
        <label className="text-sm">
          Edited from
          <input
            aria-label="Edited from"
            className={control}
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="text-sm">
          Until
          <input
            aria-label="Edited until"
            className={control}
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <button
          className={control}
          onClick={() => {
            setQ("");
            setFolder("");
            setBrand("");
            setPlatform("");
            setFrom("");
            setTo("");
            setStatus("all");
          }}
        >
          Clear filters
        </button>
      </div>
      <nav className="flex flex-wrap gap-2" aria-label="Carousel status">
        {Object.entries({
          all: "All",
          draft: "Drafts",
          in_review: "In review",
          scheduled: "Scheduled",
          published: "Published",
          archived: "Archived",
        }).map(([id, label]) => (
          <button
            aria-pressed={status === id}
            key={id}
            onClick={() => setStatus(id)}
            className={`${control} ${status === id ? "!bg-zinc-900 text-white" : ""}`}
          >
            {label} <span>{page.counts[id] ?? 0}</span>
          </button>
        ))}
      </nav>
      {error && (
        <p role="alert" className="p-3 bg-red-50 text-red-800">
          {error}{" "}
          <button onClick={() => setVersion((v) => v + 1)}>Retry</button>
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      <div className="flex flex-wrap gap-3 items-center">
        <label>
          <input
            type="checkbox"
            checked={
              page.items.length > 0 &&
              page.items.every((r) => selected.includes(r.id))
            }
            onChange={(e) =>
              setSelected(e.target.checked ? page.items.map((r) => r.id) : [])
            }
          />{" "}
          Select this page
        </label>
        {selected.length > 0 && (
          <>
            <span>{selected.length} selected</span>
            <button
              disabled={busy}
              className={control}
              onClick={() => void mutate(selected, { status: "archived" })}
            >
              Archive
            </button>
            <button
              disabled={busy}
              className={control}
              onClick={() => void mutate(selected, { status: "draft" })}
            >
              Restore to drafts
            </button>
            <select
              aria-label="Move selected to folder"
              className={control}
              value=""
              onChange={(e) =>
                void mutate(selected, {
                  folderId: e.target.value === "none" ? null : e.target.value,
                })
              }
            >
              <option value="" disabled>
                Move to folder
              </option>
              <option value="none">No folder</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <button
              disabled={busy}
              className={control}
              onClick={() => {
                const value = prompt("Tags, separated by commas");
                if (value !== null)
                  void mutate(selected, {
                    tags: value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  });
              }}
            >
              Set tags
            </button>
            <button
              disabled={busy}
              className={control}
              onClick={() => void bulkExport()}
            >
              Export selected
            </button>
          </>
        )}
      </div>
      {loading ? (
        <div role="status" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-80 bg-zinc-100 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : page.items.length === 0 ? (
        <div className="border rounded-xl p-10">
          <h2 className="text-xl font-medium">
            {q || status !== "all"
              ? "No matching carousels"
              : "Your first carousel starts here"}
          </h2>
          <p className="my-3">
            Choose a visual template or start with a blank deck.
          </p>
          <Link href="/dashboard/carousels/new" className="underline">
            Create carousel
          </Link>
        </div>
      ) : (
        <ul className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {page.items.map((row) => (
            <Card
              key={row.id}
              row={row}
              selected={selected.includes(row.id)}
              busy={busy}
              onSelect={() =>
                setSelected((s) =>
                  s.includes(row.id)
                    ? s.filter((id) => id !== row.id)
                    : [...s, row.id],
                )
              }
              onRename={() => {
                const name = prompt("Carousel title", row.title);
                if (name) void mutate([row.id], { title: name });
              }}
              onArchive={() =>
                void mutate([row.id], {
                  status: row.status === "archived" ? "draft" : "archived",
                })
              }
              onAction={(kind,platform) => void action(row.id, kind,platform)}
            />
          ))}
        </ul>
      )}
      <footer className="flex gap-4 items-center">
        <button
          disabled={offset === 0 || loading}
          className={control}
          onClick={() => setOffset(Math.max(0, offset - 24))}
        >
          Previous page
        </button>
        <span>
          {page.total ? offset + 1 : 0}–{Math.min(offset + 24, page.total)} of{" "}
          {page.total}
        </span>
        <button
          disabled={page.nextOffset === null || loading}
          className={control}
          onClick={() => setOffset(page.nextOffset!)}
        >
          Next page
        </button>
      </footer>
    </main>
  );
}
function Card({
  row,
  selected,
  busy,
  onSelect,
  onRename,
  onArchive,
  onAction,
}: {
  row: Row;
  selected: boolean;
  busy: boolean;
  onSelect: () => void;
  onRename: () => void;
  onArchive: () => void;
  onAction: (kind: "duplicate" | "variant" | "sync",platform?:string) => void;
}) {
  const [slide, setSlide] = useState(0);
  const [metricsPlatform,setMetricsPlatform]=useState("");
  return (
    <li className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
      <div className="relative bg-zinc-100">
        <img
          loading="lazy"
          className="w-full aspect-[4/5] object-contain"
          alt={`${row.title}, slide ${slide + 1}`}
          src={`/api/carousels/thumbnail?id=${row.id}&slide=${slide}&v=${row.updatedAt}`}
        />
        <input
          aria-label={`Select ${row.title}`}
          type="checkbox"
          className="absolute top-3 left-3 size-5"
          checked={selected}
          onChange={onSelect}
        />
        <div className="absolute bottom-3 inset-x-3 bg-white/95 rounded-lg p-2 flex justify-between text-sm">
          <button disabled={slide === 0} onClick={() => setSlide((i) => i - 1)}>
            Previous
          </button>
          <span>
            {slide + 1} / {row.slideCount}
          </span>
          <button
            disabled={slide >= row.slideCount - 1}
            onClick={() => setSlide((i) => i + 1)}
          >
            Next
          </button>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <h2 className="font-semibold text-lg truncate">{row.title}</h2>
        <p className="text-sm text-zinc-600">
          {(row.deliveryStatus && row.status !== "archived"
            ? row.deliveryStatus
            : row.status
          ).replaceAll("_", " ")}{" "}
          · Edited {new Date(row.updatedAt).toLocaleDateString()}
        </p>
        {row.performanceSync?.status === "unavailable" && (
          <p className="text-sm text-amber-700">
            {row.performanceSync.message}
          </p>
        )}
        {row.performance && (
          <p className="text-sm">
            {row.performance.engagementRate}% observed engagement ·{" "}
            {row.performance.platform || "Platform unavailable"} · Synced{" "}
            {new Date(row.performance.lastSyncedAt).toLocaleString()}
          </p>
        )}
        {row.performanceByPlatform && (
          <details>
            <summary className="text-sm">Platform metrics</summary>
            {Object.entries(row.performanceByPlatform).map(
              ([platform, value]) => (
                <p className="text-sm" key={platform}>
                  {platform}: {value.engagementRate}% ·{" "}
                  {new Date(value.lastSyncedAt).toLocaleString()}
                </p>
              ),
            )}
          </details>
        )}
        {!!row.tags?.length && (
          <p className="text-sm">{row.tags.join(" · ")}</p>
        )}
        <div className="flex justify-between items-center">
          <Link
            className="bg-zinc-900 text-white rounded-lg px-3 py-2"
            href={`/dashboard/carousels/${row.id}/edit`}
          >
            Open editor
          </Link>
          <details className="relative">
            <summary className="cursor-pointer px-3">More</summary>
            <div className="absolute right-0 bottom-8 bg-white shadow-xl border rounded-lg p-3 z-10 grid gap-3 min-w-44">
              <button disabled={busy} onClick={onRename}>
                Rename
              </button>
              <button disabled={busy} onClick={() => onAction("duplicate")}>
                Duplicate draft
              </button>
              <button disabled={busy} onClick={() => onAction("variant")}>
                Create B variant
              </button>
              <select aria-label="Metrics platform" value={metricsPlatform} onChange={e=>setMetricsPlatform(e.target.value)}><option value="">First delivered platform</option>{["instagram","linkedin","facebook","tiktok","x"].map(p=><option key={p}>{p}</option>)}</select><button disabled={busy} onClick={() => onAction("sync",metricsPlatform)}>
                Refresh performance
              </button>
              {row.variantGroupId && (
                <Link
                  href={`/dashboard/carousels/ab-test/${row.variantGroupId}`}
                >
                  Compare variants
                </Link>
              )}
              <Link href={`/dashboard/carousels/${row.id}/edit?history=1`}>
                Revision history
              </Link>
              <button disabled={busy} onClick={onArchive}>
                {row.status === "archived" ? "Restore to drafts" : "Archive"}
              </button>
            </div>
          </details>
        </div>
      </div>
    </li>
  );
}
