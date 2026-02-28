import type { TripConfig } from '@/config/trip-config';
import type { Attraction, Itinerary, Restaurant, DayComment } from '@/types';

export interface TripRepository {
  getAll(): Promise<TripConfig[]>;
  getBySlug(slug: string): Promise<TripConfig | undefined>;
  getAllSlugs(): Promise<string[]>;
  getDefault(): Promise<TripConfig>;
  isProtected(slug: string): Promise<boolean>;
  create(config: TripConfig): Promise<void>;
  delete(slug: string): Promise<void>;
}

export interface TripDataRepository {
  // Attractions
  getAllAttractions(tripSlug: string): Promise<Attraction[]>;
  getAttractionById(tripSlug: string, id: string): Promise<Attraction | undefined>;
  getAllAttractionIds(tripSlug: string): Promise<string[]>;
  addAttraction(tripSlug: string, attraction: Attraction): Promise<void>;
  // Restaurants
  getRestaurants(tripSlug: string): Promise<Restaurant[]>;
  saveRestaurants(tripSlug: string, restaurants: Restaurant[]): Promise<void>;
  addRestaurant(tripSlug: string, restaurant: Restaurant): Promise<void>;
  removeRestaurant(tripSlug: string, restaurantId: string): Promise<boolean>;
  // Itinerary
  getItinerary(tripSlug: string): Promise<Itinerary | null>;
  saveItinerary(tripSlug: string, itinerary: Itinerary): Promise<void>;
  // Comments
  getComments(tripSlug: string): Promise<DayComment[]>;
  addComment(tripSlug: string, comment: DayComment): Promise<void>;
  deleteComment(tripSlug: string, commentId: string): Promise<boolean>;
}
