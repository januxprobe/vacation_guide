/**
 * Resolves a field that can be either a plain string or a bilingual { nl, en } object
 * to a single string in the user's preferred locale.
 *
 * Used by components that display data from the AI chat (which sends single-language strings)
 * and from saved trip data (which stores bilingual objects).
 */
export function resolveLocalizedField(
  field: string | { nl?: string; en?: string } | null | undefined,
  locale: string,
): string | undefined {
  if (field === null || field === undefined) return undefined;
  if (typeof field === 'string') return field;

  const preferred = locale === 'nl' ? field.nl : field.en;
  if (preferred !== undefined) return preferred;

  // Fall back to whichever language is available
  return field.nl ?? field.en;
}
