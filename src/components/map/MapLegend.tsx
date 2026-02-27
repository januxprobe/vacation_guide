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
            <div
              className="w-5 h-5 rounded border-2 flex items-center justify-center"
              style={{
                borderColor: city.color,
                backgroundColor: '#f3f4f6',
              }}
            >
              <span
                className="text-[8px] font-bold"
                style={{ color: city.color }}
              >
                1
              </span>
            </div>
            <span className="text-gray-700">{city.name[locale]}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 pt-1 border-t border-gray-200">
          <div className="w-5 h-5 flex items-center justify-center">
            <span className="text-sm">🍽</span>
          </div>
          <span className="text-gray-700">{t('map.meals')}</span>
        </div>
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="8" fill="#6b7280" stroke="white" strokeWidth="2" opacity="0.85" />
            <text x="10" y="14" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">R</text>
          </svg>
          <span className="text-gray-700">{t('restaurants.title')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-0.5 bg-gray-500 rounded" />
          <span className="text-gray-700">{t('map.walkingRoute')}</span>
        </div>
      </div>
    </div>
  );
}
