"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Plus,
  Trash2,
  Loader2,
  Send,
  Power,
  Globe,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { getOverrideHeaders } from "@/lib/security/client-overrides";
import { cn } from "@/lib/utils";

type Platform =
  | "bluesky"
  | "instagram"
  | "tiktok"
  | "youtube"
  | "pinterest"
  | "twitter"
  | "linkedin"
  | "threads"
  | "facebook"
  | "custom";

type DestinationType = "webhook" | "zapier" | "custom";

interface Destination {
  id: string;
  platform: Platform;
  type: DestinationType;
  url: string;
  active: boolean;
  createdAt: string;
}

const PLATFORM_LABELS: Record<Platform, string> = {
  bluesky: "Bluesky",
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  pinterest: "Pinterest",
  twitter: "X / Twitter",
  linkedin: "LinkedIn",
  threads: "Threads",
  facebook: "Facebook",
  custom: "Custom",
};

const ALL_PLATFORMS: Platform[] = [
  "bluesky",
  "instagram",
  "tiktok",
  "youtube",
  "pinterest",
  "twitter",
  "linkedin",
  "threads",
  "facebook",
  "custom",
];

export default function DestinationsPage() {
  const t = useTranslations("dashboard");
  const [items, setItems] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/destinations", {
        credentials: "include",
        headers: getOverrideHeaders(),
      });
      if (!res.ok) {
        setError(t("destinations.load_error", { status: res.status }));
        return;
      }
      const data = (await res.json()) as { destinations?: Destination[] };
      setItems(data.destinations ?? []);
    } catch {
      setError(t("destinations.network_error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function setActive(id: string, active: boolean) {
    const res = await fetch(`/api/destinations/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...getOverrideHeaders() },
      body: JSON.stringify({ active }),
    });
    if (res.ok) {
      setItems((prev) => prev.map((d) => (d.id === id ? { ...d, active } : d)));
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      window.alert(data.error ?? "Update failed");
    }
  }

  async function remove(id: string) {
    if (!window.confirm(t("destinations.delete_confirm_title"))) return;
    const res = await fetch(`/api/destinations/${id}`, {
      method: "DELETE",
      credentials: "include",
      headers: getOverrideHeaders(),
    });
    if (res.ok) setItems((prev) => prev.filter((d) => d.id !== id));
    else {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      window.alert(data.error ?? "Delete failed");
    }
  }

  const totals = useMemo(() => {
    const active = items.filter((d) => d.active).length;
    const byType = items.reduce<Record<string, number>>((acc, d) => {
      acc[d.type] = (acc[d.type] ?? 0) + 1;
      return acc;
    }, {});
    return { active, inactive: items.length - active, total: items.length, byType };
  }, [items]);

  return (
    <div className="px-3 lg:px-6 pt-5 lg:pt-8 pb-3 lg:pb-6 max-w-4xl">
      <PageHeader
        title={t("destinations.page_title")}
        subtitle={t("destinations.page_subtitle")}
        cta={
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 text-white px-3 h-9 text-sm font-medium hover:bg-zinc-800"
          >
            <Plus className="size-4" />
            {t("destinations.new_destination")}
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <StatCard
          label={t("destinations.stat_active")}
          value={totals.active}
          icon={<Power className="size-4" />}
          iconClassName="bg-emerald-50 text-emerald-700"
          footer={t("destinations.stat_total", { total: totals.total })}
        />
        <StatCard
          label={t("destinations.stat_webhooks")}
          value={totals.byType.webhook ?? 0}
          icon={<Globe className="size-4" />}
          iconClassName="bg-blue-50 text-blue-700"
          footer={t("destinations.stat_http")}
        />
        <StatCard
          label={t("destinations.stat_zapier")}
          value={(totals.byType.zapier ?? 0) + (totals.byType.custom ?? 0)}
          icon={<Send className="size-4" />}
          iconClassName="bg-violet-50 text-violet-700"
          footer={t("destinations.stat_external")}
        />
      </div>

      {error ? (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="size-4" /> {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white py-12 flex items-center justify-center gap-2 text-sm text-zinc-500">
          <Loader2 className="size-4 animate-spin" /> {t("destinations.loading")}
        </div>
      ) : items.length === 0 ? (
        <EmptyState onCreate={() => setCreating(true)} />
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="divide-y divide-zinc-100">
            {items.map((d) => (
              <DestinationRow
                key={d.id}
                destination={d}
                onToggle={() => setActive(d.id, !d.active)}
                onDelete={() => remove(d.id)}
              />
            ))}
          </div>
        </div>
      )}

      {creating ? (
        <CreateDestinationModal
          onClose={() => setCreating(false)}
          onCreated={(d) => {
            setItems((prev) => [d, ...prev]);
            setCreating(false);
          }}
        />
      ) : null}
    </div>
  );
}

function DestinationRow({
  destination,
  onToggle,
  onDelete,
}: {
  destination: Destination;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations("dashboard");
  const isActive = destination.active;
  return (
    <div className="px-4 py-4 hover:bg-zinc-50/50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-sm font-semibold text-zinc-900 capitalize">
              {PLATFORM_LABELS[destination.platform]}
            </span>
            <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-700 capitalize">
              {destination.type}
            </span>
            {isActive ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                <CheckCircle2 className="size-3" /> {t("destinations.active_badge")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                {t("destinations.paused_badge")}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 truncate max-w-[560px]" title={destination.url}>
            <Globe className="inline size-3 mr-1 align-text-bottom" />
            {destination.url}
          </p>
          <p className="mt-1 text-[11px] text-zinc-400">
            {t("destinations.created_date", { date: new Date(destination.createdAt).toLocaleDateString() })}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onToggle}
            className={cn(
              "inline-flex items-center gap-1 h-8 px-3 rounded-md text-xs font-medium border",
              isActive
                ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
            )}
          >
            <Power className="size-3" />
            {isActive ? t("destinations.pause") : t("destinations.activate")}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center justify-center size-8 rounded-md border border-red-200 text-red-600 hover:bg-red-50"
            title={t("destinations.delete")}
            aria-label={t("destinations.delete")}
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  const t = useTranslations("dashboard");
  return (
    <div className="rounded-xl border border-dashed border-zinc-200 bg-white py-12 px-6 text-center">
      <Send className="mx-auto size-8 text-zinc-300" />
      <p className="mt-3 text-sm font-medium text-zinc-900">{t("destinations.empty_title")}</p>
      <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
        {t("destinations.empty_subtitle")}
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-zinc-900 text-white px-3 h-9 text-sm font-medium hover:bg-zinc-800"
      >
        <Plus className="size-4" />
        {t("destinations.new_destination")}
      </button>
    </div>
  );
}

function CreateDestinationModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (d: Destination) => void;
}) {
  const t = useTranslations("dashboard");
  const [platform, setPlatform] = useState<Platform>("custom");
  const [type, setType] = useState<DestinationType>("webhook");
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { platform, type, url, active: true };
      if (secret) body.secret = secret;
      const res = await fetch("/api/destinations", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...getOverrideHeaders() },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? t("destinations.load_error", { status: res.status }));
        return;
      }
      const data = (await res.json()) as { id: string };
      onCreated({
        id: data.id,
        platform,
        type,
        url,
        active: true,
        createdAt: new Date().toISOString(),
      });
    } catch {
      setError(t("destinations.network_error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 inline-flex items-center justify-center size-7 rounded-md hover:bg-zinc-100"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
        <h2 className="text-base font-semibold text-zinc-900">{t("destinations.create_title")}</h2>
        <p className="mt-1 text-xs text-zinc-500">{t("destinations.create_subtitle")}</p>

        <form onSubmit={submit} className="mt-4 space-y-4">
          <Field label={t("destinations.platform_label")}>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Platform)}
              className="w-full h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            >
              {ALL_PLATFORMS.map((p) => (
                <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
              ))}
            </select>
          </Field>

          <Field label={t("destinations.type_label")}>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as DestinationType)}
              className="w-full h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            >
                  <option value="webhook">{t("destinations.type_webhook")}</option>
                  <option value="zapier">{t("destinations.type_zapier")}</option>
                  <option value="custom">{t("destinations.type_custom")}</option>
            </select>
          </Field>

          <Field label={t("destinations.url_label")}>
            <input
              required
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t("destinations.url_placeholder")}
              className="w-full h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
          </Field>

          <Field label={t("destinations.secret_label")}>
            <input
              type="text"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder={t("destinations.secret_hint")}
              className="w-full h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
          </Field>

          {error ? (
            <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="size-4" /> {error}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-3 h-9 text-sm font-medium hover:bg-zinc-50"
            >
              {t("destinations.cancel")}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white px-3 h-9 text-sm font-medium"
            >
              {submitting ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
              {submitting ? t("destinations.creating") : t("destinations.create")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
