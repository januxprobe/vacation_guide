'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Map, List } from 'lucide-react';
import type { Attraction, Itinerary, Restaurant } from '@/types';
import DayTabBar from './DayTabBar';
import PlannerPanel from './PlannerPanel';
import PlannerMap from './PlannerMap';

interface PlannerViewProps {
  attractions: Attraction[];
  itinerary: Itinerary;
  restaurants: Restaurant[];
  locale: string;
  tripSlug: string;
}

export default function PlannerView({
  attractions,
  itinerary,
  restaurants,
  locale,
  tripSlug,
}: PlannerViewProps) {
  const t = useTranslations();

  const [selectedDay, setSelectedDay] = useState(1);
  const [highlightedActivityId, setHighlightedActivityId] = useState<string | null>(null);
  const [showRestaurants, setShowRestaurants] = useState(false);
  const [showRoute, setShowRoute] = useState(true);
  const [mobileView, setMobileView] = useState<'map' | 'panel'>('panel');

  const currentDay = useMemo(() => {
    return itinerary.days.find((d) => d.dayNumber === selectedDay) ?? itinerary.days[0];
  }, [itinerary, selectedDay]);

  // When clicking an activity card → highlight on map
  const handleActivityClick = useCallback((attractionId: string) => {
    setHighlightedActivityId(attractionId);
    // On mobile, switch to map view when clicking an activity
    setMobileView('map');
  }, []);

  // When clicking a map marker → highlight in panel
  const handleMarkerClick = useCallback((attractionId: string) => {
    setHighlightedActivityId(attractionId);
    // On mobile, switch to panel view when clicking a marker
    setMobileView('panel');
  }, []);

  const handleDayChange = useCallback((day: number) => {
    setSelectedDay(day);
    setHighlightedActivityId(null);
  }, []);

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
          />
        </div>
      </div>
    </div>
  );
}
