"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Save, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/dashboard/page-header";
import { getOverrideHeaders } from "@/lib/security/client-overrides";

type Platform = "instagram" | "twitter" | "linkedin" | "facebook" | "tiktok" | "youtube" | "threads" | "pinterest" | "bluesky";

const PLATFORM_OPTIONS: { id: Platform; label: string }[] = [
  { id: "instagram", label: "Instagram" },
  { id: "twitter", label: "X / Twitter" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "facebook", label: "Facebook" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube" },
  { id: "threads", label: "Threads" },
  { id: "pinterest", label: "Pinterest" },
  { id: "bluesky", label: "Bluesky" },
];

const TRIGGER_OPTIONS: { value: "comment-keyword" | "first-comment" | "follow"; key: string }[] = [
  { value: "comment-keyword", key: "trigger_keyword" },
  { value: "first-comment", key: "trigger_first_comment" },
  { value: "follow", key: "trigger_new_follower" },
];

interface CampaignDetail {
  id: string;
  name: string;
  status: "active" | "paused";
  trigger: { kind: "comment-keyword" | "first-comment" | "follow"; keyword?: string; match?: "contains" | "exact" | "starts-with"; postId?: string };
  platforms: Platform[];
  template: string;
  perAuthorPerDayCap?: number;
  triggered: number;
  sent: number;
  lastTriggeredAt?: string;
}

export default function EditAutoDmCampaignPage() {
  const t = useTranslations("dashboard");
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [status, setStatus] = useState<"active" | "paused">("paused");
  const [triggerKind, setTriggerKind] = useState<"comment-keyword" | "first-comment" | "follow">("comment-keyword");
  const [keyword, setKeyword] = useState("");
  const [match, setMatch] = useState<"contains" | "exact" | "starts-with">("contains");
  const [postId, setPostId] = useState("");
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [template, setTemplate] = useState("");
  const [cap, setCap] = useState<number | "">("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/automations/dm/${id}`, {
          credentials: "include",
          headers: getOverrideHeaders(),
        });
        if (!res.ok) {
          if (!cancelled) setErrorMsg(`Failed to load (${res.status})`);
          return;
        }
        const data = (await res.json()) as { campaign: CampaignDetail };
        if (cancelled) return;
        setCampaign(data.campaign);
        setStatus(data.campaign.status);
        setTemplate(data.campaign.template);
        setPlatforms(data.campaign.platforms ?? []);
        setTriggerKind(data.campaign.trigger.kind);
        if (data.campaign.trigger.kind === "comment-keyword") {
          setKeyword(data.campaign.trigger.keyword ?? "");
          setMatch(data.campaign.trigger.match ?? "contains");
        } else {
          setPostId(data.campaign.trigger.postId ?? "");
        }
        setCap(data.campaign.perAuthorPerDayCap ?? "");
      } catch (err) {
        if (!cancelled) setErrorMsg("Network error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  function togglePlatform(p: Platform) {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  async function save() {
    if (saving || !campaign) return;
    if (platforms.length === 0) {
      setErrorMsg(t("automations.edit.pick_platform"));
      return;
    }
    if (!template.trim()) {
      setErrorMsg(t("automations.edit.template_required"));
      return;
    }
    const trigger =
      triggerKind === "comment-keyword"
        ? { kind: "comment-keyword" as const, keyword: keyword.trim(), match }
        : triggerKind === "first-comment"
        ? { kind: "first-comment" as const, postId: postId.trim() || undefined }
        : { kind: "follow" as const, postId: postId.trim() || undefined };
    if (triggerKind === "comment-keyword" && !trigger.keyword) {
      setErrorMsg(t("automations.edit.keyword_required"));
      return;
    }
    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/automations/dm/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...getOverrideHeaders() },
        body: JSON.stringify({
          status,
          trigger,
          platforms,
          template: template.trim(),
          perAuthorPerDayCap: typeof cap === "number" && cap > 0 ? cap : undefined,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setErrorMsg(data.error ?? `Failed (${res.status})`);
        return;
      }
      router.push("/dashboard/automations/dm");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm(t("automations.edit.confirm_delete"))) return;
    const res = await fetch(`/api/automations/dm/${id}`, {
      method: "DELETE",
      credentials: "include",
      headers: getOverrideHeaders(),
    });
    if (res.ok) router.push("/dashboard/automations/dm");
  }

  if (errorMsg && !campaign) {
    return (
      <div className="px-3 lg:px-6 pt-5 lg:pt-8">
        <div className="max-w-2xl mx-auto rounded-xl border border-zinc-200 bg-white p-12 text-center">
          <p className="text-sm text-zinc-700">{errorMsg}</p>
          <button
            type="button"
            onClick={() => router.push("/dashboard/automations/dm")}
            className="mt-4 inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white px-3 h-9 text-sm font-medium hover:bg-zinc-50"
          >
            {t("automations.edit.back")}
          </button>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="px-3 lg:px-6 pt-5 lg:pt-8 flex items-center justify-center py-16 text-sm text-zinc-500">
        <Loader2 className="size-4 animate-spin mr-2" /> {t("automations.edit.loading")}
      </div>
    );
  }

  return (
    <div className="px-3 lg:px-6 pt-5 lg:pt-8 pb-3 lg:pb-6 max-w-3xl">
      <PageHeader
        title={campaign.name}
        subtitle={`${campaign.triggered} triggered · ${campaign.sent} sent${campaign.lastTriggeredAt ? ` · last ${new Date(campaign.lastTriggeredAt).toLocaleString()}` : ""}`}
      />
      <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-5">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">{t("automations.edit.status")}</label>
          <div className="inline-flex rounded-full bg-zinc-100 p-1">
            {(["paused", "active"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`px-3 h-7 rounded-full text-xs font-medium capitalize ${
                  status === s ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">{t("automations.edit.trigger")}</label>
          <div className="space-y-2">
            {TRIGGER_OPTIONS.map((o) => (
              <label
                key={o.value}
                className={`flex items-start gap-3 rounded-md border p-3 cursor-pointer ${
                  triggerKind === o.value ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 bg-white"
                }`}
              >
                <input
                  type="radio"
                  checked={triggerKind === o.value}
                  onChange={() => setTriggerKind(o.value)}
                  className="mt-1 size-4 accent-zinc-900"
                />
                <div>
                  <p className="text-sm font-medium text-zinc-900">{t(`automations.edit.${o.key}`)}</p>
                  <p className="text-xs text-zinc-500">{t(`automations.edit.${o.key}_desc`)}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {triggerKind === "comment-keyword" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">{t("automations.edit.keyword")}</label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder={t("automations.edit.keyword_placeholder")}
                className="w-full h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">{t("automations.edit.match_type")}</label>
              <select
                value={match}
                onChange={(e) => setMatch(e.target.value as "contains" | "exact" | "starts-with")}
                className="w-full h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              >
                <option value="contains">{t("automations.edit.match_contains")}</option>
                <option value="starts-with">{t("automations.edit.match_starts")}</option>
                <option value="exact">{t("automations.edit.match_exact")}</option>
              </select>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">{t("automations.edit.restrict_post")}</label>
            <input
              type="text"
              value={postId}
              onChange={(e) => setPostId(e.target.value)}
              placeholder={t("automations.edit.restrict_post_placeholder")}
              className="w-full h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">{t("automations.edit.platforms")}</label>
          <div className="flex flex-wrap gap-2">
            {PLATFORM_OPTIONS.map((p) => {
              const active = platforms.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePlatform(p.id)}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 h-8 text-xs font-medium transition-colors ${
                    active ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">{t("automations.edit.daily_cap")}</label>
          <input
            type="number"
            value={cap}
            min={1}
            max={10}
            onChange={(e) => setCap(e.target.value ? Number(e.target.value) : "")}
            placeholder="1"
            className="w-32 h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
          />
          <p className="mt-1 text-xs text-zinc-500">{t("automations.edit.daily_cap_desc")}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">{t("automations.edit.template")}</label>
          <textarea
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            rows={6}
            className="w-full rounded-md border border-zinc-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 resize-none"
          />
          <p className="mt-1 text-xs text-zinc-500">{t("automations.edit.template_desc")}</p>
        </div>

        {errorMsg ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</div>
        ) : null}

        <div className="flex items-center justify-between gap-2 pt-2">
          <button
            type="button"
            onClick={remove}
            className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white text-red-600 hover:bg-red-50 px-3 h-9 text-sm font-medium"
          >
            <Trash2 className="size-3.5" /> {t("automations.edit.delete")}
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/dashboard/automations/dm")}
              className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-3 h-9 text-sm font-medium hover:bg-zinc-50"
            >
              {t("automations.edit.cancel")}
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white px-3 h-9 text-sm font-medium"
            >
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              {t("automations.edit.save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
