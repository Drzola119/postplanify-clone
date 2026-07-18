import type { ProviderId } from './types';
import type { OutputLanguage } from '../i18n/types';

/**
 * ARABIC CAPABLE PROVIDERS — Single source of truth.
 *
 * This array is intentionally left EMPTY until the developer manually
 * reviews the PNG outputs in test-output/language-comparison/ after
 * running: npm run test:language-output
 *
 * To enable Arabic for a provider after a passing visual review, add
 * its ProviderId string here, e.g. 'ideogram-4'.
 *
 * Both the Zod validation layer (image-gen.ts) and the router fallback
 * chain (router.ts) import this array — it is the ONLY place to update.
 *
 * TODO: populate after Phase 2 test run and manual image review.
 */
export const ARABIC_CAPABLE_PROVIDERS: ProviderId[] = [];

export function isProviderArabicCapable(providerId: ProviderId): boolean {
  return ARABIC_CAPABLE_PROVIDERS.includes(providerId);
}

export function getLanguageDirective(lang: OutputLanguage): string {
  switch (lang) {
    case 'en':
      return 'Render all on-image text in English.';
    case 'fr':
      return (
        'Render all on-image text in French, including correct accents ' +
        'and diacritics (é, à, ç, œ, etc.). Do not substitute accented ' +
        'characters with plain ASCII equivalents.'
      );
    case 'ar':
      return (
        'Render all on-image text in Modern Standard Arabic (فصحى), ' +
        'right-to-left script, with correctly shaped and joined letterforms. ' +
        'Use only Unicode Arabic block characters (U+0600–U+06FF). ' +
        'Do not substitute Arabic letters with Latin lookalikes, decorative ' +
        'glyphs, or symbolic characters. The text must be legible, ' +
        'machine-readable Arabic script.'
      );
  }
}
