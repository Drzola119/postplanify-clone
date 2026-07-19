import type { ProviderId } from './types';
import type { OutputLanguage } from '../i18n/types';

/**
 * ARABIC CAPABLE PROVIDERS — Single source of truth.
 *
 * ideogram-4 has been verified to correctly render Arabic script
 * (Modern Standard Arabic, right-to-left, correctly joined letterforms).
 * Other providers may be added after manual visual review.
 */
export const ARABIC_CAPABLE_PROVIDERS: ProviderId[] = ["ideogram-4"];

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
