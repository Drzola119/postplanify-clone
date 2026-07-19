"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Save, Loader2, AlertCircle, Globe, Palette } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { getOverrideHeaders } from "@/lib/security/client-overrides";

interface Branding {
  brandName: string;
  logoUrl: string;
  primaryColor: string;
  customDomain: string;
  whiteLabelEnabled: boolean;
  footerText: string;
  hidePoweredBy: boolean;
}

const DEFAULTS: Branding = {
  brandName: "",
  logoUrl: "",
  primaryColor: "#0f172a",
  customDomain: "",
  whiteLabelEnabled: false,
  footerText: "",
  hidePoweredBy: false,
};

export default function WhiteLabelBrandingPage() {
  const t = useTranslations("dashboard");
  const [b, setB] = useState<Branding | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/branding", { credentials: "include", headers: getOverrideHeaders() });
        if (!res.ok) {
          if (!cancelled) setErrorMsg(`Failed to load (${res.status})`);
          return;
        }
        const data = (await res.json()) as { branding: Branding };
        if (!cancelled) setB({ ...DEFAULTS, ...data.branding });
      } catch {
        if (!cancelled) setErrorMsg("Network error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function set<K extends keyof Branding>(k: K, v: Branding[K]) {
    setB((prev) => (prev ? { ...prev, [k]: v } : prev));
  }

  async function save() {
    if (!b || saving) return;
    setSaving(true);
    setErrorMsg(null);
    setSavedAt(null);
    try {
      const res = await fetch("/api/branding", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...getOverrideHeaders() },
        body: JSON.stringify(b),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setErrorMsg(data.error ?? `Failed (${res.status})`);
        return;
      }
      setSavedAt(new Date().toLocaleTimeString());
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-3 lg:px-6 pt-5 lg:pt-8 pb-3 lg:pb-6 max-w-3xl">
      <PageHeader
        title={t("settings.branding.page_title")}
        subtitle={t("settings.branding.page_subtitle")}
      />

      {!b ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-12 flex items-center justify-center text-sm text-zinc-500">
          {errorMsg ? (
            <span className="text-red-600">{errorMsg}</span>
          ) : (
            <>
              <Loader2 className="size-4 animate-spin mr-2" /> {t("settings.branding.loading")}
            </>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-5">
          <Field label={t("settings.branding.brand_name")}>
            <input
              type="text"
              value={b.brandName}
              onChange={(e) => set("brandName", e.target.value)}
              placeholder={t("settings.branding.brand_placeholder")}
              className="w-full h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
          </Field>
          <Field label={t("settings.branding.logo_url")}>
            <input
              type="url"
              value={b.logoUrl}
              onChange={(e) => set("logoUrl", e.target.value)}
              placeholder={t("settings.branding.logo_placeholder")}
              className="w-full h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t("settings.branding.primary_color")}>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={b.primaryColor}
                  onChange={(e) => set("primaryColor", e.target.value)}
                  className="size-9 rounded-md border border-zinc-200 cursor-pointer p-0"
                  aria-label={t("settings.branding.primary_color")}
                />
                <input
                  type="text"
                  value={b.primaryColor}
                  onChange={(e) => set("primaryColor", e.target.value)}
                  className="h-9 rounded-md border border-zinc-200 bg-white px-2 text-sm font-mono w-28 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                />
              </div>
            </Field>
            <Field
              label={t("settings.branding.custom_domain")}
              hint={t("settings.branding.domain_hint")}
            >
              <div className="flex items-center gap-2">
                <Globe className="size-4 text-zinc-400" />
                <input
                  type="text"
                  value={b.customDomain}
                  onChange={(e) => set("customDomain", e.target.value)}
                  placeholder={t("settings.branding.domain_placeholder")}
                  className="flex-1 h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                />
              </div>
            </Field>
          </div>

          <Field label={t("settings.branding.footer_text")}>
            <input
              type="text"
              value={b.footerText}
              onChange={(e) => set("footerText", e.target.value)}
              placeholder={t("settings.branding.footer_placeholder")}
              className="w-full h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
          </Field>

          <ToggleRow
            label={t("settings.branding.white_label")}
            description={t("settings.branding.white_label_desc")}
            checked={b.whiteLabelEnabled}
            onChange={(v) => set("whiteLabelEnabled", v)}
          />
          <ToggleRow
            label={t("settings.branding.hide_badge")}
            description={t("settings.branding.hide_badge_desc")}
            checked={b.hidePoweredBy}
            onChange={(v) => set("hidePoweredBy", v)}
          />

          <Preview b={b} />

          {errorMsg ? (
            <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="size-4" />
              {errorMsg}
            </div>
          ) : null}
          {savedAt ? (
            <p className="text-xs text-emerald-600">{t("settings.branding.saved_at", { time: savedAt })}</p>
          ) : null}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white px-3 h-9 text-sm font-medium"
            >
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              {saving ? "Saving…" : "Save branding"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Preview({ b }: { b: Branding }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
      <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide mb-2 flex items-center gap-1">
        <Palette className="size-3" /> Preview
      </p>
      <div className="rounded-md bg-white p-4 border border-zinc-200">
        <div className="flex items-center gap-2 mb-3">
          {b.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={b.logoUrl} alt="" className="size-6 rounded" />
          ) : (
            <span
              className="inline-flex items-center justify-center size-6 rounded text-white text-xs font-bold"
              style={{ backgroundColor: b.primaryColor }}
            >
              {(b.brandName || "B").slice(0, 1).toUpperCase()}
            </span>
          )}
          <span className="text-sm font-semibold">{b.brandName || "Brand name"}</span>
        </div>
        <div className="text-[11px] text-zinc-400">{b.footerText || "Footer text"}</div>
        <button
          type="button"
          className="mt-3 inline-flex items-center rounded-md px-3 h-8 text-xs text-white"
          style={{ backgroundColor: b.primaryColor }}
        >
          Sample CTA
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700 mb-1.5">{label}</label>
      {children}
      {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer rounded-md border border-zinc-200 p-3 hover:bg-zinc-50">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 mt-0.5 accent-zinc-900"
      />
      <div className="flex-1">
        <p className="text-sm font-medium text-zinc-900">{label}</p>
        <p className="text-xs text-zinc-500">{description}</p>
      </div>
    </label>
  );
}
