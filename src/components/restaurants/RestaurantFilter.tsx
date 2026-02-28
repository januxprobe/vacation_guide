'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useTripConfig } from '@/config/trip-context';
import { getCityColor, hexToRgba } from '@/lib/city-colors';

interface RestaurantFilterProps {
  selectedCity: string;
  selectedPrice: string;
  onCityChange: (city: string) => void;
  onPriceChange: (price: string) => void;
  availableCuisines?: string[];
  selectedCuisine?: string;
  onCuisineChange?: (cuisine: string) => void;
}

const priceRanges = ['all', '€', '€€', '€€€', '€€€€'] as const;
const priceLabels: Record<string, string> = {
  '€': 'budget',
  '€€': 'midRange',
  '€€€': 'upscale',
  '€€€€': 'fineDining',
};

export default function RestaurantFilter({
  selectedCity,
  selectedPrice,
  onCityChange,
  onPriceChange,
  availableCuisines,
  selectedCuisine,
  onCuisineChange,
}: RestaurantFilterProps) {
  const t = useTranslations();
  const locale = useLocale() as 'nl' | 'en';
  const config = useTripConfig();

  return (
    <div className="space-y-4">
      {/* City filter */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          {t('restaurants.filterByCity')}
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onCityChange('all')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedCity === 'all'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('restaurants.allRestaurants')}
          </button>
          {config.cities.map((city) => {
            const isSelected = selectedCity === city.id;
            const color = getCityColor(city);
            return (
              <button
                key={city.id}
                onClick={() => onCityChange(city.id)}
                className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
                style={
                  isSelected
                    ? { backgroundColor: color, color: 'white' }
                    : { backgroundColor: hexToRgba(color, 0.08), color }
                }
              >
                {city.name[locale]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price filter */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          {t('restaurants.filterByPrice')}
        </label>
        <div className="flex flex-wrap gap-2">
          {priceRanges.map((p) => (
            <button
              key={p}
              onClick={() => onPriceChange(p)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedPrice === p
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {p === 'all' ? t('restaurants.allPrices') : `${p} ${t(`restaurants.${priceLabels[p]}`)}`}
            </button>
          ))}
        </div>
      </div>

      {/* Cuisine filter */}
      {availableCuisines && availableCuisines.length > 0 && onCuisineChange && (
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            {t('restaurants.filterByCuisine')}
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onCuisineChange('all')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCuisine === 'all'
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('restaurants.allCuisines')}
            </button>
            {availableCuisines.map((cuisine) => (
              <button
                key={cuisine}
                onClick={() => onCuisineChange(cuisine)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCuisine === cuisine
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cuisine}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
