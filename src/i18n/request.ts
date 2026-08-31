import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import type { UiLocale } from "@/lib/i18n/types";

const SUPPORTED: UiLocale[] = ["en", "fr", "ar"];

function normalize(value: string | undefined): UiLocale {
  return SUPPORTED.includes(value as UiLocale) ? (value as UiLocale) : "en";
}

export default getRequestConfig(async () => {
  const store = await cookies();
  const locale = normalize(store.get("ui-locale")?.value);

  const base = (await import(`../../messages/${locale}.json`)).default;
  // Optional per-feature split files (e.g. en.video-studio.json) are merged if present
  let extra: Record<string, unknown> = {};
  try {
    extra = (await import(`../../messages/${locale}.video-studio.json`)).default;
  } catch {
    // split file not present for this locale — ignore
  }
  const messages = { ...base, ...extra };
  return {
    locale,
    messages,
  };
});
