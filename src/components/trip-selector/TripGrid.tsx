'use client';

import { useRouter } from '@/i18n/routing';
import type { TripConfig } from '@/config/trip-config';
import TripCard from './TripCard';
import CreateTripCard from './CreateTripCard';

interface TripGridProps {
  trips: TripConfig[];
  locale: string;
  staticSlugs: string[];
}

export default function TripGrid({ trips, locale, staticSlugs }: TripGridProps) {
  const router = useRouter();

  const handleDeleted = () => {
    // Full reload to pick up the deleted trip from the server
    window.location.reload();
  };

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
      {trips.map((trip) => (
        <TripCard
          key={trip.slug}
          trip={trip}
          locale={locale}
          deletable={!staticSlugs.includes(trip.slug)}
          onDeleted={handleDeleted}
        />
      ))}
      <CreateTripCard />
    </div>
  );
}
