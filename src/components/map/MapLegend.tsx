'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useTripConfig } from '@/config/trip-context';

export default function MapLegend() {
  const t = useTranslations();
  const locale = useLocale() as 'nl' | 'en';
  const config = useTripConfig();

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-3 text-sm">
      <div className="font-semibold text-gray-800 mb-2">{t('map.legend')}</div>
      <div className="space-y-1.5">
        {config.cities.map((city) => (
          <div key={city.id} className="flex items-center gap-2">
            <svg width="16" height="22" viewBox="0 0 28 40">
              <path
                d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z"
                fill={city.color}
                stroke="white"
                strokeWidth="2"
              />
              <circle cx="14" cy="14" r="6" fill="white" opacity="0.9" />
            </svg>
            <span className="text-gray-700">{city.name[locale]}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 pt-1 border-t border-gray-200">
          <svg width="16" height="16" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="8" fill="#6b7280" stroke="white" strokeWidth="2" opacity="0.85" />
            <text x="10" y="14" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">R</text>
          </svg>
          <span className="text-gray-700">{t('restaurants.title')}</span>
        </div>
      </div>
    </div>
  );
}
