"use client";

/**
 * Carousel Style Picker — M2.
 *
 * Renders the user's saved styles (default + custom) as selectable cards,
 * with a "+ New style" expansion for the Palette Builder form. The picker
 * is purely client-side: validation against the CarouselStyle schema and
 * the WCAG palette-contrast check happens server-side at commit time.
 *
 * Platform design system: zinc/pastel, no gradients on cards, no emoji.
 */

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Check,
  Globe,
  Loader2,
  Plus,
  Palette,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  DEFAULT_CAROUSEL_STYLE,
  LAYOUT_VARIANTS,
} from "@/lib/carousel-gen/styles";
import {
  DISPLAY_FONTS,
  BODY_FONTS,
  loadUserStyles,
  saveUserStyle,
  deleteUserStyle,
  deriveStyleId,
} from "@/lib/carousel-gen/manual-styles";
import {
  HARMONY_OPTIONS,
  buildPaletteVariants,
  type PaletteHarmony,
} from "@/lib/carousel-gen/palette";
import { validatePaletteContrast } from "@/lib/carousel-gen/palette-contrast";
import type { CarouselStyle, LayoutVariant, SlideType } from "@/lib/carousel-gen/types";
import type { BrandAnalysis } from "@/lib/carousel-gen/brand-analyzer";

export interface CarouselStylePickerProps {
  selectedId: string;
  onSelect: (style: CarouselStyle) => void;
}

const STYLE_ROLES: ReadonlyArray<{ id: SlideType; i18n: string }> = [
  { id: "hook", i18n: "layout_role_hook" },
  { id: "stakes", i18n: "layout_role_stakes" },
  { id: "value", i18n: "layout_role_value" },
  { id: "receipts", i18n: "layout_role_receipts" },
  { id: "cta", i18n: "layout_role_cta" },
];

export function CarouselStylePicker({ selectedId, onSelect }: CarouselStylePickerProps) {
  const t = useTranslations("dashboard.carousels.wizard");
  const [userStyles, setUserStyles] = useState(() => loadUserStyles());
  const [building, setBuilding] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    analysis: BrandAnalysis;
    suggestedStyle: CarouselStyle;
    warnings: string[];
  } | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const allStyles = useMemo(() => {
    const userAsCarouselStyle: CarouselStyle[] = userStyles.map((s) => ({
      id: s.id,
      label: s.name,
      colors: s.colors,
      fonts: s.fonts,
      layouts: s.layouts,
      source: "manual" as const,
    }));
    return [DEFAULT_CAROUSEL_STYLE, ...userAsCarouselStyle];
  }, [userStyles]);

  function handleDelete(id: string) {
    deleteUserStyle(id);
    setUserStyles(loadUserStyles());
  }

  return (
    <div className="space-y-3">
      {allStyles.map((style) => {
        const selected = style.id === selectedId;
        return (
          <button
            key={style.id}
            type="button"
            onClick={() => onSelect(style)}
            className={
              "w-full rounded-xl border p-3 text-left transition " +
              (selected
                ? "border-zinc-900 bg-zinc-50 ring-2 ring-zinc-900/10"
                : "border-zinc-200 bg-white hover:border-zinc-300")
            }
          >
            <div className="flex items-center gap-2">
              {selected ? (
                <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white">
                  <Check className="size-3" />
                </span>
              ) : (
                <Palette className="size-4 shrink-0 text-zinc-400" />
              )}
              <p className="flex-1 text-sm font-semibold">{style.label}</p>
              {style.id !== DEFAULT_CAROUSEL_STYLE.id ? (
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={t("style_builder_delete_tooltip")}
                  className="text-zinc-400 hover:text-red-600 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(style.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(style.id);
                    }
                  }}
                >
                  <Trash2 className="size-3.5" />
                </span>
              ) : null}
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <ColorChip label={t("style_chip_background")} hex={style.colors.background} />
              <ColorChip label={t("style_chip_primary")} hex={style.colors.primary} />
              <ColorChip label={t("style_chip_accent")} hex={style.colors.accent} />
              <span className="ms-2 truncate text-[11px] text-zinc-500">
                {style.fonts.display} / {style.fonts.body}
              </span>
            </div>
          </button>
        );
      })}

      {building ? (
        <StyleBuilder
          onCancel={() => setBuilding(false)}
          onSave={(style) => {
            saveUserStyle(style);
            const next = loadUserStyles();
            setUserStyles(next);
            onSelect({
              id: style.id,
              label: style.name,
              colors: style.colors,
              fonts: style.fonts,
              layouts: style.layouts,
              source: "manual",
            });
            setBuilding(false);
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setBuilding(true)}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-300 bg-white p-3 text-sm font-medium text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50"
        >
          <Plus className="size-4" />
          {t("style_new_button")}
        </button>
      )}

      <BrandAnalyzerPanel
        analyzing={analyzing}
        result={analysisResult}
        error={analysisError}
        onAnalyze={async (input) => {
          setAnalyzing(true);
          setAnalysisError(null);
          try {
            const res = await fetch("/api/carousels/brand-analyze", {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(input),
            });
            if (!res.ok) {
              const data = (await res.json().catch(() => ({}))) as {
                error?: { message?: string };
              };
              setAnalysisError(
                data.error?.message ?? `Analyze failed (${res.status})`
              );
              setAnalysisResult(null);
              return;
            }
            const data = (await res.json()) as {
              analysis: BrandAnalysis;
              suggestedStyle: CarouselStyle;
              warnings: string[];
            };
            setAnalysisResult(data);
          } catch (err) {
            setAnalysisError(err instanceof Error ? err.message : "Analyze failed");
          } finally {
            setAnalyzing(false);
          }
        }}
        onApply={(suggestedStyle) => {
          setAnalysisResult(null);
          setBuilding(true);
          seedBuilderFromAnalysis(suggestedStyle.colors, suggestedStyle.fonts);
        }}
      />
    </div>
  );
}

/**
 * Bridge between the Brand Analyzer panel and the StyleBuilder panel.
 * The builder keeps its own local state, so to pre-fill it we stash the
 * analyzed values in a module-level ref and the builder reads on mount.
 */
let __builderSeed:
  | {
      colors: CarouselStyle["colors"];
      fonts: CarouselStyle["fonts"];
    }
  | null = null;

function seedBuilderFromAnalysis(
  colors: CarouselStyle["colors"],
  fonts: CarouselStyle["fonts"]
) {
  __builderSeed = { colors, fonts };
}

function consumeBuilderSeed() {
  const seed = __builderSeed;
  __builderSeed = null;
  return seed;
}

function ColorChip({ label, hex }: { label: string; hex: string }) {
  return (
    <span
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-zinc-200"
      style={{ backgroundColor: hex }}
      title={`${label}: ${hex}`}
      aria-label={`${label} ${hex}`}
    />
  );
}

interface StyleBuilderProps {
  onSave: (style: import("@/lib/carousel-gen/manual-styles").SavedCarouselStyle) => void;
  onCancel: () => void;
}

/**
 * The palette + fonts + layouts form. Drives the palette math live so the
 * user sees the 4 swatch variants recompute as soon as they change the
 * base color or harmony. Saves to localStorage on submit and lifts the
 * resolved CarouselStyle back up via onSave.
 */
function StyleBuilder({ onSave, onCancel }: StyleBuilderProps) {
  const t = useTranslations("dashboard.carousels.wizard");

  // If M3 seeded us with an analyzed palette, use those colors / fonts
  // directly (no harmony math) and surface a small "from brand analysis"
  // badge so the user knows what they're working with.
  const seed = consumeBuilderSeed();

  const [baseColor, setBaseColor] = useState(seed?.colors.primary ?? "#4f46e5");
  const [harmony, setHarmony] = useState<PaletteHarmony>("complementary");
  const [displayFont, setDisplayFont] = useState(
    seed?.fonts.display ?? DISPLAY_FONTS[0].value
  );
  const [bodyFont, setBodyFont] = useState(seed?.fonts.body ?? BODY_FONTS[0].value);
  const [name, setName] = useState("");
  const [variantIndex, setVariantIndex] = useState(0);
  const [layouts, setLayouts] = useState<CarouselStyle["layouts"]>(
    DEFAULT_CAROUSEL_STYLE.layouts
  );
  const [seededColors, setSeededColors] = useState(seed?.colors ?? null);

  const variants = useMemo(() => {
    if (seededColors) {
      return [
        {
          primary: seededColors.primary,
          background: seededColors.background,
          accent: seededColors.accent,
          label: t("brand_analyzer_seeded_badge"),
        },
      ];
    }
    return buildPaletteVariants(baseColor, harmony);
  }, [baseColor, harmony, seededColors, t]);
  const active = variants[variantIndex] ?? variants[0];

  function updateLayout(role: SlideType, variant: LayoutVariant) {
    setLayouts((prev) => ({ ...prev, [role]: variant }));
  }

  function handleSubmit() {
    if (!name.trim()) return;
    if (!active) return;
    const style = {
      id: deriveStyleId({ name: name.trim(), colors: active }),
      label: name.trim(),
      name: name.trim(),
      savedAt: Date.now(),
      colors: {
        primary: active.primary,
        background: active.background,
        accent: active.accent,
      },
      fonts: { display: displayFont, body: bodyFont },
      layouts,
      source: "manual" as const,
    };
    onSave(style);
  }

  // Run the server-side contrast check locally too so the user sees
  // warnings before submitting. Mirrors the rule the API enforces at
  // commit time.
  const contrastWarnings = active
    ? validatePaletteContrast({
        id: "preview",
        label: name || "preview",
        colors: {
          primary: active.primary,
          background: active.background,
          accent: active.accent,
        },
        fonts: { display: displayFont, body: bodyFont },
        layouts,
        source: "manual",
      })
    : [];

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-3">
      <header className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{t("style_builder_title")}</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {t("style_builder_subtitle")}
          </p>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onCancel}
          className="text-zinc-400 hover:text-zinc-700"
        >
          <X className="size-4" />
        </button>
      </header>

      {/* Base color + harmony. In "seeded from analysis" mode the harmony
          section is replaced with per-color editors so the user can tweak
          each role without a harmony computation. */}
      {seededColors ? (
        <div>
          <span className="mb-1.5 flex items-center justify-between text-xs font-semibold text-zinc-700">
            <span>{t("brand_analyzer_palette_label")}</span>
            <button
              type="button"
              className="text-[11px] font-medium text-zinc-500 hover:text-zinc-700"
              onClick={() => {
                setSeededColors(null);
                // Re-anchor the harmony math on the analyzed primary.
                setBaseColor(seededColors.primary);
              }}
            >
              {t("brand_analyzer_switch_to_palette")}
            </button>
          </span>
          <div className="grid gap-2 sm:grid-cols-3">
            <ColorEditor
              label={t("style_chip_background")}
              value={seededColors.background}
              onChange={(hex) =>
                setSeededColors({ ...seededColors, background: hex })
              }
            />
            <ColorEditor
              label={t("style_chip_primary")}
              value={seededColors.primary}
              onChange={(hex) =>
                setSeededColors({ ...seededColors, primary: hex })
              }
            />
            <ColorEditor
              label={t("style_chip_accent")}
              value={seededColors.accent}
              onChange={(hex) =>
                setSeededColors({ ...seededColors, accent: hex })
              }
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="block text-xs font-semibold text-zinc-700 mb-1.5">
              {t("style_builder_base_color_label")}
            </span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={baseColor}
                onChange={(e) => {
                  setBaseColor(e.target.value);
                  setVariantIndex(0);
                }}
                className="h-9 w-12 cursor-pointer rounded-md border border-zinc-200 bg-white p-0.5"
              />
              <input
                type="text"
                value={baseColor}
                onChange={(e) => {
                  const next = e.target.value;
                  if (/^#[0-9a-fA-F]{6}$/.test(next)) {
                    setBaseColor(next);
                    setVariantIndex(0);
                  }
                }}
                className="h-9 flex-1 rounded-md border border-zinc-200 bg-white px-3 text-sm font-mono"
              />
            </div>
          </label>
          <label className="block">
            <span className="block text-xs font-semibold text-zinc-700 mb-1.5">
              {t("style_builder_harmony_label")}
            </span>
            <select
              value={harmony}
              onChange={(e) => {
                setHarmony(e.target.value as PaletteHarmony);
                setVariantIndex(0);
              }}
              className="w-full h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm"
            >
              {HARMONY_OPTIONS.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-zinc-500">
              {HARMONY_OPTIONS.find((h) => h.id === harmony)?.description}
            </p>
          </label>
        </div>
      )}

      {/* Fonts */}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="block text-xs font-semibold text-zinc-700 mb-1.5">
            {t("style_builder_display_font_label")}
          </span>
          <select
            value={displayFont}
            onChange={(e) => setDisplayFont(e.target.value)}
            className="w-full h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm"
          >
            {DISPLAY_FONTS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-xs font-semibold text-zinc-700 mb-1.5">
            {t("style_builder_body_font_label")}
          </span>
          <select
            value={bodyFont}
            onChange={(e) => setBodyFont(e.target.value)}
            className="w-full h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm"
          >
            {BODY_FONTS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Per-slide layout pickers */}
      <div>
        <span className="block text-xs font-semibold text-zinc-700 mb-1.5">
          {t("style_builder_layouts_label")}
        </span>
        <div className="grid gap-2 sm:grid-cols-5">
          {STYLE_ROLES.map((role) => (
            <label key={role.id} className="block">
              <span className="block text-[10px] font-medium text-zinc-500 mb-0.5">
                {t(role.i18n)}
              </span>
              <select
                value={layouts[role.id].id}
                onChange={(e) => {
                  const picked = LAYOUT_VARIANTS.find((v) => v.id === e.target.value);
                  if (picked) updateLayout(role.id, picked);
                }}
                className="w-full h-8 px-2 rounded-md border border-zinc-200 bg-white text-xs"
              >
                {LAYOUT_VARIANTS.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </div>

      {/* 4 palette variants — clickable chips. Hidden in seeded mode
          because there's only one option (the analyzed palette). */}
      {variants.length > 1 ? (
        <div>
          <span className="block text-xs font-semibold text-zinc-700 mb-1.5">
            {t("style_builder_variant_label")}
          </span>
          <div className="grid gap-2 sm:grid-cols-2">
            {variants.map((v, i) => (
              <button
                key={`${v.label}-${i}`}
                type="button"
                onClick={() => setVariantIndex(i)}
                className={
                  "rounded-md border p-2 text-left transition " +
                  (i === variantIndex
                    ? "border-zinc-900 bg-zinc-50 ring-2 ring-zinc-900/10"
                    : "border-zinc-200 bg-white hover:border-zinc-300")
                }
              >
                <div className="flex items-center gap-1">
                  <span
                    className="inline-block size-4 rounded border border-zinc-300"
                    style={{ backgroundColor: v.background }}
                  />
                  <span
                    className="inline-block size-4 rounded border border-zinc-300"
                    style={{ backgroundColor: v.primary }}
                  />
                  <span
                    className="inline-block size-4 rounded border border-zinc-300"
                    style={{ backgroundColor: v.accent }}
                  />
                  <span className="ms-1 text-[11px] text-zinc-600">{v.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Live preview */}
      {active ? (
        <div
          className="rounded-md border border-zinc-200 p-4"
          style={{ backgroundColor: active.background }}
        >
          <p
            className="text-base font-extrabold leading-tight"
            style={{
              color: active.primary,
              fontFamily: `"${displayFont}", "Helvetica Neue", Arial, sans-serif`,
            }}
          >
            Aa Bb Cc 123
          </p>
          <p
            className="mt-1 text-xs"
            style={{
              color: active.primary,
              fontFamily: `"${bodyFont}", "Helvetica Neue", Arial, sans-serif`,
              opacity: 0.75,
            }}
          >
            Supporting line in the body font
          </p>
          <p
            className="mt-2 text-[10px]"
            style={{
              color: active.accent,
              fontFamily: `"${displayFont}", "Helvetica Neue", Arial, sans-serif`,
            }}
          >
            Accent colour · a small emphasis only
          </p>
          <p className="mt-2 text-[10px] text-zinc-500">
            {t("style_preview_hint")}
          </p>
        </div>
      ) : null}

      {contrastWarnings.length > 0 ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-800">
          {t("style_builder_validation_failed")}
          <ul className="mt-1 list-disc pl-4">
            {contrastWarnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Name + actions */}
      <label className="block">
        <span className="block text-xs font-semibold text-zinc-700 mb-1.5">
          {t("style_builder_name_label")}
        </span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("style_builder_name_placeholder")}
          className="w-full h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm"
        />
      </label>
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-9 items-center rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium hover:bg-zinc-50"
        >
          {t("style_builder_cancel_button")}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!name.trim() || contrastWarnings.length > 0}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-zinc-900 px-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          <Check className="size-3.5" />
          {t("style_builder_save_button")}
        </button>
      </div>
    </div>
  );
}

function ColorEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-medium text-zinc-500">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 shrink-0 cursor-pointer rounded-md border border-zinc-200 bg-white p-0.5"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const next = e.target.value;
            if (/^#[0-9a-fA-F]{6}$/.test(next)) onChange(next);
          }}
          className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs font-mono"
        />
      </div>
    </label>
  );
}

interface BrandAnalyzerPanelProps {
  analyzing: boolean;
  result: {
    analysis: BrandAnalysis;
    suggestedStyle: CarouselStyle;
    warnings: string[];
  } | null;
  error: string | null;
  onAnalyze: (input: { url?: string; imageDataUrl?: string }) => void | Promise<void>;
  onApply: (suggestedStyle: CarouselStyle) => void;
}

/**
 * M3 URL → palette extraction + M4 screenshot → palette (vision).
 * The user clicks "Apply" to lift the suggested palette into the manual
 * builder with confidence badges still attached so they know which
 * fields to trust.
 */
function BrandAnalyzerPanel({
  analyzing,
  result,
  error,
  onAnalyze,
  onApply,
}: BrandAnalyzerPanelProps) {
  const t = useTranslations("dashboard.carousels.wizard");
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState<"url" | "image">("url");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  function handleAnalyze() {
    if (mode === "url") {
      const trimmed = url.trim();
      if (trimmed) void onAnalyze({ url: trimmed });
    } else if (imageDataUrl) {
      void onAnalyze({ imageDataUrl });
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="flex items-start gap-2">
        <div className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
          <Globe className="size-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">
            {t("brand_analyzer_title")}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {t("brand_analyzer_subtitle")}
          </p>
        </div>
      </div>

      {/* M4: tabbed mode. URL is the default; screenshot requires a
          manual upload until we can wire Playwright for automatic
          full-page capture (out of scope for this pass). */}
      <div className="mt-3 inline-flex rounded-md border border-zinc-200 bg-zinc-50 p-0.5 text-xs">
        <button
          type="button"
          onClick={() => setMode("url")}
          className={
            "rounded-sm px-2.5 py-1 font-medium " +
            (mode === "url"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-600 hover:text-zinc-900")
          }
        >
          {t("brand_analyzer_mode_url")}
        </button>
        <button
          type="button"
          onClick={() => setMode("image")}
          className={
            "rounded-sm px-2.5 py-1 font-medium " +
            (mode === "image"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-600 hover:text-zinc-900")
          }
        >
          {t("brand_analyzer_mode_image")}
        </button>
      </div>

      {mode === "url" ? (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t("brand_analyzer_url_placeholder")}
            className="h-9 flex-1 rounded-md border border-zinc-200 bg-white px-3 text-sm"
          />
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={analyzing || !url.trim()}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-zinc-900 px-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {analyzing ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            {analyzing ? t("brand_analyzer_analyzing") : t("brand_analyzer_button")}
          </button>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {imageDataUrl ? (
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageDataUrl}
                alt=""
                className="h-12 w-20 rounded-md border border-zinc-200 object-cover"
              />
              <span className="flex-1 truncate text-[11px] text-zinc-500">
                {t("brand_analyzer_image_ready")}
              </span>
              <button
                type="button"
                onClick={() => setImageDataUrl(null)}
                className="text-zinc-400 hover:text-red-600"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <>
              <label className="block">
                <span className="sr-only">{t("brand_analyzer_image_label")}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 3_500_000) {
                      setImageError(
                        "Image too large (max ~3.3MB). Try a smaller PNG."
                      );
                      return;
                    }
                    setImageError(null);
                    const reader = new FileReader();
                    reader.onload = () => {
                      const result = reader.result;
                      if (typeof result === "string") setImageDataUrl(result);
                    };
                    reader.readAsDataURL(file);
                  }}
                  className="block w-full cursor-pointer rounded-md border border-dashed border-zinc-300 bg-white px-3 py-2 text-xs file:me-3 file:rounded file:border-0 file:bg-zinc-900 file:px-3 file:py-1 file:text-white"
                />
              </label>
              {imageError ? (
                <p className="text-[11px] text-red-600">{imageError}</p>
              ) : null}
            </>
          )}
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={analyzing || !imageDataUrl}
            className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-zinc-900 px-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {analyzing ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            {analyzing ? t("brand_analyzer_analyzing") : t("brand_analyzer_button")}
          </button>
        </div>
      )}

      {error ? (
        <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="mt-3 space-y-2">
          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-2.5">
            <div className="flex items-center gap-1.5">
              <ColorChip label="bg" hex={result.suggestedStyle.colors.background} />
              <ColorChip label="primary" hex={result.suggestedStyle.colors.primary} />
              <ColorChip label="accent" hex={result.suggestedStyle.colors.accent} />
              <span className="ms-2 truncate text-[11px] text-zinc-600">
                {result.suggestedStyle.fonts.display} / {result.suggestedStyle.fonts.body}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <ConfidenceBadge label="Primary" value={result.analysis.confidence.primary} />
              <ConfidenceBadge label="Background" value={result.analysis.confidence.background} />
              <ConfidenceBadge label="Accent" value={result.analysis.confidence.accent} />
              <ConfidenceBadge label="Display font" value={result.analysis.confidence.displayFont} />
              <ConfidenceBadge label="Body font" value={result.analysis.confidence.bodyFont} />
            </div>
            {result.warnings.length > 0 ? (
              <ul className="mt-2 list-disc space-y-0.5 pl-4 text-[11px] text-amber-700">
                {result.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => onApply(result.suggestedStyle)}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700"
          >
            <Sparkles className="size-3.5" />
            {t("brand_analyzer_apply_button")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ConfidenceBadge({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  const tone =
    pct >= 70
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : pct >= 40
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-zinc-200 bg-zinc-50 text-zinc-600";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${tone}`}
    >
      {label}
      <span className="font-mono">{pct}%</span>
    </span>
  );
}
