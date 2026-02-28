'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Map, List, Printer } from 'lucide-react';
import { toast } from 'sonner';
import type { Attraction, Itinerary, Restaurant } from '@/types';
import { recalculateTimes } from '@/lib/planner-utils';
import DayTabBar from './DayTabBar';
import PlannerPanel from './PlannerPanel';
import PlannerMap from './PlannerMap';
import PrintableItinerary from './PrintableItinerary';

interface PlannerViewProps {
  attractions: Attraction[];
  itinerary: Itinerary;
  restaurants: Restaurant[];
  locale: string;
  tripSlug: string;
  isDynamic?: boolean;
}

export default function PlannerView({
  attractions,
  itinerary: initialItinerary,
  restaurants,
  locale,
  tripSlug,
  isDynamic,
}: PlannerViewProps) {
  const t = useTranslations();

  const [itinerary, setItinerary] = useState(initialItinerary);
  const [selectedDay, setSelectedDay] = useState(1);
  const [highlightedActivityId, setHighlightedActivityId] = useState<string | null>(null);
  const [showRestaurants, setShowRestaurants] = useState(false);
  const [showRoute, setShowRoute] = useState(true);
  const [mobileView, setMobileView] = useState<'map' | 'panel'>('panel');
  const [legDurations, setLegDurations] = useState<number[]>([]);

  const currentDay = useMemo(() => {
    return itinerary.days.find((d) => d.dayNumber === selectedDay) ?? itinerary.days[0];
  }, [itinerary, selectedDay]);

  // When clicking an activity card → highlight on map
  const handleActivityClick = useCallback((attractionId: string) => {
    setHighlightedActivityId(attractionId);
    setMobileView('map');
  }, []);

  // When clicking a map marker → highlight in panel
  const handleMarkerClick = useCallback((attractionId: string) => {
    setHighlightedActivityId(attractionId);
    setMobileView('panel');
  }, []);

  const handleDayChange = useCallback((day: number) => {
    setSelectedDay(day);
    setHighlightedActivityId(null);
    setLegDurations([]);
  }, []);

  const handleRouteResult = useCallback((durations: number[]) => {
    setLegDurations(durations);
  }, []);

  // Reorder activities within a day (DnD)
  const handleReorder = useCallback(async (oldIndex: number, newIndex: number) => {
    const dayIndex = itinerary.days.findIndex((d) => d.dayNumber === selectedDay);
    if (dayIndex === -1) return;

    const newDays = [...itinerary.days];
    const day = { ...newDays[dayIndex] };
    const activities = [...day.activities];

    // Move activity
    const [moved] = activities.splice(oldIndex, 1);
    activities.splice(newIndex, 0, moved);

    // Recalculate times based on order
    const recalculated = recalculateTimes(activities);
    day.activities = recalculated;
    newDays[dayIndex] = day;

    const newItinerary = { ...itinerary, days: newDays };
    setItinerary(newItinerary);

    // Persist
    try {
      const res = await fetch(`/api/trips/${tripSlug}/itinerary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItinerary),
      });
      if (!res.ok) throw new Error('Save failed');
      toast.success(t('planner.saved'));
    } catch {
      toast.error(t('planner.saveError'));
      setItinerary(initialItinerary);
    }
  }, [itinerary, selectedDay, tripSlug, t, initialItinerary]);

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 92px)' }}>
      {/* Day tabs */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-2">
        <DayTabBar
          days={itinerary.days}
          selectedDay={selectedDay}
          onSelectDay={handleDayChange}
        />
      </div>

      {/* Mobile toggle buttons */}
      <div className="lg:hidden flex-shrink-0 bg-white border-b border-gray-200 px-4 py-2 flex gap-2">
        <button
          onClick={() => setMobileView('panel')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            mobileView === 'panel'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <List className="w-4 h-4" />
          {t('planner.listView')}
        </button>
        <button
          onClick={() => setMobileView('map')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            mobileView === 'map'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Map className="w-4 h-4" />
          {t('planner.mapView')}
        </button>
      </div>

      {/* Map + panel toggle controls (small bar above map on desktop) */}
      <div className="hidden lg:flex flex-shrink-0 bg-white border-b border-gray-100 px-4 py-1.5 items-center gap-3">
        <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showRoute}
            onChange={() => setShowRoute(!showRoute)}
            className="rounded text-gray-900"
          />
          {t('map.showRoute')}
        </label>
        <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showRestaurants}
            onChange={() => setShowRestaurants(!showRestaurants)}
            className="rounded text-gray-900"
          />
          {t('map.showRestaurants')}
        </label>
        <div className="ml-auto">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors print:hidden"
          >
            <Printer className="w-3.5 h-3.5" />
            {t('planner.print')}
          </button>
        </div>
      </div>

      {/* Split view */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map (left on desktop, toggled on mobile) */}
        <div
          className={`lg:w-[60%] lg:block ${
            mobileView === 'map' ? 'w-full block' : 'hidden'
          }`}
        >
          <PlannerMap
            day={currentDay}
            attractions={attractions}
            restaurants={restaurants}
            showRestaurants={showRestaurants}
            showRoute={showRoute}
            highlightedActivityId={highlightedActivityId}
            onMarkerClick={handleMarkerClick}
            locale={locale}
            tripSlug={tripSlug}
            onRouteResult={handleRouteResult}
          />
        </div>

        {/* Panel (right on desktop, toggled on mobile) */}
        <div
          className={`lg:w-[40%] lg:block lg:border-l border-gray-200 bg-white ${
            mobileView === 'panel' ? 'w-full block' : 'hidden'
          }`}
        >
          <PlannerPanel
            day={currentDay}
            attractions={attractions}
            highlightedActivityId={highlightedActivityId}
            onActivityClick={handleActivityClick}
            legDurations={legDurations}
            tripSlug={tripSlug}
            canReorder={isDynamic}
            onReorder={isDynamic ? handleReorder : undefined}
          />
        </div>
      </div>

      {/* Print-only itinerary */}
      <PrintableItinerary itinerary={itinerary} attractions={attractions} />
    </div>
  );
}

