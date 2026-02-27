import fs from 'fs';
import path from 'path';
import type { TripConfig } from '../trip-config';
import { tripConfigSchema } from '@/lib/schemas';
import { andalusia2026 } from './andalusia-2026';

// Static TS-based trip configs
const staticTrips: Record<string, TripConfig> = {
  'andalusia-2026': andalusia2026,
};

// Cache for JSON-based trips (from disk)
let jsonTripsCache: Record<string, TripConfig> | null = null;

function loadJsonTrips(): Record<string, TripConfig> {
  const tripsDataDir = path.join(process.cwd(), 'src', 'data', 'trips');
  const result: Record<string, TripConfig> = {};

  if (!fs.existsSync(tripsDataDir)) return result;

  const dirs = fs
    .readdirSync(tripsDataDir, { withFileTypes: true })
    .filter((d) => d.isDirectory());

  for (const dir of dirs) {
    // Skip directories that already have a static TS config
    if (staticTrips[dir.name]) continue;

    const configPath = path.join(tripsDataDir, dir.name, 'trip-config.json');
    if (!fs.existsSync(configPath)) continue;

    try {
      const raw = fs.readFileSync(configPath, 'utf-8');
      const data = JSON.parse(raw);
      const parsed = tripConfigSchema.safeParse(data);
      if (parsed.success) {
        result[parsed.data.slug] = parsed.data as TripConfig;
      } else {
        console.error(`Invalid trip config in ${configPath}:`, parsed.error.format());
      }
    } catch (e) {
      console.error(`Error reading trip config ${configPath}:`, e);
    }
  }

  return result;
}

function getAllTripsMap(): Record<string, TripConfig> {
  if (!jsonTripsCache) {
    jsonTripsCache = loadJsonTrips();
  }
  return { ...staticTrips, ...jsonTripsCache };
}

export function getTripBySlug(slug: string): TripConfig | undefined {
  return getAllTripsMap()[slug];
}

export function getAllTrips(): TripConfig[] {
  return Object.values(getAllTripsMap());
}

export function getAllTripSlugs(): string[] {
  return Object.keys(getAllTripsMap());
}

/** Get the default trip (first registered trip) */
export function getDefaultTrip(): TripConfig {
  const trips = getAllTrips();
  if (trips.length === 0) {
    throw new Error('No trips registered');
  }
  return trips[0];
}

/** Check whether a trip is a static TS-based config (cannot be deleted) */
export function isStaticTrip(slug: string): boolean {
  return slug in staticTrips;
}

/** Clear the JSON trips cache (e.g. after creating a new trip) */
export function clearTripCache(): void {
  jsonTripsCache = null;
}
