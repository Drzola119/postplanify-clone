"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Tag, Plus, Trash2, Loader2, Check } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Dialog } from "@/components/ui/dialog";

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

  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#6366f1");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [colorUpdating, setColorUpdating] = useState<string | null>(null);
  const t = useTranslations("dashboard");

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

  async function handleCreate() {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newName, color: newColor }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setSubmitError(body?.error?.message ?? "Failed to create label");
        return;
      }
      setModalOpen(false);
      setNewName("");
      setNewColor("#6366f1");
      const refresh = await fetch("/api/labels", { credentials: "include" });
      if (refresh.ok) {
        const data = await refresh.json();
        setLabels(data.labels ?? []);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleColorUpdate(id: string, color: string) {
    setColorUpdating(id);
    try {
      const res = await fetch(`/api/labels/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ color }),
      });
      if (res.ok) {
        setLabels((prev) => prev.map((l) => (l.id === id ? { ...l, color } : l)));
      }
    } finally {
      setColorUpdating(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t("labels.delete_confirm"))) return;
    const res = await fetch(`/api/labels/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) {
      setLabels((prev) => prev.filter((l) => l.id !== id));
    } else {
      alert(t("labels.delete_failed"));
    }
  }

  return (
    <div className="p-6 max-w-5xl">
      <PageHeader
        title={t("labels.page_title")}
        subtitle={t("labels.page_subtitle")}
        cta={
          <button
            type="button"
            onClick={() => { setNewName(""); setNewColor("#6366f1"); setSubmitError(null); setModalOpen(true); }}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium"
          >
            <Plus className="size-4" />
            {t("labels.new_label")}
          </button>
        }
      />

      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_120px] gap-3 px-5 py-3 border-b border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
          <div>{t("labels.col_name")}</div>
          <div>{t("labels.col_created")}</div>
          <div className="text-right">{t("labels.col_actions")}</div>
        </div>
        {loading ? (
          <div className="px-5 py-8 text-center text-sm text-zinc-500">{t("labels.loading")}</div>
        ) : error ? (
          <div className="px-5 py-8 text-center text-sm text-red-600">{error}</div>
        ) : labels.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-zinc-500">{t("labels.empty")}</div>
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
                      onClick={() => handleColorUpdate(l.id, c)}
                      disabled={colorUpdating === l.id}
                      className="size-5 rounded-full hover:ring-2 hover:ring-zinc-300 disabled:opacity-50 disabled:cursor-wait"
                      style={{ backgroundColor: c }}
                      aria-label={`Set color ${c}`}
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

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} title={t("labels.dialog_title")} description={t("labels.dialog_subtitle")}>
        <form
          onSubmit={(e) => { e.preventDefault(); handleCreate(); }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="label-name" className="text-sm font-medium text-zinc-700">
              {t("labels.name_label")}
            </label>
            <input
              id="label-name"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t("labels.name_placeholder")}
              maxLength={60}
              required
              autoFocus
              className="h-10 px-3 rounded-md border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">{t("labels.color_label")}</span>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColor(c)}
                  className={`size-8 rounded-full transition-all ${
                    newColor === c ? "ring-2 ring-zinc-900 ring-offset-2 scale-110" : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>

          {submitError && (
            <p className="text-sm text-red-600">{submitError}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              disabled={submitting}
              className="h-10 px-4 rounded-md border border-zinc-300 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50"
            >
              {t("labels.cancel")}
            </button>
            <button
              type="submit"
              disabled={submitting || !newName.trim()}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              {submitting ? t("labels.creating") : t("labels.create")}
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
