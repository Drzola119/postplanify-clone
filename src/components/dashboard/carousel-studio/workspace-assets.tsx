"use client";
import { useState } from "react";
import type { BrandKit, CarouselFolder } from "@/lib/carousel-gen/types";
import { studioApi } from "./client-api";
import { checkContrastRatio } from "@/lib/carousel-gen/contrast";
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
    [busy, setBusy] = useState(false);
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
              if (
                confirm(
                  "Remove this brand kit? Saved decks retain their existing brand snapshot.",
                )
              )
                void save(
                  `/api/carousels/brand-kits?id=${kit.id}`,
                  undefined,
                  "DELETE",
                );
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
                const name = prompt("Folder name", f.name);
                if (name)
                  void save("/api/carousels/folders", { id: f.id, name });
              }}
            >
              Rename
            </button>
            <button
              disabled={busy}
              onClick={() => {
                if (
                  confirm(
                    "Remove folder? Its carousels will remain in your library.",
                  )
                )
                  void save(
                    `/api/carousels/folders?id=${f.id}`,
                    undefined,
                    "DELETE",
                  );
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
    </section>
  );
}
