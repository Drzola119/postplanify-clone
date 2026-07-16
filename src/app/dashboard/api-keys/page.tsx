"use client";

import { useEffect, useState } from "react";
import { Copy, Plus, Eye, EyeOff, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ImageGenKeysSection } from "@/components/dashboard/image-gen-keys-section";

interface ApiKeyRow {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt?: string;
  revokedAt?: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reveal, setReveal] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/api-keys", { credentials: "include" });
        if (!res.ok) {
          setError(`Failed to load keys (${res.status})`);
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setKeys(data.keys ?? []);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Network error");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Revoke this API key? This cannot be undone.")) return;
    const res = await fetch(`/api/api-keys/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } else {
      alert("Failed to revoke key");
    }
  }

  function fmtDate(iso?: string) {
    if (!iso) return "Never";
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  function fmtRelative(iso?: string) {
    if (!iso) return "Never";
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60_000);
    if (m < 1) return "Just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}d ago`;
    return fmtDate(iso);
  }

  return (
    <div className="p-6 max-w-5xl">
      <PageHeader
        title="API Keys"
        subtitle="Connect PostPlanify to your own tools with our REST API."
        cta={
          <button
            type="button"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium"
            onClick={() => alert("Generate Key flow not yet implemented in UI")}
          >
            <Plus className="size-4" />
            Generate Key
          </button>
        }
      />

      <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-start gap-3">
        <span className="text-xl">📘</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-blue-900">Read the API docs</p>
          <p className="text-xs text-blue-800 mt-1">Full reference, code samples, and webhook events at postplanify.com/docs/api.</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">Loading keys…</div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : keys.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center">
          <p className="text-sm text-zinc-600">No API keys yet. Generate your first key to get started.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="grid grid-cols-[2fr_1fr_1fr_120px] gap-2 px-5 py-3 border-b border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
            <div>Name</div>
            <div>Created</div>
            <div>Last used</div>
            <div className="text-right">Actions</div>
          </div>
          {keys.map((k) => (
            <div key={k.id} className="grid grid-cols-[2fr_1fr_1fr_120px] gap-2 px-5 py-4 border-b border-zinc-100 items-center">
              <div>
                <p className="text-sm font-semibold">
                  {k.name}
                  {k.revokedAt && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">Revoked</span>
                  )}
                </p>
                <div className="mt-1 inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1">
                  <code className="text-xs font-mono text-zinc-700">
                    {reveal === k.id ? `${k.prefix}…` : `${k.prefix}…`}
                  </code>
                  <button type="button" onClick={() => setReveal(reveal === k.id ? null : k.id)} className="text-zinc-500 hover:text-zinc-900">
                    {reveal === k.id ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                  </button>
                  <button type="button" className="text-zinc-500 hover:text-zinc-900" aria-label="Copy">
                    <Copy className="size-3" />
                  </button>
                </div>
              </div>
              <div className="text-sm text-zinc-600">{fmtDate(k.createdAt)}</div>
              <div className="text-sm text-zinc-600">{fmtRelative(k.lastUsedAt)}</div>
              <div className="flex items-center justify-end gap-1">
                <button
                  type="button"
                  onClick={() => handleDelete(k.id)}
                  disabled={Boolean(k.revokedAt)}
                  className="size-8 inline-flex items-center justify-center rounded-md hover:bg-zinc-100 text-red-600 disabled:opacity-50"
                  aria-label="Delete"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ImageGenKeysSection />
    </div>
  );
}
