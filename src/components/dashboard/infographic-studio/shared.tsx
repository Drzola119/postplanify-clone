"use client";
import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
import {
  renderDocument,
  fontRuns,
  runFont,
  type TextMeasure,
} from "@/lib/infographic-studio/render";
import type { StudioDocument } from "@/lib/infographic-studio/document";
export const button =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-blue-600";
export const primary = `${button} !border-zinc-900 !bg-zinc-900 !text-white hover:!bg-zinc-800`;
export const input =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-2 focus:outline-blue-500";
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public recoveryUrl?: string,
  ) {
    super(message);
  }
}
export async function api<T>(
  url: string,
  body?: unknown,
  method?: string,
): Promise<T> {
  const response = await fetch(url, {
    method: method ?? (body ? "POST" : "GET"),
    credentials: "include",
    cache: "no-store",
    ...(body
      ? {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : {}),
  });
  const data = await response.json();
  if (!response.ok)
    throw new ApiError(
      data.error?.message ?? `Request failed (${response.status})`,
      response.status,
      data.recoveryUrl,
    );
  return data as T;
}
let fontPromise: Promise<string> | undefined;
export function useStudioFonts() {
  const [css, setCss] = useState("");
  useEffect(() => {
    let cancelled = false;
    fontPromise ??= fetch("/api/infographics/fonts")
      .then(async (r) => {
        if (!r.ok) throw new Error("Font loading failed");
        return r.text();
      })
      .catch((e) => {
        fontPromise = undefined;
        throw e;
      });
    void fontPromise
      .then(async (value) => {
        const style = document.createElement("style");
        style.dataset.studioFonts = "true";
        style.textContent = value;
        if (!document.querySelector("style[data-studio-fonts]"))
          document.head.append(style);
        await Promise.all(
          ["StudioSans", "StudioArabic", "StudioSerif"].flatMap((font) =>
            [400, 700].map((weight) =>
              document.fonts.load(`${weight} 28px "${font}"`),
            ),
          ),
        );
        if (!cancelled) setCss(value);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);
  return css;
}
export function Preview({
  document: doc,
  assets = {},
  onSelect,
  className = "",
  report,
  selectedId,
}: {
  document: StudioDocument;
  assets?: Record<string, string>;
  onSelect?: (id: string) => void;
  className?: string;
  report?: boolean;
  selectedId?: string;
}) {
  const css = useStudioFonts();
  const rendered = useMemo(() => {
    let measure: TextMeasure | undefined;
    if (css && typeof window !== "undefined") {
      const ctx = window.document.createElement("canvas").getContext("2d");
      if (ctx)
        measure = (s, size, bold, preference) =>
          fontRuns(s).reduce((n, run) => {
            ctx.font = `${bold ? 700 : 400} ${size}px ${runFont(run, preference)}`;
            return n + ctx.measureText(run).width;
          }, 0);
    }
    return renderDocument(doc, { measure, assets, interactive: !!onSelect, selectedId });
  }, [doc, css, assets, onSelect, selectedId]);
  return (
    <div className={className}>
      <div
        className="[&>svg]:h-auto [&>svg]:w-full [&_g:focus-visible]:outline [&_g:focus-visible]:outline-4 [&_g:focus-visible]:outline-blue-600"
        onKeyDown={e => {
          if (e.key !== "Enter" && e.key !== " ") return;
          const el = (e.target as Element).closest("[data-block-id]");
          if (el && onSelect) { e.preventDefault(); onSelect(el.getAttribute("data-block-id")!); }
        }}
        onClick={(e) => {
          const el = (e.target as Element).closest("[data-block-id]");
          if (el) onSelect?.(el.getAttribute("data-block-id")!);
        }}
        dangerouslySetInnerHTML={{ __html: rendered.svg }}
      />
      {report && !css && (
        <p className="mt-2 text-xs text-amber-700">
          Loading bundled fonts. Final export validates typography again.
        </p>
      )}
      {report && rendered.issues.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-amber-800" role="status">
          {rendered.issues.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const id = useId();
  const control =
    isValidElement<{ "aria-labelledby"?: string }>(children) &&
    typeof children.type === "string" &&
    ["input", "select", "textarea"].includes(children.type)
      ? cloneElement(children, { "aria-labelledby": id })
      : children;
  return (
    <label className="block space-y-1.5 text-xs font-medium text-zinc-600">
      <span id={id}>{label}</span>
      {control}
    </label>
  );
}
