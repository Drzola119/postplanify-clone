"use client";

import { useState } from "react";
import { Copy, Plus, Eye, EyeOff, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";

const KEYS = [
  { id: 1, name: "Production", prefix: "pp_live_3kf...", created: "Jun 12, 2026", lastUsed: "2 hours ago" },
  { id: 2, name: "Staging", prefix: "pp_test_82hd...", created: "May 28, 2026", lastUsed: "Yesterday" },
  { id: 3, name: "Local dev", prefix: "pp_test_a91x...", created: "Apr 03, 2026", lastUsed: "3 days ago" },
];

export default function ApiKeysPage() {
  const [reveal, setReveal] = useState<number | null>(null);

  return (
    <div className="p-6 max-w-5xl">
      <PageHeader
        title="API Keys"
        subtitle="Connect PostPlanify to your own tools with our REST API."
        cta={
          <button type="button" className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium">
            <Plus className="size-4" />
            Generate Key
          </button>
        }
      />

      <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-start gap-3">
        <span className="text-xl">📘</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-blue-900">Read the API docs</p>
          <p className="text-xs text-blue-800 mt-1">Full reference, code samples, and webhook events at postplanify.com/docs/api.</p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_120px] gap-2 px-5 py-3 border-b border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
          <div>Name</div>
          <div>Created</div>
          <div>Last used</div>
          <div className="text-right">Actions</div>
        </div>
        {KEYS.map((k) => (
          <div key={k.id} className="grid grid-cols-[2fr_1fr_1fr_120px] gap-2 px-5 py-4 border-b border-zinc-100 items-center">
            <div>
              <p className="text-sm font-semibold">{k.name}</p>
              <div className="mt-1 inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1">
                <code className="text-xs font-mono text-zinc-700">
                  {reveal === k.id ? `${k.prefix}xxxx_full_key_here` : k.prefix}
                </code>
                <button type="button" onClick={() => setReveal(reveal === k.id ? null : k.id)} className="text-zinc-500 hover:text-zinc-900">
                  {reveal === k.id ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                </button>
                <button type="button" className="text-zinc-500 hover:text-zinc-900" aria-label="Copy">
                  <Copy className="size-3" />
                </button>
              </div>
            </div>
            <div className="text-sm text-zinc-600">{k.created}</div>
            <div className="text-sm text-zinc-600">{k.lastUsed}</div>
            <div className="flex items-center justify-end gap-1">
              <button type="button" className="size-8 inline-flex items-center justify-center rounded-md hover:bg-zinc-100 text-red-600" aria-label="Delete">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}