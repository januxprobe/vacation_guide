'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import type { Restaurant } from '@/types';
import { useTripConfig } from '@/config/trip-context';
import { findCity, getCityBadgeStyle, getCityColor } from '@/lib/city-colors';
import { MapPin, ExternalLink, Trash2, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import FavoriteButton from '@/components/shared/FavoriteButton';

interface RestaurantCardProps {
  restaurant: Restaurant;
  canRemove?: boolean;
  onRemove?: (id: string) => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

const priceLabels: Record<string, string> = {
  '€': 'budget',
  '€€': 'midRange',
  '€€€': 'upscale',
  '€€€€': 'fineDining',
};

export default function RestaurantCard({ restaurant, canRemove, onRemove, isFavorite, onToggleFavorite }: RestaurantCardProps) {
  const t = useTranslations();
  const locale = useLocale() as 'nl' | 'en';
  const config = useTripConfig();
  const city = findCity(config.cities, restaurant.city);
  const cityColor = getCityColor(city);

  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const hasExpandableContent = !!restaurant.description || !!restaurant.specialties;

  const handleRemove = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setRemoving(true);
    onRemove?.(restaurant.id);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* City color bar */}
      <div className="h-1.5" style={{ backgroundColor: cityColor }} />

      <div className="p-4">
        {/* Badges + remove button */}
        <div className="flex flex-wrap gap-2 mb-3 items-start">
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full border"
            style={getCityBadgeStyle(city)}
          >
            {city?.name[locale] ?? restaurant.city}
          </span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
            {restaurant.priceRange} · {t(`restaurants.${priceLabels[restaurant.priceRange]}`)}
          </span>

          {/* Remove button */}
          {canRemove && (
            <div className="ml-auto flex-shrink-0">
              {confirming ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleRemove}
                    disabled={removing}
                    className="px-2 py-0.5 rounded text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {removing ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      t('restaurants.confirmRemove')
                    )}
                  </button>
                  <button
                    onClick={() => setConfirming(false)}
                    disabled={removing}
                    className="px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 transition-colors"
                  >
                    &times;
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleRemove}
                  className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title={t('restaurants.removeRestaurant')}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Name + Favorite */}
        <div className="flex items-start justify-between gap-1">
          <h3 className="text-lg font-bold text-gray-900 mb-1">{restaurant.name}</h3>
          {onToggleFavorite && (
            <FavoriteButton
              isFavorite={isFavorite ?? false}
              onToggle={onToggleFavorite}
            />
          )}
        </div>

        {/* Neighborhood */}
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
          <MapPin className="h-3.5 w-3.5" />
          <span>{restaurant.neighborhood}</span>
        </div>

        {/* Description - collapsed: 2-line clamp, expanded: full */}
        {restaurant.description && (
          <p className={`text-sm text-gray-600 mb-3 ${!expanded ? 'line-clamp-2' : ''}`}>
            {restaurant.description[locale]}
          </p>
        )}

        {/* Expanded content: specialties */}
        {expanded && restaurant.specialties && (
          <div className="mb-3">
            <span className="text-xs font-semibold text-gray-500 uppercase">
              {t('restaurants.specialties')}
            </span>
            <p className="text-sm text-gray-700 mt-0.5">{restaurant.specialties[locale]}</p>
          </div>
        )}

        {/* Show more/less toggle */}
        {hasExpandableContent && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs font-medium mb-3 transition-colors"
            style={{ color: cityColor }}
          >
            {expanded ? (
              <>
                {t('restaurants.showLess')}
                <ChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                {t('restaurants.showMore')}
                <ChevronDown className="w-3 h-3" />
              </>
            )}
          </button>
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
