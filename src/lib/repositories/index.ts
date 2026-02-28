import type { TripRepository, TripDataRepository } from './types';
import { JsonTripRepository } from './json/json-trip-repository';
import { JsonTripDataRepository } from './json/json-trip-data-repository';

export type { TripRepository, TripDataRepository };

// Singletons — one instance per backend
let tripRepo: TripRepository | null = null;
let tripDataRepo: TripDataRepository | null = null;

function getBackend(): string {
  return process.env.DATA_BACKEND ?? 'json';
}

export function getTripRepository(): TripRepository {
  if (!tripRepo) {
    const backend = getBackend();
    switch (backend) {
      case 'json':
        tripRepo = new JsonTripRepository();
        break;
      // case 'firestore':
      //   tripRepo = new FirestoreTripRepository();
      //   break;
      default:
        throw new Error(`Unknown DATA_BACKEND: ${backend}`);
    }
  }
  return tripRepo;
}

export function getTripDataRepository(): TripDataRepository {
  if (!tripDataRepo) {
    const backend = getBackend();
    switch (backend) {
      case 'json':
        tripDataRepo = new JsonTripDataRepository();
        break;
      // case 'firestore':
      //   tripDataRepo = new FirestoreTripDataRepository();
      //   break;
      default:
        throw new Error(`Unknown DATA_BACKEND: ${backend}`);
    }
  }
  return tripDataRepo;
}
