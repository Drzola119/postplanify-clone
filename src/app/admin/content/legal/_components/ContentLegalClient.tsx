"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { upsertContentOverrideAction } from "@/app/admin/actions";
import type { ContentOverride } from "@/app/admin/actions";
import { useToast } from "@/components/ui/toast";

interface Props {
  overrides: ContentOverride[];
  legalDocs: { key: string; label: string }[];
}

export function ContentLegalClient({ overrides, legalDocs }: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const [activeKey, setActiveKey] = useState<string>(legalDocs[0].key);
  const [body, setBody] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const existing = overrides.find((o) => o.key === activeKey);

  const load = (key: string) => {
    setActiveKey(key);
    const o = overrides.find((x) => x.key === key);
    setBody(o?.body ?? "");
    setMetaTitle(o?.metaTitle ?? "");
    setMetaDescription(o?.metaDescription ?? "");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await upsertContentOverrideAction({
        key: activeKey,
        type: "legal",
        body: body || undefined,
        metaTitle: metaTitle || undefined,
        metaDescription: metaDescription || undefined,
      });
      toast({ title: "Legal override saved", tone: "success" });
      router.refresh();
    } catch (err: unknown) {
      toast({ title: "Save failed", description: err instanceof Error ? err.message : "Unknown error", tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-2 h-fit">
        {legalDocs.map((d) => {
          const has = overrides.some((o) => o.key === d.key);
          return (
            <button
              key={d.key}
              onClick={() => load(d.key)}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                activeKey === d.key ? "bg-[#01696f] text-white" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {d.label}
              {has && <span className="ml-2 text-[9px] text-emerald-500">●</span>}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-4 text-xs">
        <h3 className="font-bold text-gray-900 text-sm">{legalDocs.find((d) => d.key === activeKey)?.label} — Override</h3>
        <div>
          <label className="font-bold text-gray-700">Body Copy (markdown/plain)</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={14}
            placeholder="Leave empty to keep the hardcoded page content."
            className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-xl font-mono"
          />
        </div>
        <div>
          <label className="font-bold text-gray-700">Meta Title (SEO)</label>
          <input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-xl" />
        </div>
        <div>
          <label className="font-bold text-gray-700">Meta Description (SEO)</label>
          <input value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-xl" />
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="px-4 py-2 bg-[#01696f] text-white font-bold rounded-xl disabled:opacity-50">
            {saving ? "Saving..." : "Save Override"}
          </button>
        </div>
      </form>
    </div>
  );
}
