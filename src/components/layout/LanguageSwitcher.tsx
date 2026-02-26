'use client';

import { useLocale } from 'next-intl';
import { usePathname } from '@/i18n/routing';
import { routing } from '@/i18n/routing';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: string) => {
    // Get the current path segments
    const segments = window.location.pathname.split('/').filter(Boolean);

    // Replace the locale segment (first segment)
    if (segments.length > 0 && routing.locales.includes(segments[0] as any)) {
      segments[0] = newLocale;
    } else {
      segments.unshift(newLocale);
    }

    // Build the new URL
    const newPath = '/' + segments.join('/');

    // Force a full page reload to the new locale
    window.location.href = newPath;
  };

  return (
    <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
      {routing.locales.map((loc) => (
        <button
          key={loc}
          onClick={() => handleLocaleChange(loc)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            locale === loc
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {loc.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
