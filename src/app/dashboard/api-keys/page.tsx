"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Copy, Plus, Eye, EyeOff, Trash2, Check } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Dialog } from "@/components/ui/dialog";
import { PPInput } from "@/components/ui/pp-input";
import { PPButton } from "@/components/ui/pp-button";

interface ApiKeyRow {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt?: string;
  revokedAt?: string;
}

type Step = "form" | "loading" | "success";

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reveal, setReveal] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [showDialog, setShowDialog] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [expiration, setExpiration] = useState("30d");
  const [generatedKey, setGeneratedKey] = useState("");
  const [generatedPrefix, setGeneratedPrefix] = useState("");
  const [dialogError, setDialogError] = useState<string | null>(null);
  const t = useTranslations("dashboard");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/api-keys", { credentials: "include" });
        if (!res.ok) {
          setError(t("apiKeys.load_error", { status: res.status }));
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setKeys(data.keys ?? []);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("apiKeys.network_error"));
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete(id: string) {
    if (!confirm(t("apiKeys.revoke_confirm"))) return;
    const res = await fetch(`/api/api-keys/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } else {
      alert(t("apiKeys.revoke_error"));
    }
  }

  async function handleGenerate() {
    if (!name.trim()) return;
    setStep("loading");
    setDialogError(null);
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), scopes: ["all"] }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDialogError(data?.error?.message ?? t("apiKeys.generate_error"));
        setStep("form");
        return;
      }
      setGeneratedKey(data.token);
      setGeneratedPrefix(data.prefix);
      setKeys((prev) => [
        {
          id: data.id,
          name: name.trim(),
          prefix: data.prefix,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setStep("success");
    } catch {
      setDialogError(t("apiKeys.network_error"));
      setStep("form");
    }
  }

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function resetDialog() {
    setShowDialog(false);
    setStep("form");
    setName("");
    setExpiration("30d");
    setGeneratedKey("");
    setGeneratedPrefix("");
    setDialogError(null);
  }

  const onClose = useCallback(() => resetDialog(), []);

  function fmtDate(iso?: string) {
    if (!iso) return t("apiKeys.never");
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  function fmtRelative(iso?: string) {
    if (!iso) return t("apiKeys.never");
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60_000);
    if (m < 1) return t("apiKeys.just_now");
    if (m < 60) return t("apiKeys.min_ago", { n: m });
    const h = Math.floor(m / 60);
    if (h < 24) return t("apiKeys.hour_ago", { n: h });
    const d = Math.floor(h / 24);
    if (d < 30) return t("apiKeys.day_ago", { n: d });
    return fmtDate(iso);
  }

  return (
    <div className="p-6 max-w-5xl">
      <PageHeader
        title={t("apiKeys.page_title")}
        subtitle={t("apiKeys.page_subtitle")}
        cta={
          <button
            type="button"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium"
            onClick={() => setShowDialog(true)}
          >
            <Plus className="size-4" />
            {t("apiKeys.generate_key")}
          </button>
        }
      />

      <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-start gap-3">
        <span className="text-xl">📘</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-blue-900">{t("apiKeys.read_docs")}</p>
          <p className="text-xs text-blue-800 mt-1">{t("apiKeys.docs_banner")}</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">{t("apiKeys.loading")}</div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : keys.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center">
          <p className="text-sm text-zinc-600">{t("apiKeys.empty_title")}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="grid grid-cols-[2fr_1fr_1fr_120px] gap-2 px-5 py-3 border-b border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
            <div>{t("apiKeys.col_name")}</div>
            <div>{t("apiKeys.col_created")}</div>
            <div>{t("apiKeys.col_last_used")}</div>
            <div className="text-right">{t("apiKeys.col_actions")}</div>
          </div>
          {keys.map((k) => (
            <div key={k.id} className="grid grid-cols-[2fr_1fr_1fr_120px] gap-2 px-5 py-4 border-b border-zinc-100 items-center">
              <div>
                <p className="text-sm font-semibold">
                  {k.name}
                  {k.revokedAt && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">{t("apiKeys.revoked_badge")}</span>
                  )}
                </p>
                <div className="mt-1 inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1">
                  <code className="text-xs font-mono text-zinc-700">
                    {reveal === k.id ? `${k.prefix}…` : `${k.prefix}…`}
                  </code>
                  <button type="button" onClick={() => setReveal(reveal === k.id ? null : k.id)} className="text-zinc-500 hover:text-zinc-900">
                    {reveal === k.id ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                  </button>
                  <button
                    type="button"
                    className="text-zinc-500 hover:text-zinc-900"
                    aria-label="Copy"
                    onClick={() => handleCopy(k.prefix, k.id)}
                  >
                    {copiedId === k.id ? <Check className="size-3 text-green-600" /> : <Copy className="size-3" />}
                  </button>
                </div>
              </div>
              <div className="text-sm text-zinc-600">{fmtDate(k.createdAt)}</div>
              <div className="text-sm text-zinc-600">{fmtRelative(k.lastUsedAt)}</div>
              <div className="flex items-center justify-end gap-1">
                <button
                  type="button"
                  onClick={() => handleDelete(k.id)}
                  disabled={Boolean(k.revokedAt)}
                  className="size-8 inline-flex items-center justify-center rounded-md hover:bg-zinc-100 text-red-600 disabled:opacity-50"
                  aria-label="Delete"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onClose={onClose} title={t("apiKeys.dialog_title")} description={t("apiKeys.dialog_subtitle")} maxWidth="sm:max-w-[440px]">
        {step === "success" ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              {t("apiKeys.dialog_copy_hint")}
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-zinc-500">{t("apiKeys.your_key")}</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm font-mono text-zinc-900 break-all select-all">
                  {generatedKey}
                </code>
                <PPButton
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(generatedKey, "__generated")}
                  className="shrink-0"
                >
                  {copiedId === "__generated" ? <Check className="size-3.5 text-green-600" /> : <Copy className="size-3.5" />}
                </PPButton>
              </div>
            </div>
            <div className="flex justify-end">
              <PPButton variant="primary" onClick={onClose}>
                {t("apiKeys.done")}
              </PPButton>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleGenerate();
            }}
            className="space-y-4"
          >
            <PPInput
              label={t("apiKeys.name_label")}
              placeholder={t("apiKeys.name_placeholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={step === "loading"}
              required
              autoFocus
            />
            <div className="w-full">
              <label className="block text-xs font-semibold text-zinc-500 mb-1.5">{t("apiKeys.expiration")}</label>
              <select
                value={expiration}
                onChange={(e) => setExpiration(e.target.value)}
                disabled={step === "loading"}
                className="w-full rounded-md border border-zinc-200 bg-white px-3 h-9 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300 disabled:opacity-50"
              >
                <option value="30d">{t("apiKeys.exp_30")}</option>
                <option value="90d">{t("apiKeys.exp_90")}</option>
                <option value="1y">{t("apiKeys.exp_1y")}</option>
                <option value="never">{t("apiKeys.exp_never")}</option>
              </select>
            </div>
            {dialogError && (
              <p className="text-sm text-red-600">{dialogError}</p>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <PPButton variant="outline" onClick={onClose} disabled={step === "loading"} type="button">
                {t("apiKeys.cancel")}
              </PPButton>
              <PPButton variant="primary" type="submit" disabled={!name.trim() || step === "loading"}>
                {step === "loading" ? t("apiKeys.generating") : t("apiKeys.generate")}
              </PPButton>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
