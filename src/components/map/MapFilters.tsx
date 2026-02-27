'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useTripConfig } from '@/config/trip-context';
import { getCityColor, hexToRgba } from '@/lib/city-colors';

interface MapFiltersProps {
  selectedCity: string;
  selectedDay: number | 'all';
  showRestaurants: boolean;
  showRoute: boolean;
  totalDays: number;
  onCityChange: (city: string) => void;
  onDayChange: (day: number | 'all') => void;
  onRestaurantToggle: () => void;
  onRouteToggle: () => void;
}

export default function MapFilters({
  selectedCity,
  selectedDay,
  showRestaurants,
  showRoute,
  totalDays,
  onCityChange,
  onDayChange,
  onRestaurantToggle,
  onRouteToggle,
}: MapFiltersProps) {
  const t = useTranslations();
  const locale = useLocale() as 'nl' | 'en';
  const config = useTripConfig();

  return (
    <div className="space-y-3">
      {/* City filter */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1.5 block">
          {t('map.filterByCity')}
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
            {t('map.allCities')}
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

      {/* Day filter */}
      {totalDays > 0 && (
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">
            {t('map.filterByDay')}
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onDayChange('all')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedDay === 'all'
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('map.allDays')}
            </button>
            {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => (
              <button
                key={day}
                onClick={() => onDayChange(day)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedDay === day
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('map.day', { number: day })}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Toggle buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onRestaurantToggle}
          data-testid="restaurant-toggle"
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            showRestaurants
              ? 'bg-amber-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {showRestaurants ? t('map.hideRestaurants') : t('map.showRestaurants')}
        </button>
        {selectedDay !== 'all' && (
          <button
            onClick={onRouteToggle}
            data-testid="route-toggle"
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              showRoute
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {showRoute ? t('map.hideRoute') : t('map.showRoute')}
          </button>
        )}
      </div>
    </div>
  );
}
