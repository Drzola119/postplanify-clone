"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Save, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { getOverrideHeaders } from "@/lib/security/client-overrides";

interface CampaignDetail {
  id: string;
  name: string;
  status: "active" | "paused";
  template: string;
  triggered: number;
  sent: number;
  lastTriggeredAt?: string;
}

export default function EditAutoDmCampaignPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [status, setStatus] = useState<"active" | "paused">("paused");
  const [template, setTemplate] = useState("");
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
      } catch (err) {
        if (!cancelled) setErrorMsg("Network error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function save() {
    if (saving || !campaign) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/automations/dm/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...getOverrideHeaders() },
        body: JSON.stringify({ status, template }),
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
    if (!window.confirm("Delete this AutoDM campaign?")) return;
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
            Back
          </button>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="px-3 lg:px-6 pt-5 lg:pt-8 flex items-center justify-center py-16 text-sm text-zinc-500">
        <Loader2 className="size-4 animate-spin mr-2" /> Loading…
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
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Status</label>
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
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Template</label>
          <textarea
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            rows={6}
            className="w-full rounded-md border border-zinc-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 resize-none"
          />
          <p className="mt-1 text-xs text-zinc-500">Use {"{{handle}}"} and {"{{comment}}"} placeholders.</p>
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
            <Trash2 className="size-3.5" /> Delete
          </button>
          <div className="flex items-center gap-2">
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
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
