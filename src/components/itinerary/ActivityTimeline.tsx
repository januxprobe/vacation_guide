'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import type { Activity, MealSuggestion, Attraction } from '@/types';
import { useTripConfig } from '@/config/trip-context';
import { findCity, getCityColor } from '@/lib/city-colors';
import {
  Footprints,
  Bus,
  Train,
  Car,
  UtensilsCrossed,
  Landmark,
  ArrowRight,
} from 'lucide-react';

interface ActivityTimelineProps {
  activities: Activity[];
  meals: MealSuggestion[];
  attractionMap: Record<string, Attraction>;
  city: string;
}

type TimelineEntry =
  | { type: 'activity'; time: string; data: Activity }
  | { type: 'meal'; time: string; data: MealSuggestion };

const transportIcons = {
  walk: Footprints,
  bus: Bus,
  train: Train,
  car: Car,
};

export default function ActivityTimeline({
  activities,
  meals,
  attractionMap,
  city,
}: ActivityTimelineProps) {
  const t = useTranslations();
  const locale = useLocale() as 'nl' | 'en';
  const config = useTripConfig();
  const cityConfig = findCity(config.cities, city);
  const cityColor = getCityColor(cityConfig);
  const prefix = `/${config.slug}`;

  // Merge activities and meals into a single sorted timeline
  const entries: TimelineEntry[] = [
    ...activities.map((a) => ({ type: 'activity' as const, time: a.time, data: a })),
    ...meals.map((m) => ({ type: 'meal' as const, time: m.time, data: m })),
  ].sort((a, b) => a.time.localeCompare(b.time));

  const formatPrice = (price: number) => {
    if (price === 0) return t('itinerary.free');
    return `€${price.toFixed(2)}`;
  };

  return (
    <div className="relative">
      {/* Vertical line */}
      <div
        className="absolute left-4 top-0 bottom-0 w-0.5 opacity-20"
        style={{ backgroundColor: cityColor }}
      />

      <div className="space-y-4">
        {entries.map((entry, i) => {
          if (entry.type === 'activity') {
            const activity = entry.data;
            const attraction = attractionMap[activity.attractionId];
            const TransportIcon = activity.transport
              ? transportIcons[activity.transport.method]
              : null;

            return (
              <div key={`activity-${i}`} className="relative pl-10">
                {/* Dot */}
                <div
                  className="absolute left-2.5 top-2 h-3 w-3 rounded-full border-2 border-white"
                  style={{ backgroundColor: cityColor }}
                />

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  {/* Transport indicator */}
                  {activity.transport && TransportIcon && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                      <TransportIcon className="h-3.5 w-3.5" />
                      <span>
                        {t(`itinerary.${activity.transport.method}`)} · {activity.transport.duration} {t('common.minutes')}
                        {activity.transport.cost != null && activity.transport.cost > 0 && (
                          <> · €{activity.transport.cost.toFixed(2)}</>
                        )}
                      </span>
                      {activity.transport.notes && (
                        <span className="text-gray-400">— {activity.transport.notes[locale]}</span>
                      )}
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-500">
                          {activity.time}
                        </span>
                        <Landmark className="h-4 w-4 text-gray-400" />
                        <span className="font-bold text-gray-900">
                          {attraction?.name ?? activity.attractionId}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {activity.duration} {t('common.minutes')}
                        {attraction && attraction.pricing.adult > 0 && (
                          <> · {formatPrice(attraction.pricing.adult)}</>
                        )}
                      </div>
                      {activity.notes && (
                        <p className="text-sm text-gray-600 mt-1">{activity.notes[locale]}</p>
                      )}
                    </div>

                    {attraction && (
                      <Link
                        href={`${prefix}/attractions/${attraction.id}`}
                        className="flex items-center gap-1 text-xs font-medium shrink-0"
                        style={{ color: cityColor }}
                      >
                        {t('itinerary.viewAttraction')}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          }

          // Meal entry
          const meal = entry.data;
          return (
            <div key={`meal-${i}`} className="relative pl-10">
              {/* Dot */}
              <div className="absolute left-2.5 top-2 h-3 w-3 rounded-full border-2 border-white bg-amber-400" />

              <div className="bg-amber-50 rounded-lg border border-amber-200 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-500">{meal.time}</span>
                  <UtensilsCrossed className="h-4 w-4 text-amber-500" />
                  <span className="font-bold text-gray-900">
                    {t(`itinerary.${meal.type}`)}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {meal.neighborhood && <>{meal.neighborhood} · </>}
                  ~€{meal.estimatedCost.toFixed(2)} {t('budget.perPerson').toLowerCase()}
                </div>
                {meal.notes && (
                  <p className="text-sm text-gray-600 mt-1">{meal.notes[locale]}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
