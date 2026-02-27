'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useTripConfig } from '@/config/trip-context';
import { findCity, hexToRgba } from '@/lib/city-colors';
import type { ItineraryDay } from '@/types';

interface DayTabBarProps {
  days: ItineraryDay[];
  selectedDay: number;
  onSelectDay: (day: number) => void;
}

export default function DayTabBar({ days, selectedDay, onSelectDay }: DayTabBarProps) {
  const t = useTranslations();
  const locale = useLocale() as 'nl' | 'en';
  const config = useTripConfig();

  return (
    <div className="flex gap-1 overflow-x-auto px-1 py-2 scrollbar-thin" role="tablist">
      {days.map((day) => {
        const city = findCity(config.cities, day.city);
        const color = city?.color ?? '#6b7280';
        const isSelected = day.dayNumber === selectedDay;

        return (
          <button
            key={day.dayNumber}
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelectDay(day.dayNumber)}
            className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              isSelected ? 'text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'
            }`}
            style={
              isSelected
                ? { backgroundColor: color }
                : { borderBottom: `2px solid ${hexToRgba(color, 0.3)}` }
            }
          >
            <span className="font-bold">{t('itinerary.day')} {day.dayNumber}</span>
            <span className={`ml-1.5 text-xs ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
              {city?.name[locale] ?? day.city}
            </span>
          </button>
        );
      })}
    </div>
  );
}
