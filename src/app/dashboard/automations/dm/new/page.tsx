"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

const TRIGGER_OPTIONS: { value: "comment-keyword" | "first-comment" | "follow"; label: string; description: string }[] = [
  { value: "comment-keyword", label: "Comment contains a keyword", description: "Reply when someone comments with a specific word/phrase." },
  { value: "first-comment", label: "First comment ever", description: "Reply to anyone who comments on your post for the first time." },
  { value: "follow", label: "New follower", description: "Welcome new followers with a DM." },
];

export default function NewAutoDmCampaignPage() {
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

  function togglePlatform(p: Platform) {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  async function save() {
    if (saving) return;
    if (!name.trim()) {
      setErrorMsg("Name is required");
      return;
    }
    if (platforms.length === 0) {
      setErrorMsg("Pick at least one platform");
      return;
    }
    if (!template.trim()) {
      setErrorMsg("Template is required");
      return;
    }
    const trigger =
      triggerKind === "comment-keyword"
        ? { kind: "comment-keyword" as const, keyword: keyword.trim(), match }
        : triggerKind === "first-comment"
        ? { kind: "first-comment" as const, postId: postId.trim() || undefined }
        : { kind: "follow" as const, postId: postId.trim() || undefined };
    if (triggerKind === "comment-keyword" && !trigger.keyword) {
      setErrorMsg("Keyword is required");
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
        title="New AutoDM campaign"
        subtitle="Set up the trigger, message template, and platforms."
      />

      <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-5">
        <Field label="Campaign name" required>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Welcome new followers"
            className="w-full h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
          />
        </Field>

        <Field label="Trigger">
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
                  <p className="text-sm font-medium text-zinc-900">{o.label}</p>
                  <p className="text-xs text-zinc-500">{o.description}</p>
                </div>
              </label>
            ))}
          </div>
        </Field>

        {triggerKind === "comment-keyword" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Keyword" required>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g. PRICE"
                className="w-full h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              />
            </Field>
            <Field label="Match type">
              <select
                value={match}
                onChange={(e) => setMatch(e.target.value as "contains" | "exact" | "starts-with")}
                className="w-full h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              >
                <option value="contains">contains</option>
                <option value="starts-with">starts with</option>
                <option value="exact">exact match</option>
              </select>
            </Field>
          </div>
        ) : (
          <Field label="Restrict to post (optional)">
            <input
              type="text"
              value={postId}
              onChange={(e) => setPostId(e.target.value)}
              placeholder="leave blank for any"
              className="w-full h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
          </Field>
        )}

        <Field label="Platforms" required>
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

        <Field label="Message template" required hint="Use {{handle}} and {{comment}} as placeholders.">
          <textarea
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            placeholder="Hey {{handle}}! Thanks for the comment — here's the link you asked for: https://…"
            rows={5}
            className="w-full rounded-md border border-zinc-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 resize-none"
          />
        </Field>

        <Field label="Per-author daily cap" hint="Limits sends to the same author in a 24h window to avoid spam.">
          <input
            type="number"
            value={cap}
            min={1}
            max={10}
            onChange={(e) => setCap(e.target.value ? Number(e.target.value) : "")}
            placeholder="1"
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
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white px-3 h-9 text-sm font-medium"
          >
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            {saving ? "Creating…" : "Create campaign"}
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
