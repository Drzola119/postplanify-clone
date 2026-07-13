"use client";

import { useEffect, useState } from "react";
import { Tag, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";

interface LabelRow {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

const COLORS = [
  "#71717a",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
];

export default function LabelsPage() {
  const [labels, setLabels] = useState<LabelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/labels", { credentials: "include" });
        if (!res.ok) {
          setError(`Failed to load labels (${res.status})`);
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setLabels(data.labels ?? []);
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
    if (!confirm("Delete this label?")) return;
    const res = await fetch(`/api/labels/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) {
      setLabels((prev) => prev.filter((l) => l.id !== id));
    } else {
      alert("Failed to delete label");
    }
  }

  return (
    <div className="p-6 max-w-5xl">
      <PageHeader
        title="Labels"
        subtitle="Organize posts into campaigns and themes."
        cta={
          <button
            type="button"
            onClick={() => alert("New label flow not yet implemented in UI")}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium"
          >
            <Plus className="size-4" />
            New label
          </button>
        }
      />

      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_120px] gap-3 px-5 py-3 border-b border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
          <div>Name</div>
          <div>Created</div>
          <div className="text-right">Actions</div>
        </div>
        {loading ? (
          <div className="px-5 py-8 text-center text-sm text-zinc-500">Loading labels…</div>
        ) : error ? (
          <div className="px-5 py-8 text-center text-sm text-red-600">{error}</div>
        ) : labels.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-zinc-500">No labels yet. Create your first label to organize posts.</div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {labels.map((l) => (
              <div key={l.id} className="grid grid-cols-[1fr_120px_120px] gap-3 px-5 py-3 items-center text-sm">
                <div className="flex items-center gap-2.5">
                  <span className="size-3 rounded-full" style={{ backgroundColor: l.color }} />
                  <Tag className="size-3.5 text-zinc-400" />
                  <p className="font-semibold">{l.name}</p>
                </div>
                <p className="text-zinc-600">{new Date(l.createdAt).toLocaleDateString()}</p>
                <div className="flex items-center justify-end gap-1">
                  {COLORS.slice(0, 5).map((c) => (
                    <button
                      key={c}
                      type="button"
                      className="size-5 rounded-full hover:ring-2 hover:ring-zinc-300"
                      style={{ backgroundColor: c }}
                      aria-label={`Color ${c}`}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => handleDelete(l.id)}
                    className="size-7 inline-flex items-center justify-center rounded-md hover:bg-zinc-100 text-red-600"
                    aria-label="Delete"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
