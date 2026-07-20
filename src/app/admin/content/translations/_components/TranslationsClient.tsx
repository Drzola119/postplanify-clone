"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  updateTranslationAction,
  addTranslationKeyAction,
} from "@/app/admin/localization/actions";
import type { TranslationRow } from "@/app/admin/localization/actions";
import { useToast } from "@/components/ui/toast";

interface Props {
  data: {
    rows: TranslationRow[];
    locales: string[];
    namespaces: string[];
    totalKeys: number;
  };
}

export function TranslationsClient({ data }: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const [namespace, setNamespace] = useState("all");
  const [search, setSearch] = useState("");
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [editKey, setEditKey] = useState<TranslationRow | null>(null);
  const [editLocale, setEditLocale] = useState("");
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const filtered = useMemo(() => {
    let list = data.rows;
    if (namespace !== "all") list = list.filter((r) => r.key.startsWith(namespace + ".") || r.key === namespace);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((r) => r.key.toLowerCase().includes(s));
    }
    if (onlyMissing) list = list.filter((r) => r.missingIn.length > 0);
    return list;
  }, [data.rows, namespace, search, onlyMissing]);

  const openEdit = (row: TranslationRow, locale: string) => {
    setEditKey(row);
    setEditLocale(locale);
    setEditValue(row.values[locale] ?? "");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editKey || !editLocale) return;
    setSaving(true);
    try {
      await updateTranslationAction(editKey.key, editLocale, editValue);
      toast({ title: "Translation saved", tone: "success" });
      setEditKey(null);
      router.refresh();
    } catch (err: unknown) {
      toast({ title: "Save failed", description: err instanceof Error ? err.message : "Unknown error", tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) return;
    try {
      await addTranslationKeyAction(newKey.trim(), newValue);
      toast({ title: "Key added to en.json", tone: "success" });
      setNewKey("");
      setNewValue("");
      router.refresh();
    } catch (err: unknown) {
      toast({ title: "Add failed", description: err instanceof Error ? err.message : "Unknown error", tone: "error" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-4 flex flex-wrap gap-3 items-center">
        <select
          value={namespace}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNamespace(e.target.value)}
          className="p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
        >
          <option value="all">All namespaces ({data.namespaces.length})</option>
          {data.namespaces.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search keys..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#01696f]"
        />
        <button
          onClick={() => setOnlyMissing((v) => !v)}
          className={`px-3 py-2 text-[11px] font-bold rounded-xl border ${
            onlyMissing ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
          }`}
        >
          Missing only
        </button>
        <span className="text-xs text-gray-500 font-semibold">{data.totalKeys} keys · {filtered.length} shown</span>
      </div>

      <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-gray-200 shadow-xs p-3 flex gap-2 items-end">
        <div className="flex-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase">New key (dotted)</label>
          <input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="namespace.new.key" className="w-full mt-1 p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl" />
        </div>
        <div className="flex-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase">English value</label>
          <input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="Value" className="w-full mt-1 p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl" />
        </div>
        <button type="submit" className="px-4 py-2 bg-[#01696f] text-white text-xs font-bold rounded-xl">Add Key</button>
      </form>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-3.5">Key</th>
              {data.locales.map((l) => (
                <th key={l} className="px-6 py-3.5">{l.toUpperCase()}</th>
              ))}
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((r) => (
              <tr key={r.key} className="hover:bg-gray-50/80 align-top">
                <td className="px-6 py-4 text-xs font-mono font-bold text-[#01696f]">{r.key}</td>
                {data.locales.map((l) => {
                  const val = r.values[l];
                  const missing = !val;
                  return (
                    <td key={l} className="px-6 py-4 text-xs text-gray-700 max-w-[260px]">
                      {missing ? (
                        <span className="text-amber-600 font-bold">— missing —</span>
                      ) : (
                        <span className="line-clamp-2">{val}</span>
                      )}
                    </td>
                  );
                })}
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  {data.locales.map((l) => (
                    <button
                      key={l}
                      onClick={() => openEdit(r, l)}
                      className="ml-1 px-2 py-1 text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100"
                    >
                      {l}
                    </button>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <form onSubmit={handleSave} className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl text-xs">
            <h3 className="font-bold text-gray-900 text-sm">
              Edit <span className="font-mono text-[#01696f]">{editKey.key}</span> · {editLocale.toUpperCase()}
            </h3>
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              rows={5}
              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl font-mono"
            />
            {editKey.hasPlaceholders && (
              <p className="text-[10px] text-amber-600">Preserve {"{placeholder}"} tokens.</p>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditKey(null)} className="px-4 py-2 border border-gray-200 rounded-xl">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-[#01696f] text-white font-bold rounded-xl disabled:opacity-50">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
