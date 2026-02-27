import type { LocalizedString, Coordinates } from '@/types';

export interface CityConfig {
  id: string;
  name: LocalizedString;
  color: string; // hex color, e.g. '#f97316'
  coordinates: Coordinates;
}

export interface TravelerGroup {
  id: string;
  label: LocalizedString;
  defaultCount: number;
  hasStudentDiscount: boolean;
}

export interface TripConfig {
  id: string;
  slug: string;
  name: LocalizedString;
  description: LocalizedString;
  region: LocalizedString;
  dates: { start: string; end: string };
  cities: CityConfig[];
  categories: string[];
  travelerGroups: TravelerGroup[];
  stats: {
    totalDays: number;
    totalCities: number;
    totalAttractions: number;
    totalDistance: string;
  };
  theme: {
    primaryColor: string; // hex color for header/CTA
  };
  highlights: string[]; // attraction IDs for homepage
  dataDirectory: string; // folder name under src/data/trips/
}
