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

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
