'use client';

import { useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';

export default function LocaleError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations();

  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-6" />
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        {t('error.title')}
      </h1>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        {t('error.description')}
      </p>
      <div className="flex gap-4 justify-center">
        <button
          onClick={reset}
          className="px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
        >
          {t('error.tryAgain')}
        </button>
        <a
          href="/"
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
        >
          {t('error.backHome')}
        </a>
      </div>
    </div>
  );
}
