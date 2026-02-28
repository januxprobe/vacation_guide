'use client';

import dynamic from 'next/dynamic';
import type { Attraction, Itinerary, Restaurant } from '@/types';

const PlannerView = dynamic(
  () => import('./PlannerView'),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col" style={{ height: 'calc(100vh - 92px)' }}>
        <div className="h-12 bg-gray-100 animate-pulse" />
        <div className="flex-1 flex">
          <div className="w-[60%] bg-gray-100 animate-pulse" />
          <div className="w-[40%] bg-gray-50 animate-pulse" />
        </div>
      </div>
    ),
  }
);

interface PlannerWrapperProps {
  attractions: Attraction[];
  itinerary: Itinerary;
  restaurants: Restaurant[];
  locale: string;
  tripSlug: string;
  isDynamic?: boolean;
}

export default function PlannerWrapper(props: PlannerWrapperProps) {
  return <PlannerView {...props} />;
}
