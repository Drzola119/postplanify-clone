"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Send,
  Plus,
  Pause,
  Play,
  Trash2,
  Loader2,
  Wand2,
  ChevronRight,
  Zap,
  SkipForward,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
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
  | "facebook";

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
};

interface Trigger {
  kind: "comment-keyword" | "first-comment" | "follow";
  keyword?: string;
  match?: "contains" | "exact" | "starts-with";
  postId?: string;
}

interface Campaign {
  id: string;
  name: string;
  status: "active" | "paused";
  trigger: Trigger;
  platforms: Platform[];
  template: string;
  perAuthorPerDayCap?: number;
  triggered: number;
  sent: number;
  skipped: number;
  lastTriggeredAt?: string;
  createdAt: string;
  updatedAt: string;
}

function describeTrigger(t: Trigger): string {
  if (t.kind === "comment-keyword") {
    return `Comment ${t.match ?? "contains"} "${t.keyword ?? ""}"`;
  }
  if (t.kind === "first-comment") {
    return `First comment${t.postId ? ` on ${t.postId.slice(0, 8)}…` : ""}`;
  }
  return `New follower${t.postId ? ` of ${t.postId.slice(0, 8)}…` : ""}`;
}

export default function AutoDmCampaignsPage() {
  const t = useTranslations("dashboard");
  const [items, setItems] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused">("all");

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/automations/dm${params.toString() ? `?${params}` : ""}`, {
        credentials: "include",
        headers: getOverrideHeaders(),
      });
      if (res.ok) {
        const data = (await res.json()) as { campaigns?: Campaign[] };
        setItems(data.campaigns ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [statusFilter]);

  async function setStatus(id: string, next: "active" | "paused") {
    const res = await fetch(`/api/automations/dm/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...getOverrideHeaders() },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) setItems((prev) => prev.map((c) => (c.id === id ? { ...c, status: next } : c)));
    else {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      window.alert(data.error ?? "Update failed");
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this AutoDM campaign? This cannot be undone.")) return;
    const res = await fetch(`/api/automations/dm/${id}`, {
      method: "DELETE",
      credentials: "include",
      headers: getOverrideHeaders(),
    });
    if (res.ok) setItems((prev) => prev.filter((c) => c.id !== id));
    else {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      window.alert(data.error ?? "Delete failed");
    }
  }

  const totals = useMemo(() => {
    const triggered = items.reduce((a, b) => a + b.triggered, 0);
    const sent = items.reduce((a, b) => a + b.sent, 0);
    const skipped = items.reduce((a, b) => a + (b.skipped ?? 0), 0);
    const activeCount = items.filter((c) => c.status === "active").length;
    return { triggered, sent, skipped, activeCount, totalCount: items.length };
  }, [items]);

  return (
    <div className="px-3 lg:px-6 pt-5 lg:pt-8 pb-3 lg:pb-6">
      <PageHeader
        title={t("automations.list.page_title")}
        subtitle={t("automations.list.page_subtitle")}
        cta={
          <Link
            href="/dashboard/automations/dm/new"
            className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 text-white px-3 h-9 text-sm font-medium hover:bg-zinc-800"
          >
            <Plus className="size-4" />
            {t("automations.list.new_campaign")}
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-5">
        <StatCard
          label={t("automations.list.active")}
          value={totals.activeCount}
          icon={<Play className="size-4" />}
          iconClassName="bg-emerald-50 text-emerald-700"
          footer={t("automations.list.total", { total: totals.totalCount })}
        />
        <StatCard
          label={t("automations.list.triggered")}
          value={totals.triggered}
          icon={<Zap className="size-4" />}
          iconClassName="bg-blue-50 text-blue-700"
          footer={t("automations.list.all_time")}
        />
        <StatCard
          label={t("automations.list.sent")}
          value={totals.sent}
          icon={<Send className="size-4" />}
          iconClassName="bg-violet-50 text-violet-700"
          footer={t("automations.list.confirmed_deliveries")}
        />
        <StatCard
          label={t("automations.list.skipped")}
          value={totals.skipped}
          icon={<SkipForward className="size-4" />}
          iconClassName="bg-zinc-100 text-zinc-700"
          footer={t("automations.list.caps_info")}
        />
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 mb-4">
        <div className="inline-flex rounded-full bg-zinc-100 p-1" role="tablist">
          {(["all", "active", "paused"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 h-7 rounded-full text-xs font-medium transition-colors capitalize",
                statusFilter === s ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900",
              )}
            >
              {s === "all" ? t("automations.list.filter_all") : s === "active" ? t("automations.list.filter_active") : t("automations.list.filter_paused")}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white py-12 flex items-center justify-center gap-2 text-sm text-zinc-500">
          <Loader2 className="size-4 animate-spin" /> {t("automations.list.loading")}
        </div>
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="divide-y divide-zinc-100">
            {items.map((c) => (
              <CampaignRow
                key={c.id}
                campaign={c}
                onToggle={() => setStatus(c.id, c.status === "active" ? "paused" : "active")}
                onDelete={() => remove(c.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CampaignRow({
  campaign,
  onToggle,
  onDelete,
}: {
  campaign: Campaign;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations("dashboard");
  const isActive = campaign.status === "active";
  return (
    <div className="px-4 py-4 hover:bg-zinc-50/50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Link
              href={`/dashboard/automations/dm/${campaign.id}`}
              className="text-sm font-semibold text-zinc-900 hover:underline"
            >
              {campaign.name}
            </Link>
            {isActive ? (
              <StatusBadge tone="green" icon={<Play className="size-3" />}>{t("automations.list.active_badge")}</StatusBadge>
            ) : (
              <StatusBadge tone="amber" icon={<Pause className="size-3" />}>{t("automations.list.paused_badge")}</StatusBadge>
            )}
            <span className="inline-flex items-center gap-1.5 flex-wrap">
              {campaign.platforms.map((p) => (
                <span key={p} className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-700">
                  {PLATFORM_LABELS[p]}
                </span>
              ))}
            </span>
          </div>
          <p className="text-xs text-zinc-500 inline-flex items-center gap-1.5">
            <Wand2 className="size-3" />
            {describeTrigger(campaign.trigger)}
            {campaign.perAuthorPerDayCap ? (
              <span className="ml-2">· {t("automations.list.cap_badge", { n: campaign.perAuthorPerDayCap })}</span>
            ) : null}
          </p>
          <p className="mt-2 text-sm text-zinc-700 line-clamp-2 max-w-[720px]">
            “{campaign.template}”
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            {campaign.triggered} triggered · {campaign.sent} sent · {campaign.skipped ?? 0} skipped
            {campaign.lastTriggeredAt ? ` · last ${new Date(campaign.lastTriggeredAt).toLocaleString()}` : ""}
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
            title={isActive ? "Pause campaign" : "Activate campaign"}
          >
            {isActive ? <Pause className="size-3" /> : <Play className="size-3" />}
            {isActive ? t("automations.list.pause") : t("automations.list.activate")}
          </button>
          <Link
            href={`/dashboard/automations/dm/${campaign.id}`}
            className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md border border-zinc-200 bg-white text-xs font-medium hover:bg-zinc-50"
          >
            {t("automations.list.edit")}
            <ChevronRight className="size-3" />
          </Link>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center justify-center size-8 rounded-md border border-red-200 text-red-600 hover:bg-red-50"
            title="Delete"
            aria-label="Delete campaign"
          >
            <Trash2 className="size-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white py-16 flex flex-col items-center justify-center text-center">
      <div className="size-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
        <Send className="size-5 text-zinc-400" />
      </div>
      <h3 className="text-sm font-semibold text-zinc-900">No AutoDM campaigns yet</h3>
      <p className="mt-1 text-sm text-zinc-500 max-w-sm">
        Create a campaign to reply automatically when a comment, follow, or first-comment event matches your trigger.
      </p>
      <Link
        href="/dashboard/automations/dm/new"
        className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-zinc-900 text-white px-4 h-9 text-sm font-medium hover:bg-zinc-800"
      >
        <Plus className="size-4" />
        Create campaign
      </Link>
    </div>
  );
}
