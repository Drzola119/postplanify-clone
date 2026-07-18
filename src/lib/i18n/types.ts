export type UiLocale = 'en' | 'fr' | 'ar';
export type OutputLanguage = 'en' | 'fr' | 'ar';
export type TextDirection = 'ltr' | 'rtl';

export function getLocaleDir(locale: UiLocale): TextDirection {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

export function getLocaleLang(locale: UiLocale): string {
  const map: Record<UiLocale, string> = { en: 'en', fr: 'fr', ar: 'ar' };
  return map[locale];
}

export const LOCALE_LABELS: Record<UiLocale, string> = {
  en: 'English',
  fr: 'Français',
  ar: 'العربية',
};

export const OUTPUT_LANGUAGE_LABELS: Record<OutputLanguage, string> = {
  en: 'English',
  fr: 'Français',
  ar: 'العربية',
};
