import fs from 'fs';
import path from 'path';
import type { Attraction, Itinerary, Restaurant } from '@/types';
import { attractionSchema, itinerarySchema, restaurantsFileSchema } from '@/lib/schemas';
import type { TripDataRepository } from '../types';
import { getTripRepository } from '../index';

function tripsDataDir(): string {
  return path.join(process.cwd(), 'src', 'data', 'trips');
}

export class JsonTripDataRepository implements TripDataRepository {
  private attractionCache = new Map<string, Attraction[]>();
  private restaurantCache = new Map<string, Restaurant[]>();
  private itineraryCache = new Map<string, Itinerary | null>();

  private async getDataDirectory(tripSlug: string): Promise<string> {
    const tripRepo = getTripRepository();
    const trip = await tripRepo.getBySlug(tripSlug);
    if (!trip) {
      throw new Error(`Trip not found: ${tripSlug}`);
    }
    return trip.dataDirectory;
  }

  // ---------- Attractions ----------

  private loadAttractions(dataDirectory: string): Attraction[] {
    const attractionsDir = path.join(tripsDataDir(), dataDirectory, 'attractions');

    if (!fs.existsSync(attractionsDir)) {
      return [];
    }

    const attractions: Attraction[] = [];

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

  async getAllAttractions(tripSlug: string): Promise<Attraction[]> {
    if (!this.attractionCache.has(tripSlug)) {
      const dataDir = await this.getDataDirectory(tripSlug);
      this.attractionCache.set(tripSlug, this.loadAttractions(dataDir));
    }
    return this.attractionCache.get(tripSlug)!;
  }

  async getAttractionById(tripSlug: string, id: string): Promise<Attraction | undefined> {
    const attractions = await this.getAllAttractions(tripSlug);
    return attractions.find((a) => a.id === id);
  }

  async getAllAttractionIds(tripSlug: string): Promise<string[]> {
    const attractions = await this.getAllAttractions(tripSlug);
    return attractions.map((a) => a.id);
  }

  async addAttraction(tripSlug: string, attraction: Attraction): Promise<void> {
    const dataDir = await this.getDataDirectory(tripSlug);
    const cityDir = path.join(tripsDataDir(), dataDir, 'attractions', attraction.city);

    fs.mkdirSync(cityDir, { recursive: true });

    const filePath = path.join(cityDir, `${attraction.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(attraction, null, 2), 'utf-8');

    // Invalidate cache
    this.attractionCache.delete(tripSlug);
  }

  // ---------- Restaurants ----------

  private loadRestaurants(dataDirectory: string): Restaurant[] {
    const filePath = path.join(tripsDataDir(), dataDirectory, 'restaurants.json');

    if (!fs.existsSync(filePath)) {
      return [];
    }

    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    const result = restaurantsFileSchema.safeParse(data);

    if (!result.success) {
      console.error(`Invalid restaurant data in ${filePath}:`, result.error.format());
      return [];
    }

    return result.data.restaurants as Restaurant[];
  }

  async getRestaurants(tripSlug: string): Promise<Restaurant[]> {
    if (!this.restaurantCache.has(tripSlug)) {
      const dataDir = await this.getDataDirectory(tripSlug);
      this.restaurantCache.set(tripSlug, this.loadRestaurants(dataDir));
    }
    return this.restaurantCache.get(tripSlug)!;
  }

  async saveRestaurants(tripSlug: string, restaurants: Restaurant[]): Promise<void> {
    const dataDir = await this.getDataDirectory(tripSlug);
    const filePath = path.join(tripsDataDir(), dataDir, 'restaurants.json');

    fs.writeFileSync(
      filePath,
      JSON.stringify({ restaurants }, null, 2),
      'utf-8'
    );

    this.restaurantCache.delete(tripSlug);
  }

  async addRestaurant(tripSlug: string, restaurant: Restaurant): Promise<void> {
    const dataDir = await this.getDataDirectory(tripSlug);
    const filePath = path.join(tripsDataDir(), dataDir, 'restaurants.json');

    const existing = fs.existsSync(filePath)
      ? JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      : { restaurants: [] };

    // Check for duplicate
    if (existing.restaurants.some((r: { id: string }) => r.id === restaurant.id)) {
      throw new Error('Restaurant with this ID already exists');
    }

    existing.restaurants.push(restaurant);
    fs.writeFileSync(filePath, JSON.stringify(existing, null, 2), 'utf-8');

    this.restaurantCache.delete(tripSlug);
  }

  async removeRestaurant(tripSlug: string, restaurantId: string): Promise<boolean> {
    const dataDir = await this.getDataDirectory(tripSlug);
    const filePath = path.join(tripsDataDir(), dataDir, 'restaurants.json');

    if (!fs.existsSync(filePath)) {
      return false;
    }

    const existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const filtered = existing.restaurants.filter(
      (r: { id: string }) => r.id !== restaurantId
    );

    if (filtered.length === existing.restaurants.length) {
      return false;
    }

    fs.writeFileSync(
      filePath,
      JSON.stringify({ restaurants: filtered }, null, 2),
      'utf-8'
    );

    this.restaurantCache.delete(tripSlug);
    return true;
  }

  // ---------- Itinerary ----------

  private loadItinerary(dataDirectory: string): Itinerary | null {
    const filePath = path.join(tripsDataDir(), dataDirectory, 'itinerary.json');

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    const result = itinerarySchema.safeParse(data);

    if (!result.success) {
      console.error(`Invalid itinerary data in ${filePath}:`, result.error.format());
      return null;
    }

    return result.data as Itinerary;
  }

  async getItinerary(tripSlug: string): Promise<Itinerary | null> {
    if (!this.itineraryCache.has(tripSlug)) {
      const dataDir = await this.getDataDirectory(tripSlug);
      this.itineraryCache.set(tripSlug, this.loadItinerary(dataDir));
    }
    return this.itineraryCache.get(tripSlug) ?? null;
  }

  async saveItinerary(tripSlug: string, itinerary: Itinerary): Promise<void> {
    const dataDir = await this.getDataDirectory(tripSlug);
    const filePath = path.join(tripsDataDir(), dataDir, 'itinerary.json');

    fs.writeFileSync(filePath, JSON.stringify(itinerary, null, 2), 'utf-8');

    this.itineraryCache.delete(tripSlug);
  }
}
