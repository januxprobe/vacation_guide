'use client';

import dynamic from 'next/dynamic';
import type { Attraction, Itinerary, Restaurant } from '@/types';

const InteractiveMap = dynamic(
  () => import('./InteractiveMap'),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-[500px] md:h-[600px] lg:h-[70vh] bg-gray-100 rounded-lg animate-pulse" />
      </div>
    ),
  }
);

interface MapWrapperProps {
  attractions: Attraction[];
  itinerary: Itinerary | null;
  restaurants: Restaurant[];
  locale: string;
  tripSlug: string;
}

export default function MapWrapper(props: MapWrapperProps) {
  return <InteractiveMap {...props} />;
}
