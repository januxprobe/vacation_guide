'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Itinerary, Attraction } from '@/types';
import DayCard from './DayCard';

interface ItineraryListProps {
  itinerary: Itinerary;
  attractions: Attraction[];
}

export default function ItineraryList({ itinerary, attractions }: ItineraryListProps) {
  const t = useTranslations();
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));

  // Build lookup map: attractionId -> Attraction
  const attractionMap: Record<string, Attraction> = {};
  for (const a of attractions) {
    attractionMap[a.id] = a;
  }

  const allExpanded = expandedDays.size === itinerary.days.length;

  const toggleDay = (dayNumber: number) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayNumber)) {
        next.delete(dayNumber);
      } else {
        next.add(dayNumber);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedDays(new Set());
    } else {
      setExpandedDays(new Set(itinerary.days.map((d) => d.dayNumber)));
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={toggleAll}
          className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          {allExpanded ? t('itinerary.collapseAll') : t('itinerary.expandAll')}
        </button>
      </div>

      <div className="space-y-3">
        {itinerary.days.map((day) => (
          <DayCard
            key={day.dayNumber}
            day={day}
            attractionMap={attractionMap}
            isExpanded={expandedDays.has(day.dayNumber)}
            onToggle={() => toggleDay(day.dayNumber)}
          />
        ))}
      </div>
    </div>
  );
}
