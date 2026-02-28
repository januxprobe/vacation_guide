import fs from 'fs';
import path from 'path';
import type { TripConfig } from '@/config/trip-config';
import { tripConfigSchema } from '@/lib/schemas';
import { andalusia2026 } from '@/config/trips/andalusia-2026';
import type { TripRepository } from '../types';

// Static TS-based trip configs (protected from deletion)
const staticTrips: Record<string, TripConfig> = {
  'andalusia-2026': andalusia2026,
};

export class JsonTripRepository implements TripRepository {
  private jsonTripsCache: Record<string, TripConfig> | null = null;

  private loadJsonTrips(): Record<string, TripConfig> {
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

  private getAllTripsMap(): Record<string, TripConfig> {
    if (!this.jsonTripsCache) {
      this.jsonTripsCache = this.loadJsonTrips();
    }
    return { ...staticTrips, ...this.jsonTripsCache };
  }

  private clearCache(): void {
    this.jsonTripsCache = null;
  }

  async getAll(): Promise<TripConfig[]> {
    this.clearCache();
    return Object.values(this.getAllTripsMap());
  }

  async getBySlug(slug: string): Promise<TripConfig | undefined> {
    this.clearCache();
    return this.getAllTripsMap()[slug];
  }

  async getAllSlugs(): Promise<string[]> {
    return Object.keys(this.getAllTripsMap());
  }

  async getDefault(): Promise<TripConfig> {
    const trips = await this.getAll();
    if (trips.length === 0) {
      throw new Error('No trips registered');
    }
    return trips[0];
  }

  async isProtected(slug: string): Promise<boolean> {
    return slug in staticTrips;
  }

  async create(config: TripConfig): Promise<void> {
    const tripDir = path.join(process.cwd(), 'src', 'data', 'trips', config.dataDirectory);

    if (fs.existsSync(tripDir)) {
      throw new Error('Trip directory already exists');
    }

    // Create trip directory structure
    fs.mkdirSync(tripDir, { recursive: true });
    fs.mkdirSync(path.join(tripDir, 'attractions'), { recursive: true });

    // Create city subdirectories
    for (const city of config.cities) {
      fs.mkdirSync(path.join(tripDir, 'attractions', city.id), { recursive: true });
    }

    // Write trip config JSON
    fs.writeFileSync(
      path.join(tripDir, 'trip-config.json'),
      JSON.stringify(config, null, 2),
      'utf-8'
    );

    this.clearCache();
  }

  async delete(slug: string): Promise<void> {
    const trip = this.getAllTripsMap()[slug];
    if (!trip) {
      throw new Error('Trip not found');
    }

    const tripDir = path.join(process.cwd(), 'src', 'data', 'trips', trip.dataDirectory);

    if (fs.existsSync(tripDir)) {
      fs.rmSync(tripDir, { recursive: true, force: true });
    }

    this.clearCache();
  }
}
