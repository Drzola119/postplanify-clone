"use client";

// RTL AUDIT LOG — classes migrated to CSS logical properties:
//   text-left → text-start (line 254, 311)
// No ml-/mr-/pl-/pr-/left-/right-/rounded-l-/rounded-r-/border-l-/border-r-
// classes exist in this file; those two text-left were the only LTR-hardcoded
// alignment utilities. Step indicators are inline circles with no connector
// line, so no directional connector fix was required.

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Sparkles,
  Loader2,
  Check,
  RefreshCw,
  Image as ImageIcon,
  Shuffle,
  ArrowRight,
  Globe,
  Wand2,
  AlertCircle,
  Info,
  AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { OUTPUT_LANGUAGE_LABELS, type OutputLanguage } from "@/lib/i18n/types";
import { ARABIC_CAPABLE_PROVIDERS } from "@/lib/image-gen/language-support";

/**
 * Shared wizard for both infographic tools. The only thing that
 * varies per tool is which input fields appear in the "Tell us about
 * it" panel — Instant takes a topic, Ads takes offerTitle / offerCopy /
 * optional offerUrl.
 *
 * Server builds the prompt from these inputs (see
 * /api/infographics/generate/route.ts → buildInfographicPrompt or
 * buildAdsInfographicPrompt), so the client never sees the template.
 *
 * The Output Language selector controls what language the AI renders the
 * ON-IMAGE text in. It is INDEPENDENT from the UI locale — never derived
 * from it and never synced.
 */

interface StyleOption {
  id: string;
  title: string;
  summary: string;
}

const PROVIDERS = [
  { id: "auto", label: "Auto (fallback chain)", desc: "Use the default order — recommended." },
  { id: "gemini-flash-lite-image", label: "Gemini Flash Lite Image", desc: "Fast + cheap. Default first try." },
  { id: "gpt-image-2", label: "GPT Image 2", desc: "Best typography. Costs more." },
  { id: "ideogram-4", label: "Ideogram 4", desc: "Layout-heavy designs." },
  { id: "gemini-flash-image", label: "Gemini Flash Image", desc: "Fallback." },
] as const;

const ASPECTS = [
  { id: "1:1",  label: "1:1",  desc: "Square — Instagram feed, LinkedIn" },
  { id: "2:3",  label: "2:3",  desc: "Portrait — Pinterest" },
  { id: "3:2",  label: "3:2",  desc: "Landscape — wide photo" },
  { id: "3:4",  label: "3:4",  desc: "Portrait — Instagram / TikTok feed" },
  { id: "4:3",  label: "4:3",  desc: "Landscape — presentations" },
  { id: "9:16", label: "9:16", desc: "Story / Reel / TikTok" },
  { id: "16:9", label: "16:9", desc: "Widescreen — YouTube, Twitter" },
  { id: "21:9", label: "21:9", desc: "Ultra-wide cinematic" },
] as const;

const SCHEMES = [
  { id: "light", label: "Light", swatch: "bg-white border-zinc-200" },
  { id: "dark", label: "Dark", swatch: "bg-zinc-900 border-zinc-900" },
  { id: "brand", label: "Brand", swatch: "bg-gradient-to-br from-yellow-300 via-sky-500 to-zinc-900 border-zinc-200" },
] as const;

const OUTPUT_LANGS: OutputLanguage[] = ["en", "fr", "ar"];

type ProviderId = (typeof PROVIDERS)[number]["id"];
type AspectId = (typeof ASPECTS)[number]["id"];
type SchemeId = (typeof SCHEMES)[number]["id"];

interface GenerateResponse {
  provider: string;
  model: string;
  assetId: string;
  assetUrl: string;
  width: number;
  height: number;
  aspectRatio: string;
  costUsd: number;
  durationMs: number;
  fellBackFrom: string | null;
  styleId: string;
  tool: "instant" | "ads";
}

interface InfographicWizardProps {
  tool: "instant" | "ads";
  title: string;
  subtitle: string;
  styles: StyleOption[];
  defaultStyleId: string;
}

export function InfographicWizard({
  tool,
  title,
  subtitle,
  styles,
  defaultStyleId,
}: InfographicWizardProps) {
  const t = useTranslations("infographics");
  const ts = useTranslations("infographics.shared");

  const [styleId, setStyleId] = useState(defaultStyleId);
  const [provider, setProvider] = useState<ProviderId>("auto");
  const [aspect, setAspect] = useState<AspectId>("3:4");
  const [scheme, setScheme] = useState<SchemeId>("light");
  const [outputLanguage, setOutputLanguage] = useState<OutputLanguage>("en");

  // Topic (Instant)
  const [topic, setTopic] = useState("");

  // Ads fields
  const [offerUrl, setOfferUrl] = useState("");
  const [offerTitle, setOfferTitle] = useState("");
  const [offerCopy, setOfferCopy] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scrapeMeta, setScrapeMeta] = useState<{
    title?: string;
    description?: string;
    truncated: boolean;
    fetchedChars: number;
  } | null>(null);

  // Common
  const [footerCta, setFooterCta] = useState("");

  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const arabicCapable = ARABIC_CAPABLE_PROVIDERS.length > 0;

  async function handleScrape() {
    if (!offerUrl.trim()) return;
    setScraping(true);
    setScrapeMeta(null);
    setError(null);
    try {
      const res = await fetch(
        `/api/infographics/scrape?url=${encodeURIComponent(offerUrl.trim())}`,
        { credentials: "include" }
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
        setError(data.error?.message ?? t("ads.error_scrape_failed"));
        return;
      }
      const data = (await res.json()) as {
        text: string;
        title?: string | null;
        description?: string | null;
        fetchedChars: number;
        truncated: boolean;
      };
      setOfferCopy(data.text);
      if (!offerTitle && data.title) setOfferTitle(data.title);
      setScrapeMeta({
        title: data.title ?? undefined,
        description: data.description ?? undefined,
        truncated: data.truncated,
        fetchedChars: data.fetchedChars,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("ads.error_scrape_failed"));
    } finally {
      setScraping(false);
    }
  }

  function canSubmit(): boolean {
    if (tool === "instant") return topic.trim().length >= 3;
    return offerTitle.trim().length >= 2 && offerCopy.trim().length >= 0;
  }

  async function generate() {
    if (!canSubmit()) return;
    setGenerating(true);
    setError(null);
    setResult(null);
    try {
      const body =
        tool === "instant"
          ? {
              tool,
              topic: topic.trim(),
              provider,
              aspectRatio: aspect,
              colorScheme: scheme,
              outputLanguage,
              context: { styleId, campaignId: footerCta.trim() || undefined },
            }
          : {
              tool,
              offerTitle: offerTitle.trim(),
              offerCopy: offerCopy.trim(),
              offerUrl: offerUrl.trim() || undefined,
              provider,
              aspectRatio: aspect,
              colorScheme: scheme,
              outputLanguage,
              context: { styleId, campaignId: footerCta.trim() || undefined },
            };
      const res = await fetch("/api/infographics/generate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: { message?: string; issues?: unknown };
        };
        setError(data.error?.message ?? `Generation failed (${res.status})`);
        return;
      }
      const data = (await res.json()) as { ok?: boolean } & GenerateResponse;
      setResult({ ...data, tool });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  function regenerate() {
    void generate();
  }

  function tryDifferentStyle() {
    setResult(null);
    setError(null);
  }

  return (
    <div className="p-6 max-w-6xl">
      <PageHeader
        title={title}
        subtitle={subtitle}
            cta={
            <Link
              href="/dashboard/infographics"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900"
            >
              <ArrowRight className="size-3.5 rotate-180" />
              {ts("all_tools")}
            </Link>
            }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          {/* Step 1 — Style */}
          <Panel
            step="1"
            title={tool === "instant" ? t("instant.step1_title") : t("ads.step1_title")}
            subtitle={t("instant.step1_subtitle")}
          >
            <div className="grid gap-2 sm:grid-cols-2">
              {styles.map((s) => {
                const active = s.id === styleId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStyleId(s.id)}
                    className={
                      "text-start rounded-xl border p-3 transition-all " +
                      (active
                        ? "border-zinc-900 bg-zinc-50 ring-2 ring-zinc-900/10"
                        : "border-zinc-200 bg-white hover:border-zinc-300")
                    }
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className={
                          "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full " +
                          (active ? "bg-zinc-900 text-white" : "border border-zinc-300")
                        }
                      >
                        {active && <Check className="size-3" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{s.title}</p>
                        <p className="mt-0.5 text-xs text-zinc-600">{s.summary}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Panel>

          {/* Step 2 — Provider + aspect + scheme + OUTPUT LANGUAGE */}
          <Panel
            step="2"
            title={tool === "instant" ? t("instant.step2_title") : t("ads.step2_title")}
            subtitle={t("instant.step2_subtitle")}
          >
            <Field label={tool === "instant" ? t("instant.provider_label") : t("ads.provider_label")}>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as ProviderId)}
                className="w-full h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              >
                {PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={tool === "instant" ? t("instant.aspect_ratio_label") : t("ads.aspect_ratio_label")}>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {ASPECTS.map((a) => {
                  const active = a.id === aspect;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setAspect(a.id)}
                      title={a.desc}
                      aria-pressed={active}
                      className={
                        "flex flex-col items-start gap-1 rounded-md border p-2 text-start transition-all " +
                        (active
                          ? "ring-2 ring-zinc-900/20 border-zinc-900 bg-zinc-50"
                          : "border-zinc-200 bg-white hover:border-zinc-300")
                      }
                    >
                      <span className="text-xs font-semibold text-zinc-900">{a.label}</span>
                      <span className="text-[11px] leading-tight text-zinc-600">{a.desc}</span>
                    </button>
                  );
                })}
              </div>
            </Field>
            <Field label={t("instant.scheme_label")}>
              <div className="flex items-center gap-2">
                {SCHEMES.map((s) => {
                  const active = s.id === scheme;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setScheme(s.id)}
                      className={
                        "flex flex-col items-center gap-1 rounded-md border p-1.5 transition-all " +
                        (active ? "ring-2 ring-zinc-900/20 border-zinc-900" : "border-zinc-200 hover:border-zinc-300")
                      }
                    >
                      <span className={`block size-7 rounded ${s.swatch}`} />
                      <span className="text-[11px] font-medium">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </Field>

            {/* Output Language — independent of UI locale */}
            <Field label={tool === "instant" ? t("instant.output_language_label") : t("ads.output_language_label")}>
              <select
                value={outputLanguage}
                onChange={(e) => setOutputLanguage(e.target.value as OutputLanguage)}
                className="w-full h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              >
                {OUTPUT_LANGS.map((l) => (
                  <option key={l} value={l}>
                    {OUTPUT_LANGUAGE_LABELS[l]}
                  </option>
                ))}
              </select>
              {outputLanguage === "ar" ? (
                arabicCapable ? (
                  <p className="mt-1.5 flex items-start gap-1.5 text-[11px] text-zinc-500">
                    <Info className="size-3.5 mt-0.5 shrink-0" />
                    <span>
                      {tool === "instant"
                        ? t("instant.output_language_helper_ar_with_provider")
                        : t("ads.output_language_helper_ar_with_provider")}
                    </span>
                  </p>
                ) : (
                  <p className="mt-1.5 flex items-start gap-1.5 text-[11px] text-amber-700">
                    <AlertTriangle className="size-3.5 mt-0.5 shrink-0" />
                    <span>
                      {tool === "instant"
                        ? t("instant.output_language_helper_ar_no_provider")
                        : t("ads.output_language_helper_ar_no_provider")}
                    </span>
                  </p>
                )
              ) : null}
            </Field>
          </Panel>

          {/* Step 3 — Input */}
          {tool === "instant" ? (
            <Panel
              step="3"
              title={t("instant.step1_title")}
              subtitle={t("instant.step3_subtitle")}
            >
              <Field label={t("instant.step1_label")}>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={t("instant.topic_placeholder")}
                  rows={3}
                  className="w-full px-3 py-2 rounded-md border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                />
              </Field>
              <Field label={t("instant.footer_cta_label")}>
                <input
                  type="text"
                  value={footerCta}
                  onChange={(e) => setFooterCta(e.target.value)}
                  placeholder="e.g. Save this for later"
                  className="w-full h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                />
              </Field>
            </Panel>
          ) : (
            <Panel
              step="3"
              title={t("ads.offer_details_title")}
              subtitle={t("ads.step3_subtitle")}
            >
              <Field label={t("ads.step1_label")}>
                <div className="flex items-stretch gap-2">
                  <input
                    type="url"
                    value={offerUrl}
                    onChange={(e) => setOfferUrl(e.target.value)}
                    placeholder={t("ads.url_placeholder")}
                    className="flex-1 h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                  />
                  <button
                    type="button"
                    onClick={handleScrape}
                    disabled={scraping || !offerUrl.trim()}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm font-medium hover:bg-zinc-50 disabled:opacity-50"
                  >
                    {scraping ? <Loader2 className="size-3.5 animate-spin" /> : <Globe className="size-3.5" />}
                    {scraping ? t("ads.scraping_label") : t("ads.scrape_button")}
                  </button>
                </div>
                {scrapeMeta ? (
                  <p className="mt-1.5 text-[11px] text-zinc-500">
                    Fetched {scrapeMeta.fetchedChars.toLocaleString()} chars
                    {scrapeMeta.truncated ? " (truncated)" : ""}
                    {scrapeMeta.title ? ` · "${scrapeMeta.title.slice(0, 80)}"` : ""}
                  </p>
                ) : null}
              </Field>
              <Field label={t("ads.offer_title_label")}>
                <input
                  type="text"
                  value={offerTitle}
                  onChange={(e) => setOfferTitle(e.target.value)}
                  placeholder="e.g. The 14-day founder reset"
                  className="w-full h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                />
              </Field>
              <Field label={t("ads.offer_copy_label")}>
                <textarea
                  value={offerCopy}
                  onChange={(e) => setOfferCopy(e.target.value)}
                  placeholder={t("ads.offer_copy_placeholder")}
                  rows={6}
                  className="w-full px-3 py-2 rounded-md border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                />
              </Field>
              <Field label={t("ads.footer_cta_label")}>
                <input
                  type="text"
                  value={footerCta}
                  onChange={(e) => setFooterCta(e.target.value)}
                  placeholder="e.g. Tap to claim — link in bio"
                  className="w-full h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                />
              </Field>
            </Panel>
          )}

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-2 text-sm text-red-700">
              <AlertCircle className="size-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={generate}
              disabled={generating || !canSubmit()}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold disabled:opacity-50"
            >
              {generating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : tool === "instant" ? (
                <Wand2 className="size-4" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {generating
                ? tool === "instant"
                  ? t("instant.generating_label")
                  : t("ads.generating_label")
                : tool === "instant"
                  ? t("instant.generate_button")
                  : t("ads.generate_button")}
            </button>
          </div>
        </div>

        {/* Right column — preview */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{ts("preview")}</p>
              {result ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[11px] font-medium">
                  <Check className="size-3" />
                  {ts("rendered")}
                </span>
              ) : null}
            </div>
            <div className="mt-3 aspect-square w-full overflow-hidden rounded-xl bg-zinc-100 border border-zinc-200 grid place-items-center">
              {result ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={result.assetUrl}
                  alt="Generated infographic"
                  className="size-full object-contain"
                />
              ) : generating ? (
                <div className="flex flex-col items-center gap-2 text-zinc-500">
                  <Loader2 className="size-5 animate-spin" />
                  <p className="text-xs">{tool === "instant" ? t("instant.generating_label") : t("ads.generating_label")}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-zinc-400">
                  <ImageIcon className="size-6" />
                  <p className="text-xs">{ts("pick_layout_hint")}</p>
                </div>
              )}
            </div>

            {result ? (
              <div className="mt-4 space-y-3">
                <Meta label="Provider" value={`${result.provider}${result.fellBackFrom ? ` (fell back from ${result.fellBackFrom})` : ""}`} />
                <Meta label="Ratio" value={result.aspectRatio} />
                <Meta label="Size" value={`${result.width}×${result.height}`} />
                <Meta label="Cost" value={`$${result.costUsd.toFixed(4)}`} />
                <Meta label="Duration" value={`${(result.durationMs / 1000).toFixed(1)}s`} />
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <Link
                    href="/dashboard/assets"
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium"
                  >
                    <Check className="size-3.5" />
                    {ts("open_media_library")}
                  </Link>
                  <button
                    type="button"
                    onClick={regenerate}
                    disabled={generating}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm font-medium hover:bg-zinc-50 disabled:opacity-50"
                  >
                    <RefreshCw className="size-3.5" />
                    {ts("regenerate")}
                  </button>
                  <button
                    type="button"
                    onClick={tryDifferentStyle}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm font-medium hover:bg-zinc-50"
                  >
                    <Shuffle className="size-3.5" />
                    {ts("try_different")}
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-4 text-xs text-zinc-600 space-y-1">
            <p className="text-sm font-semibold text-zinc-700">{ts("how_billing")}</p>
            <p>
              {ts("billing_copy")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Panel({
  step,
  title,
  subtitle,
  children,
}: {
  step: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5">
      <header className="flex items-baseline gap-3 mb-4">
        <span className="inline-flex size-6 items-center justify-center rounded-full bg-zinc-900 text-white text-xs font-semibold">
          {step}
        </span>
        <div>
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          {subtitle ? <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p> : null}
        </div>
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-zinc-700 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-[11px] uppercase tracking-wide text-zinc-500 font-semibold">
        {label}
      </span>
      <span className="text-xs text-zinc-800 font-mono truncate">{value}</span>
    </div>
  );
}
