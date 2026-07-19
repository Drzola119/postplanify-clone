"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Save } from "lucide-react";
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

const TRIGGER_OPTIONS = (t: (k: string) => string): { value: "comment-keyword" | "first-comment" | "follow"; label: string; description: string }[] => [
  { value: "comment-keyword", label: t("automations.new.trigger_keyword"), description: t("automations.new.trigger_keyword_desc") },
  { value: "first-comment", label: t("automations.new.trigger_first_comment"), description: t("automations.new.trigger_first_comment_desc") },
  { value: "follow", label: t("automations.new.trigger_new_follower"), description: t("automations.new.trigger_new_follower_desc") },
];

export default function NewAutoDmCampaignPage() {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const [name, setName] = useState("");
  const [triggerKind, setTriggerKind] = useState<"comment-keyword" | "first-comment" | "follow">("comment-keyword");
  const [keyword, setKeyword] = useState("");
  const [match, setMatch] = useState<"contains" | "exact" | "starts-with">("contains");
  const [postId, setPostId] = useState("");
  const [platforms, setPlatforms] = useState<Platform[]>(["instagram"]);
  const [template, setTemplate] = useState("");
  const [cap, setCap] = useState<number | "">("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const ERRORS = {
    name: t("automations.new.error_name"),
    platform: t("automations.new.error_platform"),
    template: t("automations.new.error_template"),
    keyword: t("automations.new.error_keyword"),
  };

  function togglePlatform(p: Platform) {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  async function save() {
    if (saving) return;
    if (!name.trim()) {
      setErrorMsg(ERRORS.name);
      return;
    }
    if (platforms.length === 0) {
      setErrorMsg(ERRORS.platform);
      return;
    }
    if (!template.trim()) {
      setErrorMsg(ERRORS.template);
      return;
    }
    const trigger =
      triggerKind === "comment-keyword"
        ? { kind: "comment-keyword" as const, keyword: keyword.trim(), match }
        : triggerKind === "first-comment"
        ? { kind: "first-comment" as const, postId: postId.trim() || undefined }
        : { kind: "follow" as const, postId: postId.trim() || undefined };
    if (triggerKind === "comment-keyword" && !trigger.keyword) {
      setErrorMsg(ERRORS.keyword);
      return;
    }
    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/automations/dm", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...getOverrideHeaders() },
        body: JSON.stringify({
          name: name.trim(),
          status: "paused",
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
      const data = (await res.json()) as { id: string };
      router.push(`/dashboard/automations/dm/${data.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-3 lg:px-6 pt-5 lg:pt-8 pb-3 lg:pb-6 max-w-3xl">
      <PageHeader
        title={t("automations.new.page_title")}
        subtitle={t("automations.new.page_subtitle")}
      />

      <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-5">
        <Field label={t("automations.new.campaign_name")} required>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("automations.new.name_placeholder")}
            className="w-full h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
          />
        </Field>

        <Field label={t("automations.new.trigger")}>
          <div className="space-y-2">
            {TRIGGER_OPTIONS(t).map((o) => (
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
                  <p className="text-sm font-medium text-zinc-900">{o.label}</p>
                  <p className="text-xs text-zinc-500">{o.description}</p>
                </div>
              </label>
            ))}
          </div>
        </Field>

        {triggerKind === "comment-keyword" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label={t("automations.new.keyword")} required>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={t("automations.new.keyword_placeholder")}
            className="w-full h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
          />
        </Field>
        <Field label={t("automations.new.match_type")}>
          <select
            value={match}
            onChange={(e) => setMatch(e.target.value as "contains" | "exact" | "starts-with")}
            className="w-full h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
          >
            <option value="contains">{t("automations.new.match_contains")}</option>
            <option value="starts-with">{t("automations.new.match_starts")}</option>
            <option value="exact">{t("automations.new.match_exact")}</option>
          </select>
        </Field>
          </div>
        ) : (
          <Field label={t("automations.new.restrict_post")}>
            <input
              type="text"
              value={postId}
              onChange={(e) => setPostId(e.target.value)}
              placeholder={t("automations.new.post_placeholder")}
              className="w-full h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
          </Field>
        )}

        <Field label={t("automations.new.platforms")} required>
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
        </Field>

        <Field label={t("automations.new.template_label")} required hint={t("automations.new.template_hint")}>
          <textarea
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            placeholder={t("automations.new.template_placeholder")}
            rows={5}
            className="w-full rounded-md border border-zinc-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 resize-none"
          />
        </Field>

        <Field label={t("automations.new.daily_cap")} hint={t("automations.new.cap_hint")}>
          <input
            type="number"
            value={cap}
            min={1}
            max={10}
            onChange={(e) => setCap(e.target.value ? Number(e.target.value) : "")}
            placeholder={t("automations.new.cap_placeholder")}
            className="w-32 h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
          />
        </Field>

        {errorMsg ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMsg}
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => router.push("/dashboard/automations/dm")}
            className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-3 h-9 text-sm font-medium hover:bg-zinc-50"
          >
            {t("automations.new.cancel")}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white px-3 h-9 text-sm font-medium"
          >
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            {saving ? t("automations.new.creating") : t("automations.new.create")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700 mb-1.5">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>
      {children}
      {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}
