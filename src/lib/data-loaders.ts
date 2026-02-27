import fs from 'fs';
import path from 'path';
import type { Attraction } from '@/types';
import type { TripConfig } from '@/config/trip-config';
import { getDefaultTrip } from '@/config/trips';
import { attractionSchema } from './schemas';

/**
 * Load all attraction JSON files from a trip's data directory.
 * Uses fs.readFileSync because this runs at build time (SSG/SSR on Node.js).
 * Adding a new city = adding a directory with JSON files.
 */
function loadAttractionsForTrip(config: TripConfig): Attraction[] {
  const attractionsDir = path.join(
    process.cwd(),
    'src',
    'data',
    'trips',
    config.dataDirectory,
    'attractions'
  );

  if (!fs.existsSync(attractionsDir)) {
    console.warn(`Attractions directory not found: ${attractionsDir}`);
    return [];
  }

  const attractions: Attraction[] = [];

  // Scan each city directory
  const cityDirs = fs
    .readdirSync(attractionsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory());

  for (const cityDir of cityDirs) {
    const cityPath = path.join(attractionsDir, cityDir.name);
    const jsonFiles = fs
      .readdirSync(cityPath)
      .filter((f) => f.endsWith('.json'));

    for (const file of jsonFiles) {
      const filePath = path.join(cityPath, file);
      const raw = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw);

      // Validate with Zod
      const result = attractionSchema.safeParse(data);
      if (!result.success) {
        console.error(`Invalid attraction data in ${filePath}:`, result.error.format());
        continue;
      }

      attractions.push(result.data as Attraction);
    }
  }

  return attractions;
}

// Cache loaded attractions per trip to avoid re-reading files
const attractionCache = new Map<string, Attraction[]>();

function getAttractionsForTrip(config: TripConfig): Attraction[] {
  if (!attractionCache.has(config.id)) {
    attractionCache.set(config.id, loadAttractionsForTrip(config));
  }
  return attractionCache.get(config.id)!;
}

// ---------- Public API (backward-compatible) ----------

/** Get all attractions for the default trip */
export function getAllAttractions(): Attraction[] {
  return getAttractionsForTrip(getDefaultTrip());
}

/** Get all attractions for a specific trip config */
export function getAllAttractionsForTrip(config: TripConfig): Attraction[] {
  return getAttractionsForTrip(config);
}

export function getAttractionsByCity(city: string): Attraction[] {
  return getAllAttractions().filter((a) => a.city === city);
}

export function getAttractionById(id: string): Attraction | undefined {
  return getAllAttractions().find((a) => a.id === id);
}

export function getAttractionByIdForTrip(
  id: string,
  config: TripConfig
): Attraction | undefined {
  return getAttractionsForTrip(config).find((a) => a.id === id);
}

export function getAttractionsByPriority(
  priority: Attraction['priority']
): Attraction[] {
  return getAllAttractions().filter((a) => a.priority === priority);
}

export function getAttractionsByCategory(
  category: Attraction['category']
): Attraction[] {
  return getAllAttractions().filter((a) => a.category === category);
}

export function getAllAttractionIds(): string[] {
  return getAllAttractions().map((a) => a.id);
}

export function getAllAttractionIdsForTrip(config: TripConfig): string[] {
  return getAttractionsForTrip(config).map((a) => a.id);
}

/** Clear cached attractions for a specific trip (e.g. after adding new ones) */
export function clearAttractionCache(tripId?: string): void {
  if (tripId) {
    attractionCache.delete(tripId);
  } else {
    attractionCache.clear();
  }
}
