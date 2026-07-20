"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { upsertContentOverrideAction, deleteContentOverrideAction } from "@/app/admin/actions";
import type { ContentOverride } from "@/app/admin/actions";
import { useToast } from "@/components/ui/toast";

interface Props {
  overrides: ContentOverride[];
}

export function ContentTemplatesClient({ overrides }: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const [editing, setEditing] = useState<ContentOverride | { isNew: boolean } | null>(null);
  const [key, setKey] = useState("");
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const openNew = () => {
    setEditing({ isNew: true });
    setKey("");
    setTitle("");
    setExcerpt("");
    setMetaTitle("");
    setMetaDescription("");
  };

  const openEdit = (o: ContentOverride) => {
    setEditing(o);
    setKey(o.key);
    setTitle(o.title ?? "");
    setExcerpt(o.excerpt ?? "");
    setMetaTitle(o.metaTitle ?? "");
    setMetaDescription(o.metaDescription ?? "");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) {
      toast({ title: "Key is required", tone: "error" });
      return;
    }
    setSaving(true);
    try {
      await upsertContentOverrideAction({
        key: key.trim(),
        type: "template",
        title: title || undefined,
        excerpt: excerpt || undefined,
        metaTitle: metaTitle || undefined,
        metaDescription: metaDescription || undefined,
      });
      toast({ title: "Template override saved", tone: "success" });
      setEditing(null);
      router.refresh();
    } catch (err: unknown) {
      toast({ title: "Save failed", description: err instanceof Error ? err.message : "Unknown error", tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (k: string) => {
    if (!confirm(`Delete override for ${k}?`)) return;
    await deleteContentOverrideAction(k);
    toast({ title: "Override deleted", tone: "info" });
    router.refresh();
  };

  if (editing) {
    const isNew = "isNew" in editing && editing.isNew;
    const editKey = "key" in editing ? editing.key : "";
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 max-w-2xl">
        <h3 className="font-bold text-gray-900 text-sm mb-4">{isNew ? "New Template Override" : `Edit ${editKey}`}</h3>
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-gray-700">Key (e.g. template.social-media-calendar)</label>
            <input value={key} onChange={(e) => setKey(e.target.value)} disabled={!isNew} className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-xl disabled:opacity-60" />
          </div>
          <div>
            <label className="font-bold text-gray-700">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-xl" />
          </div>
          <div>
            <label className="font-bold text-gray-700">Body / Copy</label>
            <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={3} className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-xl" />
          </div>
          <div>
            <label className="font-bold text-gray-700">Meta Title (SEO)</label>
            <input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-xl" />
          </div>
          <div>
            <label className="font-bold text-gray-700">Meta Description (SEO)</label>
            <input value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-xl" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 border border-gray-200 rounded-xl">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-[#01696f] text-white font-bold rounded-xl disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-[#01696f] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#015257]">New Template Override</button>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-3.5">Key</th>
              <th className="px-6 py-3.5">Title</th>
              <th className="px-6 py-3.5">Updated</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {overrides.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-xs text-gray-400">No overrides yet.</td></tr>
            ) : (
              overrides.map((o) => (
                <tr key={o.key} className="hover:bg-gray-50/80">
                  <td className="px-6 py-4 text-xs font-mono font-bold text-[#01696f]">{o.key}</td>
                  <td className="px-6 py-4 text-xs text-gray-700">{o.title ?? "—"}</td>
                  <td className="px-6 py-4 text-xs text-gray-500">{o.updatedAt ? new Date(o.updatedAt).toLocaleDateString() : "—"}</td>
                  <td className="px-6 py-4 text-right space-x-1">
                    <button onClick={() => openEdit(o)} className="px-2 py-1 text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100">Edit</button>
                    <button onClick={() => handleDelete(o.key)} className="px-2 py-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
