import type { UiLocale } from "@/lib/i18n/types";

/**
 * Locale configuration for type safety only.
 *
 * This project resolves the active UI locale from the "ui-locale" cookie
 * and the user's Firestore profile field — NOT from URL segments. There
 * is intentionally NO [locale] dynamic route segment and NO locale-based
 * middleware redirect anywhere under src/app/.
 */
export const locales: UiLocale[] = ["en", "fr", "ar"];
export const defaultLocale: UiLocale = "en";
