'use client';

import { useTranslations, useLocale } from 'next-intl';
import type { Restaurant } from '@/types';
import { useTripConfig } from '@/config/trip-context';
import { findCity, getCityBadgeStyle, getCityColor } from '@/lib/city-colors';
import { MapPin, ExternalLink } from 'lucide-react';

interface RestaurantCardProps {
  restaurant: Restaurant;
}

const priceLabels: Record<string, string> = {
  '€': 'budget',
  '€€': 'midRange',
  '€€€': 'upscale',
  '€€€€': 'fineDining',
};

export default function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const t = useTranslations();
  const locale = useLocale() as 'nl' | 'en';
  const config = useTripConfig();
  const city = findCity(config.cities, restaurant.city);
  const cityColor = getCityColor(city);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* City color bar */}
      <div className="h-1.5" style={{ backgroundColor: cityColor }} />

      <div className="p-4">
        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full border"
            style={getCityBadgeStyle(city)}
          >
            {city?.name[locale] ?? restaurant.city}
          </span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
            {restaurant.priceRange} · {t(`restaurants.${priceLabels[restaurant.priceRange]}`)}
          </span>
        </div>

        {/* Name */}
        <h3 className="text-lg font-bold text-gray-900 mb-1">{restaurant.name}</h3>

        {/* Neighborhood */}
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
          <MapPin className="h-3.5 w-3.5" />
          <span>{restaurant.neighborhood}</span>
        </div>

        {/* Description */}
        {restaurant.description && (
          <p className="text-sm text-gray-600 mb-3">{restaurant.description[locale]}</p>
        )}

        {/* Specialties */}
        {restaurant.specialties && (
          <div className="mb-3">
            <span className="text-xs font-semibold text-gray-500 uppercase">
              {t('restaurants.specialties')}
            </span>
            <p className="text-sm text-gray-700 mt-0.5">{restaurant.specialties[locale]}</p>
          </div>
        )}

        {/* Cuisine tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {restaurant.cuisine.map((c) => (
            <span
              key={c}
              className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
            >
              {c}
            </span>
          ))}
        </div>

        {/* Website link */}
        {restaurant.website && (
          <a
            href={restaurant.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
            style={{ color: cityColor }}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t('restaurants.visitWebsite')}
          </a>
        )}
      </div>
    </div>
  );
}
