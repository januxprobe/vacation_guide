'use client';

import { useTranslations, useLocale } from 'next-intl';
import type { AttractionCategory, Priority } from '@/types';
import { useTripConfig } from '@/config/trip-context';
import { getCityColor, hexToRgba } from '@/lib/city-colors';

interface AttractionFilterProps {
  selectedCity: string;
  selectedCategory: AttractionCategory | 'all';
  selectedPriority: Priority | 'all';
  onCityChange: (city: string) => void;
  onCategoryChange: (category: AttractionCategory | 'all') => void;
  onPriorityChange: (priority: Priority | 'all') => void;
}

const categories: (AttractionCategory | 'all')[] = [
  'all',
  'monument',
  'church',
  'palace',
  'museum',
  'neighborhood',
  'nature',
];
const priorities: (Priority | 'all')[] = [
  'all',
  'essential',
  'recommended',
  'optional',
];

export default function AttractionFilter({
  selectedCity,
  selectedCategory,
  selectedPriority,
  onCityChange,
  onCategoryChange,
  onPriorityChange,
}: AttractionFilterProps) {
  const t = useTranslations();
  const locale = useLocale() as 'nl' | 'en';
  const config = useTripConfig();

  return (
    <div className="space-y-4">
      {/* City filter */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          {t('attractions.filterByCity')}
        </label>
        <div className="flex flex-wrap gap-2">
          {/* "All" button */}
          <button
            onClick={() => onCityChange('all')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedCity === 'all'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('attractions.allAttractions')}
          </button>
          {/* City buttons from config */}
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
                    : {
                        backgroundColor: hexToRgba(color, 0.08),
                        color: color,
                      }
                }
              >
                {city.name[locale]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category filter */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          {t('attractions.filterByCategory')}
        </label>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat === 'all'
                ? t('common.filter') + ': ' + t('attractions.allAttractions')
                : t(`categories.${cat}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Priority filter */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          {t('common.filter')}
        </label>
        <div className="flex flex-wrap gap-2">
          {priorities.map((p) => (
            <button
              key={p}
              onClick={() => onPriorityChange(p)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedPriority === p
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {p === 'all'
                ? t('attractions.allAttractions')
                : t(`priority.${p}`)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
