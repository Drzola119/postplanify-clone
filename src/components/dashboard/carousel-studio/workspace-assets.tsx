"use client";
import { useState } from "react";
import type { BrandKit, CarouselFolder } from "@/lib/carousel-gen/types";
import { studioApi } from "./client-api";
import { checkContrastRatio } from "@/lib/carousel-gen/contrast";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
const empty = {
  name: "New brand",
  colors: {
    primary: "#0f172a",
    secondary: "#475569",
    accent: "#2563eb",
    background: "#ffffff",
    text: "#0f172a",
  },
  fonts: { display: "Noto Sans", body: "Noto Sans" },
  showSlideNumbers: true,
  showWatermark: true,
};
export function WorkspaceAssets({
  brands,
  folders,
  onChanged,
}: {
  brands: BrandKit[];
  folders: CarouselFolder[];
  onChanged: () => void;
}) {
  const [kit, setKit] = useState<
      Partial<BrandKit> & Pick<BrandKit, "name" | "colors" | "fonts">
    >(empty),
    [folderName, setFolderName] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [pendingBrandDelete, setPendingBrandDelete] = useState(false),
    [pendingFolderDelete, setPendingFolderDelete] = useState<CarouselFolder | null>(null),
    [renameFolderTarget, setRenameFolderTarget] = useState<CarouselFolder | null>(null),
    [renameValue, setRenameValue] = useState("");
  async function save(url: string, body: unknown, method = "POST") {
    setBusy(true);
    setError("");
    try {
      await studioApi(url, body, method);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }
  const input = "border rounded-lg p-2 w-full bg-white";
  return (
    <section className="border rounded-xl p-5 bg-zinc-50 grid md:grid-cols-2 gap-8">
      <div className="space-y-3">
        <h2 className="font-semibold text-xl">Brand kits</h2>
        <select
          aria-label="Edit brand kit"
          className={input}
          value={kit.id || ""}
          onChange={(e) =>
            setKit(brands.find((b) => b.id === e.target.value) || empty)
          }
        >
          <option value="">Create a brand kit</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <label className="block">
          Name
          <input
            className={input}
            value={kit.name}
            onChange={(e) => setKit({ ...kit, name: e.target.value })}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(kit.colors).map(([key, value]) => (
            <label key={key}>
              {key}
              <input
                className={input}
                type="color"
                value={value}
                onChange={(e) =>
                  setKit({
                    ...kit,
                    colors: { ...kit.colors, [key]: e.target.value },
                  })
                }
              />
            </label>
          ))}
        </div>
        <p className="text-sm">
          Text contrast:{" "}
          {checkContrastRatio(
            kit.colors.text,
            kit.colors.background,
          ).ratio.toFixed(2)}
          :1 ·{" "}
          {checkContrastRatio(kit.colors.text, kit.colors.background).passesAA
            ? "Passes 4.5:1"
            : "Choose stronger contrast"}
        </p>
        {(["display", "body"] as const).map((key) => (
          <label className="block" key={key}>
            {key} font
            <select
              className={input}
              value={kit.fonts[key]}
              onChange={(e) =>
                setKit({
                  ...kit,
                  fonts: { ...kit.fonts, [key]: e.target.value },
                })
              }
            >
              {["Noto Sans", "Noto Serif", "Noto Sans Arabic"].map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </label>
        ))}
        {(
          ["logoUrl", "logoDarkUrl", "socialHandle", "websiteUrl"] as const
        ).map((key) => (
          <label className="block" key={key}>
            {key.replace(/([A-Z])/g, " $1")}
            <input
              className={input}
              value={kit[key] || ""}
              onChange={(e) =>
                setKit({ ...kit, [key]: e.target.value || undefined })
              }
            />
          </label>
        ))}
        <label className="block">
          <input
            type="checkbox"
            checked={kit.showWatermark}
            onChange={(e) =>
              setKit({ ...kit, showWatermark: e.target.checked })
            }
          />{" "}
          Show logo
        </label>
        <label className="block">
          <input
            type="checkbox"
            checked={kit.showSlideNumbers}
            onChange={(e) =>
              setKit({ ...kit, showSlideNumbers: e.target.checked })
            }
          />{" "}
          Show slide numbers
        </label>
        <button
          disabled={busy}
          className="bg-zinc-900 text-white rounded px-4 py-2"
          onClick={() => void save("/api/carousels/brand-kits", kit)}
        >
          Save brand kit
        </button>
        {kit.id && (
          <button
            disabled={busy}
            className="ml-3"
            onClick={() => {
              setPendingBrandDelete(true);
            }}
          >
            Remove brand kit
          </button>
        )}
      </div>
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Campaign folders</h2>
        <label className="block">
          Folder name
          <input
            className={input}
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
          />
        </label>
        <button
          disabled={busy || !folderName.trim()}
          className="border rounded p-2"
          onClick={() =>
            void save("/api/carousels/folders", { name: folderName })
          }
        >
          Create folder
        </button>
        {folders.map((f) => (
          <div className="flex gap-3 items-center border-b p-3" key={f.id}>
            <span className="flex-1">{f.name}</span>
            <button
              disabled={busy}
              onClick={() => {
                setRenameFolderTarget(f);
                setRenameValue(f.name);
              }}
            >
              Rename
            </button>
            <button
              disabled={busy}
              onClick={() => {
                setPendingFolderDelete(f);
              }}
            >
              Remove
            </button>
          </div>
        ))}
        <p className="text-sm text-zinc-600">
          Select carousels in the library to move them into a campaign folder.
        </p>
      </div>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      <ConfirmDialog
        open={pendingBrandDelete}
        onClose={() => setPendingBrandDelete(false)}
        onConfirm={() => { setPendingBrandDelete(false); if (kit.id) void save(`/api/carousels/brand-kits?id=${kit.id}`, undefined, "DELETE"); }}
        title="Remove this brand kit?"
        description="Saved decks retain their existing brand snapshot."
        confirmLabel="Remove brand kit"
        tone="destructive"
      />
      <ConfirmDialog
        open={pendingFolderDelete !== null}
        onClose={() => setPendingFolderDelete(null)}
        onConfirm={() => { const folder = pendingFolderDelete; setPendingFolderDelete(null); if (folder) void save(`/api/carousels/folders?id=${folder.id}`, undefined, "DELETE"); }}
        title="Remove this folder?"
        description="Its carousels will remain in your library."
        confirmLabel="Remove folder"
        tone="destructive"
      />
      <Dialog
        open={renameFolderTarget !== null}
        onClose={() => setRenameFolderTarget(null)}
        title="Rename folder"
        maxWidth="sm:max-w-[440px]"
      >
        <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); const folder = renameFolderTarget; const name = renameValue.trim(); if (folder && name) { void save("/api/carousels/folders", { id: folder.id, name }); setRenameFolderTarget(null); } }}>
          <input autoFocus aria-label="Folder name" className={`${input} text-zinc-900`} value={renameValue} onChange={(event) => setRenameValue(event.target.value)} />
          <div className="flex justify-end gap-2"><button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={() => setRenameFolderTarget(null)}>Cancel</button><button type="submit" disabled={!renameValue.trim() || busy} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Save name</button></div>
        </form>
      </Dialog>
    </section>
  );
}
