'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Clock, Ticket, AlertCircle } from 'lucide-react';
import type { Attraction, Activity, MealSuggestion } from '@/types';
import { hexToRgba } from '@/lib/city-colors';

interface ActivityCardProps {
  activity: Activity;
  attraction: Attraction | undefined;
  index: number;
  cityColor: string;
  isHighlighted: boolean;
  onClick: () => void;
}

export function ActivityCard({
  activity,
  attraction,
  index,
  cityColor,
  isHighlighted,
  onClick,
}: ActivityCardProps) {
  const t = useTranslations();
  const locale = useLocale() as 'nl' | 'en';

  const name = attraction?.name ?? activity.attractionId;
  const duration = activity.duration >= 60
    ? `${Math.floor(activity.duration / 60)}h${activity.duration % 60 > 0 ? `${activity.duration % 60}m` : ''}`
    : `${activity.duration}m`;
  const price = attraction
    ? attraction.pricing.adult === 0
      ? t('itinerary.free')
      : `€${attraction.pricing.adult}`
    : null;
  const thumbnail = attraction?.thumbnail ?? attraction?.images?.[0];
  const notes = activity.notes?.[locale];

  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-stretch gap-3 p-3 rounded-xl transition-all cursor-pointer ${
        isHighlighted
          ? 'ring-2 shadow-md'
          : 'hover:bg-gray-50'
      }`}
      style={
        isHighlighted
          ? { boxShadow: `0 4px 12px ${hexToRgba(cityColor, 0.2)}`, outline: `2px solid ${cityColor}` }
          : undefined
      }
    >
      {/* Number badge */}
      <div
        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold mt-1"
        style={{ backgroundColor: cityColor }}
      >
        {index + 1}
      </div>

      {/* Thumbnail */}
      {thumbnail && (
        <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden">
          <img
            src={thumbnail}
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs text-gray-500 font-medium">{activity.time}</span>
          {attraction?.category && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: hexToRgba(cityColor, 0.1), color: cityColor }}
            >
              {t(`categories.${attraction.category}`)}
            </span>
          )}
        </div>
        <div className="font-semibold text-sm text-gray-900 truncate">{name}</div>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {duration}
          </span>
          {price && (
            <span className="flex items-center gap-1">
              <Ticket className="w-3 h-3" />
              {price}
            </span>
          )}
        </div>
        {attraction?.bookingRequired && (
          <div className="flex items-center gap-1 mt-1 text-xs font-medium" style={{ color: cityColor }}>
            <AlertCircle className="w-3 h-3" />
            {t('planner.bookingTip')}
          </div>
        )}
        {notes && (
          <p className="text-xs text-gray-400 mt-1 truncate">{notes}</p>
        )}
      </div>
    </button>
  );
}

interface MealCardProps {
  meal: MealSuggestion;
}

export function MealCard({ meal }: MealCardProps) {
  const t = useTranslations();
  const locale = useLocale() as 'nl' | 'en';

  const mealLabel = t(`itinerary.${meal.type}`);
  const notes = meal.notes?.[locale];

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center text-white text-xs">
        🍽
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-amber-600 font-medium">{meal.time}</span>
          <span className="text-sm font-semibold text-amber-900">{mealLabel}</span>
        </div>
        {notes && <p className="text-xs text-amber-700/70 mt-0.5 truncate">{notes}</p>}
        <div className="flex items-center gap-2 mt-0.5 text-xs text-amber-600">
          {meal.neighborhood && <span>{meal.neighborhood}</span>}
          <span>~€{meal.estimatedCost}</span>
        </div>
      </div>
    </div>
  );
}
