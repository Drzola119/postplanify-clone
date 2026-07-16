"use client";

/**
 * Image-gen BYOK section, embedded inside the existing
 * `/dashboard/api-keys` page.
 *
 * Per-provider toggle + masked key field. The full key value is never
 * round-tripped to the client after save — we only display a
 * last-4 hint to confirm "saved".
 */

import { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  Trash2,
  Check,
  Loader2,
  Key,
  Sparkles,
} from "lucide-react";

interface ImageGenKeyRow {
  provider:
    | "gemini-flash-lite-image"
    | "gpt-image-2"
    | "ideogram-4"
    | "gemini-flash-image";
  last4: string;
  createdAt: string;
  lastUsedAt?: string;
}

const PROVIDER_LABELS: Record<ImageGenKeyRow["provider"], { name: string; desc: string; envVar: string }> = {
  "gemini-flash-lite-image": {
    name: "OpenRouter — Gemini Flash Lite Image",
    desc: "Covers our default engine (Gemini 3.1 Flash Lite Image).",
    envVar: "OPENROUTER_API_KEY",
  },
  "gemini-flash-image": {
    name: "OpenRouter — Gemini Flash Image",
    desc: "Secondary fallback (original Nano Banana). Same OpenRouter key.",
    envVar: "OPENROUTER_API_KEY",
  },
  "gpt-image-2": {
    name: "OpenAI — GPT Image 2",
    desc: "Best-in-class typography. Uses your own OpenAI API key.",
    envVar: "OPENAI_API_KEY",
  },
  "ideogram-4": {
    name: "Ideogram — Ideogram 4 (hosted)",
    desc: "Best for layout-heavy designs. Requires a hosted commercial key.",
    envVar: "IDEOGRAM_API_KEY",
  },
};

const ALL_PROVIDERS: ImageGenKeyRow["provider"][] = [
  "gemini-flash-lite-image",
  "gpt-image-2",
  "ideogram-4",
  "gemini-flash-image",
];

export function ImageGenKeysSection() {
  const [keys, setKeys] = useState<ImageGenKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/image-gen/keys", { credentials: "include" });
        if (!res.ok) {
          if (!cancelled) setError(`Failed to load (${res.status})`);
          return;
        }
        const data = (await res.json()) as { keys?: ImageGenKeyRow[] };
        if (!cancelled) setKeys(data.keys ?? []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Network error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="mt-8">
      <header className="flex items-center gap-2 mb-3">
        <Sparkles className="size-4 text-zinc-500" />
        <h2 className="text-base font-semibold">Image generation keys</h2>
      </header>
      <p className="text-sm text-zinc-500 mb-4 max-w-2xl">
        Add your own provider keys for the AI Infographic Generator. When a
        key is saved for a provider, generations through that provider are
        billed to your own account — zero cost to PostPlanify. The
        platform-shared key is used as a fallback only.
      </p>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 mb-3">{error}</div>
      ) : null}

      <div className="rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-100">
        {ALL_PROVIDERS.map((p) => (
          <ProviderRow
            key={p}
            provider={p}
            saved={keys.find((k) => k.provider === p)}
            loading={loading}
            onSaved={(row) => setKeys((prev) => upsertKey(prev, row))}
            onDeleted={() => setKeys((prev) => prev.filter((k) => k.provider !== p))}
          />
        ))}
      </div>
    </section>
  );
}

function upsertKey(prev: ImageGenKeyRow[], row: ImageGenKeyRow): ImageGenKeyRow[] {
  const idx = prev.findIndex((k) => k.provider === row.provider);
  if (idx >= 0) {
    const next = [...prev];
    next[idx] = row;
    return next;
  }
  return [...prev, row];
}

function ProviderRow({
  provider,
  saved,
  loading,
  onSaved,
  onDeleted,
}: {
  provider: ImageGenKeyRow["provider"];
  saved?: ImageGenKeyRow;
  loading: boolean;
  onSaved: (row: ImageGenKeyRow) => void;
  onDeleted: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const meta = PROVIDER_LABELS[provider];
  const hasSaved = Boolean(saved);

  async function save() {
    if (!draft.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/image-gen/keys", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey: draft.trim() }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
        alert(data.error?.message ?? `Failed to save (${res.status})`);
        return;
      }
      const data = (await res.json()) as { provider: ImageGenKeyRow["provider"]; last4: string };
      onSaved({
        provider: data.provider,
        last4: data.last4,
        createdAt: new Date().toISOString(),
      });
      setDraft("");
      setReveal(false);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      const res = await fetch(`/api/image-gen/keys/${encodeURIComponent(provider)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        alert(`Failed to delete (${res.status})`);
        return;
      }
      onDeleted();
    } finally {
      setBusy(false);
      setConfirm(false);
    }
  }

  return (
    <div className="px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Key className="size-3.5 text-zinc-400" />
            <p className="text-sm font-semibold">{meta.name}</p>
            {hasSaved ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[11px] font-medium">
                <Check className="size-3" />
                Using your key
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-zinc-100 text-zinc-600 px-2 py-0.5 text-[11px] font-medium">
                Using platform key
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-zinc-500">{meta.desc}</p>
          <p className="mt-1 text-[11px] text-zinc-400 font-mono">
            Env: {meta.envVar}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <input
            type={reveal ? "text" : "password"}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={hasSaved ? `…${saved?.last4 ?? ""}  (paste to replace)` : "Paste your API key"}
            autoComplete="off"
            className="w-full h-9 px-3 pr-9 rounded-md border border-zinc-200 bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
          />
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 size-7 inline-flex items-center justify-center rounded text-zinc-500 hover:bg-zinc-100"
            aria-label={reveal ? "Hide key" : "Show key"}
          >
            {reveal ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          </button>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={busy || loading || draft.trim().length < 8}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
          {hasSaved ? "Replace" : "Save"}
        </button>
        {hasSaved ? (
          confirm ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={remove}
                disabled={busy}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setConfirm(false)}
                className="inline-flex items-center h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm font-medium hover:bg-zinc-50"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirm(true)}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm font-medium hover:bg-zinc-50 text-red-600"
              aria-label="Remove key"
            >
              <Trash2 className="size-3.5" />
              Remove
            </button>
          )
        ) : null}
      </div>
      {hasSaved ? (
        <p className="mt-2 text-[11px] text-zinc-500">
          Saved {fmtRelative(saved?.createdAt)} · last 4 chars: <span className="font-mono">…{saved?.last4}</span>
          {saved?.lastUsedAt ? ` · last used ${fmtRelative(saved.lastUsedAt)}` : ""}
        </p>
      ) : null}
    </div>
  );
}

function fmtRelative(iso?: string): string {
  if (!iso) return "just now";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}