"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { LOCALE_LABELS, type UiLocale } from "@/lib/i18n/types";

const ORDER: UiLocale[] = ["en", "fr", "ar"];

/**
 * Global UI language switcher.
 *
 * On selection it:
 *   1. Writes the "ui-locale" cookie (1 year, sameSite lax).
 *   2. Persists the choice to the user's Firestore doc via /api/settings/locale.
 *   3. Calls router.refresh() so the root layout re-renders with the new
 *      <html lang>/<html dir> without a full page reload.
 *
 * This controls the INTERFACE language ONLY. It has nothing to do with the
 * infographic Output Language selected inside the wizard.
 */
function getActiveCookieLocale(): UiLocale {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(/(?:^|;\s*)ui-locale=([^;]+)/);
  const val = match?.[1] as UiLocale | undefined;
  return val && ORDER.includes(val) ? val : "en";
}

export function LocaleSwitcher() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<UiLocale>(() => getActiveCookieLocale());

  async function select(locale: UiLocale) {
    setOpen(false);
    setCurrent(locale);

    // 1. Cookie — runtime source of truth for rendering.
    // eslint-disable-next-line react-hooks/immutability
    document.cookie = [
      `ui-locale=${locale}`,
      "max-age=31536000",
      "path=/",
      "sameSite=lax",
    ].join("; ");

    // 2. Firestore durable backup (best-effort; ignore failures).
    try {
      await fetch("/api/settings/locale", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
    } catch {
      /* non-blocking */
    }

    // 3. Re-render layout with new locale.
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-zinc-200 bg-white text-xs font-medium text-zinc-700 hover:bg-zinc-50"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Interface language"
      >
        <Globe className="size-3.5 text-zinc-500" />
        <span>{LOCALE_LABELS[current]}</span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute end-0 top-full mt-1 z-50 w-40 rounded-md border border-zinc-200 bg-white shadow-lg py-1"
        >
          {ORDER.map((loc) => (
            <button
              key={loc}
              type="button"
              role="menuitem"
              onClick={() => select(loc)}
              className={
                "flex w-full items-center justify-between px-3 py-1.5 text-start text-sm " +
                (loc === current
                  ? "font-semibold text-zinc-900 bg-zinc-50"
                  : "text-zinc-700 hover:bg-zinc-50")
              }
            >
              <span>{LOCALE_LABELS[loc]}</span>
              {loc === current ? <span className="text-zinc-900">✓</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
