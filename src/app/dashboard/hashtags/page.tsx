"use client";

import { useEffect, useState, useCallback } from "react";
import { Hash, Plus, Copy, TrendingUp, Trash2, X, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";

interface HashtagSetRow {
  id: string;
  name: string;
  hashtags: string[];
  platform?: string;
  createdAt: string;
}

interface TrendingRow {
  id: string;
  tag: string;
  platform: string;
  score: number;
  capturedAt: string;
}

export default function HashtagsPage() {
  const [sets, setSets] = useState<HashtagSetRow[]>([]);
  const [trending, setTrending] = useState<TrendingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formName, setFormName] = useState("");
  const [formHashtags, setFormHashtags] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [setsRes, trendRes] = await Promise.all([
        fetch("/api/hashtag-sets", { credentials: "include" }),
        fetch("/api/hashtags/trending", { credentials: "include" }),
      ]);
      if (!setsRes.ok) {
        setError(`Failed to load sets (${setsRes.status})`);
        return;
      }
      const setsData = await setsRes.json();
      const trendData = trendRes.ok ? await trendRes.json() : { trending: [] };
      setSets(setsData.sets ?? []);
      setTrending(trendData.trending ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    const tags = formHashtags
      .split(/[,\s]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    if (tags.length === 0) {
      setSaveError("Enter at least one hashtag.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/hashtag-sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: formName, hashtags: tags }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message ?? `Failed to create (${res.status})`);
      }
      setFormName("");
      setFormHashtags("");
      setShowModal(false);
      loadData();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this hashtag set?")) return;
    const res = await fetch(`/api/hashtag-sets/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      setSets((prev) => prev.filter((s) => s.id !== id));
    } else {
      alert("Failed to delete set");
    }
  }

  function copyAll(hashtags: string[]) {
    navigator.clipboard.writeText(hashtags.join(" "));
  }

  return (
    <div className="p-6 max-w-5xl">
      <PageHeader
        title="Hashtags"
        subtitle="Save hashtag sets so you never have to retype them."
        cta={
          <button
            type="button"
            onClick={() => { setFormName(""); setFormHashtags(""); setSaveError(null); setShowModal(true); }}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium"
          >
            <Plus className="size-4" />
            New set
          </button>
        }
      />

      <div className="space-y-4">
        {loading ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">Loading…</div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : sets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center">
            <p className="text-sm text-zinc-600">No hashtag sets yet. Create one to speed up your posts.</p>
          </div>
        ) : (
          sets.map((s) => (
            <div key={s.id} className="rounded-xl border border-zinc-200 bg-white p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Hash className="size-4 text-zinc-500" />
                  <p className="text-sm font-semibold">{s.name}</p>
                  {s.platform && (
                    <span className="text-xs text-zinc-500 capitalize">· {s.platform}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyAll(s.hashtags)}
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Copy className="size-3" />
                    Copy all
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(s.id)}
                    className="size-7 inline-flex items-center justify-center rounded-md hover:bg-zinc-100 text-red-600"
                    aria-label="Delete"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {s.hashtags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}

        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="size-4 text-emerald-600" />
            <p className="text-sm font-semibold">Trending now</p>
          </div>
          {trending.length === 0 ? (
            <p className="text-sm text-zinc-500">No trending data yet. Analytics will populate this as posts are published.</p>
          ) : (
            <div className="divide-y divide-zinc-100">
              {trending.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2.5">
                  <p className="text-sm font-semibold">{t.tag}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500 capitalize">{t.platform}</span>
                    <span className="text-xs font-semibold text-emerald-600">score {t.score}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">New hashtag set</h2>
              <button type="button" onClick={() => setShowModal(false)} className="size-7 inline-flex items-center justify-center rounded-md hover:bg-zinc-100">
                <X className="size-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label htmlFor="set-name" className="block text-sm font-medium text-zinc-700 mb-1">Name</label>
                <input
                  id="set-name"
                  type="text"
                  required
                  maxLength={80}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full h-10 rounded-md border border-zinc-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  placeholder="e.g. Travel posts"
                />
              </div>
              <div>
                <label htmlFor="set-hashtags" className="block text-sm font-medium text-zinc-700 mb-1">Hashtags</label>
                <textarea
                  id="set-hashtags"
                  required
                  rows={4}
                  value={formHashtags}
                  onChange={(e) => setFormHashtags(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
                  placeholder="travel, nature, photography #wanderlust"
                />
                <p className="mt-1 text-xs text-zinc-500">Separate tags with commas or spaces.</p>
              </div>

              {saveError && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{saveError}</div>
              )}

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="inline-flex items-center h-10 px-4 rounded-md border border-zinc-300 text-sm font-medium hover:bg-zinc-50"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium disabled:opacity-50"
                >
                  {saving && <Loader2 className="size-4 animate-spin" />}
                  {saving ? "Saving…" : "Create set"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
