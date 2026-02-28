'use client';

import { MapPin } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

export default function NotFound() {
  const locale = useLocale();
  const t = useTranslations('notFound');

  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-6" />
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        {t('title')}
      </h1>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        {t('description')}
      </p>
      <a
        href={`/${locale}`}
        className="inline-block px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
      >
        {t('backToTrips')}
      </a>
    </div>
  );
}
