import { describe, it, expect, vi } from 'vitest';

// Mock next-intl
let mockLocale = 'nl';
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => mockLocale,
}));

// Must import after mocking
const { default: AttractionSuggestion } = await import(
  '@/components/trip-creator/AttractionSuggestion'
);

// Helper to get the resolved description text from the component's render
// We test the logic that picks the right language, not the full React render
import { resolveLocalizedField } from '@/lib/locale-utils';

describe('resolveLocalizedField', () => {
  it('returns nl string from bilingual object when locale is nl', () => {
    const field = { nl: 'Nederlandse tekst', en: 'English text' };
    expect(resolveLocalizedField(field, 'nl')).toBe('Nederlandse tekst');
  });

  it('returns en string from bilingual object when locale is en', () => {
    const field = { nl: 'Nederlandse tekst', en: 'English text' };
    expect(resolveLocalizedField(field, 'en')).toBe('English text');
  });

  it('returns plain string as-is regardless of locale', () => {
    expect(resolveLocalizedField('Just a string', 'nl')).toBe('Just a string');
    expect(resolveLocalizedField('Just a string', 'en')).toBe('Just a string');
  });

  it('falls back to other language when preferred is missing', () => {
    const nlOnly = { nl: 'Alleen Nederlands' };
    expect(resolveLocalizedField(nlOnly, 'en')).toBe('Alleen Nederlands');

    const enOnly = { en: 'English only' };
    expect(resolveLocalizedField(enOnly, 'nl')).toBe('English only');
  });

  it('returns undefined for undefined input', () => {
    expect(resolveLocalizedField(undefined, 'nl')).toBeUndefined();
  });

  it('returns undefined for null input', () => {
    expect(resolveLocalizedField(null, 'en')).toBeUndefined();
  });

  it('returns empty string for empty string input', () => {
    expect(resolveLocalizedField('', 'nl')).toBe('');
  });

  it('returns empty string for object with empty strings', () => {
    expect(resolveLocalizedField({ nl: '', en: '' }, 'nl')).toBe('');
  });
});
