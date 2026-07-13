"use client";

import { useEffect, useState } from "react";
import { Hash, Plus, Copy, TrendingUp, Trash2 } from "lucide-react";
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
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
        if (!cancelled) {
          setSets(setsData.sets ?? []);
          setTrending(trendData.trending ?? []);
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
            onClick={() => alert("New set flow not yet implemented in UI")}
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
    </div>
  );
}
