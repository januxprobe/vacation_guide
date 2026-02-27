'use client';

import { useTranslations, useLocale } from 'next-intl';
import type { ItineraryDay, Attraction } from '@/types';
import { useTripConfig } from '@/config/trip-context';
import { findCity, getCityBadgeStyle, getCityColor, hexToRgba } from '@/lib/city-colors';
import { ChevronDown, ChevronUp, MapPin, Clock } from 'lucide-react';
import ActivityTimeline from './ActivityTimeline';

interface DayCardProps {
  day: ItineraryDay;
  attractionMap: Record<string, Attraction>;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function DayCard({ day, attractionMap, isExpanded, onToggle }: DayCardProps) {
  const t = useTranslations();
  const locale = useLocale() as 'nl' | 'en';
  const config = useTripConfig();
  const city = findCity(config.cities, day.city);
  const cityColor = getCityColor(city);

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      {/* Header - always visible */}
      <button
        onClick={onToggle}
        className="w-full text-left p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
        style={{ borderLeft: `4px solid ${cityColor}` }}
      >
        {/* Day number */}
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
          style={{ backgroundColor: cityColor }}
        >
          {day.dayNumber}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-gray-900">
              {t('itinerary.day')} {day.dayNumber}: {day.title[locale]}
            </h3>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full border"
              style={getCityBadgeStyle(city)}
            >
              {city?.name[locale] ?? day.city}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {day.activities.length} {t('itinerary.activities').toLowerCase()}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {day.meals.length} {t('itinerary.meals').toLowerCase()}
            </span>
          </div>
        </div>

        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-400 shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400 shrink-0" />
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div
          className="p-4 border-t"
          style={{
            borderTopColor: hexToRgba(cityColor, 0.2),
            backgroundColor: hexToRgba(cityColor, 0.02),
          }}
        >
          <ActivityTimeline
            activities={day.activities}
            meals={day.meals}
            attractionMap={attractionMap}
            city={day.city}
          />
        </div>
      )}
    </div>
  );
}
