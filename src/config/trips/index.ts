import type { TripConfig } from '../trip-config';
import { andalusia2026 } from './andalusia-2026';

const tripRegistry: Record<string, TripConfig> = {
  'andalusia-2026': andalusia2026,
};

export function getTripBySlug(slug: string): TripConfig | undefined {
  return tripRegistry[slug];
}

export function getAllTrips(): TripConfig[] {
  return Object.values(tripRegistry);
}

export function getAllTripSlugs(): string[] {
  return Object.keys(tripRegistry);
}

/** Get the default trip (first registered trip) */
export function getDefaultTrip(): TripConfig {
  const trips = getAllTrips();
  if (trips.length === 0) {
    throw new Error('No trips registered');
  }
  return trips[0];
}
