'use client';

import { useRef, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useTripConfig } from '@/config/trip-context';
import { findCity } from '@/lib/city-colors';
import { ExternalLink } from 'lucide-react';
import type { ItineraryDay, Attraction } from '@/types';
import PlannerTimeline from './PlannerTimeline';

interface PlannerPanelProps {
  day: ItineraryDay;
  attractions: Attraction[];
  highlightedActivityId: string | null;
  onActivityClick: (attractionId: string) => void;
}

function buildGoogleMapsUrl(attractions: Attraction[], activityIds: string[]): string | null {
  const coords = activityIds
    .map((id) => attractions.find((a) => a.id === id))
    .filter((a): a is Attraction => !!a)
    .map((a) => `${a.coordinates.lat},${a.coordinates.lng}`);

  if (coords.length < 2) return null;

  const origin = coords[0];
  const destination = coords[coords.length - 1];
  const waypoints = coords.slice(1, -1).join('|');

  let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=walking`;
  if (waypoints) {
    url += `&waypoints=${waypoints}`;
  }
  return url;
}

export default function PlannerPanel({
  day,
  attractions,
  highlightedActivityId,
  onActivityClick,
}: PlannerPanelProps) {
  const t = useTranslations();
  const locale = useLocale() as 'nl' | 'en';
  const config = useTripConfig();
  const activityRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const city = findCity(config.cities, day.city);
  const cityColor = city?.color ?? '#6b7280';
  const cityName = city?.name[locale] ?? day.city;
  const dayTitle = day.title[locale];
  const activityIds = day.activities.map((a) => a.attractionId);
  const routeUrl = buildGoogleMapsUrl(attractions, activityIds);

  // Auto-scroll to highlighted activity
  useEffect(() => {
    if (highlightedActivityId) {
      const el = activityRefs.current.get(highlightedActivityId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedActivityId]);

  return (
    <div className="flex flex-col h-full">
      {/* Day header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: cityColor }}
              />
              <span className="text-sm font-bold text-gray-900">{cityName}</span>
            </div>
            <h2 className="text-base font-semibold text-gray-800 mt-0.5">{dayTitle}</h2>
          </div>
          {routeUrl && (
            <a
              href={routeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
              style={{ backgroundColor: cityColor }}
            >
              <ExternalLink className="w-3 h-3" />
              {t('planner.openRoute')}
            </a>
          )}
        </div>
      </div>

      {/* Scrollable timeline */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <PlannerTimeline
          activities={day.activities}
          meals={day.meals}
          attractions={attractions}
          cityColor={cityColor}
          highlightedActivityId={highlightedActivityId}
          onActivityClick={onActivityClick}
          activityRefs={activityRefs}
        />
      </div>
    </div>
  );
}
