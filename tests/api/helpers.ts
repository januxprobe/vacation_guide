import { vi } from 'vitest';
import type { TripRepository, TripDataRepository } from '@/lib/repositories/types';
import type { TripConfig } from '@/config/trip-config';
import type { Attraction, Restaurant, DayComment, Itinerary, TripStory } from '@/types';

// ── Mock factory: TripRepository ────────────────────────────────────

export function createMockTripRepo(
  overrides: Partial<TripRepository> = {},
): TripRepository {
  return {
    getAll: vi.fn().mockResolvedValue([]),
    getBySlug: vi.fn().mockResolvedValue(undefined),
    getAllSlugs: vi.fn().mockResolvedValue([]),
    getDefault: vi.fn().mockResolvedValue(MOCK_TRIP_CONFIG),
    isProtected: vi.fn().mockResolvedValue(false),
    create: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

// ── Mock factory: TripDataRepository ────────────────────────────────

export function createMockTripDataRepo(
  overrides: Partial<TripDataRepository> = {},
): TripDataRepository {
  return {
    getAllAttractions: vi.fn().mockResolvedValue([]),
    getAttractionById: vi.fn().mockResolvedValue(undefined),
    getAllAttractionIds: vi.fn().mockResolvedValue([]),
    addAttraction: vi.fn().mockResolvedValue(undefined),
    getRestaurants: vi.fn().mockResolvedValue([]),
    saveRestaurants: vi.fn().mockResolvedValue(undefined),
    addRestaurant: vi.fn().mockResolvedValue(undefined),
    removeRestaurant: vi.fn().mockResolvedValue(false),
    getItinerary: vi.fn().mockResolvedValue(null),
    saveItinerary: vi.fn().mockResolvedValue(undefined),
    getComments: vi.fn().mockResolvedValue([]),
    addComment: vi.fn().mockResolvedValue(undefined),
    deleteComment: vi.fn().mockResolvedValue(false),
    getStory: vi.fn().mockResolvedValue(null),
    saveStory: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

// ── Request helpers ─────────────────────────────────────────────────

export function makeJsonRequest(
  url: string,
  body: unknown,
  method = 'POST',
): Request {
  return new Request(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function makeParams(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

// ── Fixture constants ───────────────────────────────────────────────

export const MOCK_TRIP_CONFIG: TripConfig = {
  id: 'test-trip',
  slug: 'test-trip',
  name: { nl: 'Testreis', en: 'Test Trip' },
  description: { nl: 'Een testreis', en: 'A test trip' },
  region: { nl: 'Test Regio', en: 'Test Region' },
  dates: { start: '2026-06-01', end: '2026-06-07' },
  cities: [
    {
      id: 'testcity',
      name: { nl: 'Teststad', en: 'Test City' },
      color: '#f97316',
      coordinates: { lat: 40.0, lng: -3.0 },
    },
  ],
  categories: ['monument', 'church', 'palace', 'museum', 'neighborhood', 'nature'],
  travelerGroups: [
    { id: 'adults', label: { nl: 'Volwassenen', en: 'Adults' }, defaultCount: 2, hasStudentDiscount: false },
  ],
  stats: { totalDays: 7, totalCities: 1, totalAttractions: 5, totalDistance: '50 km' },
  theme: { primaryColor: '#f97316' },
  highlights: [],
  dataDirectory: 'test-trip',
};

export const MOCK_ATTRACTION: Attraction = {
  id: 'test-attraction',
  name: 'Test Attraction',
  city: 'testcity',
  category: 'monument',
  description: { nl: 'Een test attractie', en: 'A test attraction' },
  coordinates: { lat: 40.0, lng: -3.0 },
  pricing: { adult: 15, student: 10 },
  duration: 90,
  priority: 'essential',
  images: [],
  bookingRequired: false,
};

export const MOCK_RESTAURANT: Restaurant = {
  id: 'test-restaurant',
  name: 'Test Restaurant',
  city: 'testcity',
  neighborhood: 'Centro',
  coordinates: { lat: 40.0, lng: -3.0 },
  cuisine: ['spanish', 'tapas'],
  priceRange: '€€',
};

export const MOCK_COMMENT: DayComment = {
  id: 'test-comment-1',
  author: 'Alice',
  text: 'Great day!',
  timestamp: 1700000000000,
  dayNumber: 1,
};

export const MOCK_TRIP_STORY: TripStory = {
  style: 'adventure',
  generatedAt: 1700000000000,
  title: { nl: 'Avontuur in Andalusië', en: 'Adventure in Andalusia' },
  introduction: { nl: 'Welkom bij deze reis', en: 'Welcome to this trip' },
  chapters: [
    {
      dayNumber: 1,
      city: 'testcity',
      title: { nl: 'Dag 1: Teststad', en: 'Day 1: Test City' },
      blocks: [
        { type: 'narrative', content: { nl: 'Het begon...', en: 'It started...' } },
        {
          type: 'attraction_highlight',
          attractionId: 'test-attraction',
          narrative: { nl: 'Een bijzondere plek', en: 'A special place' },
        },
        {
          type: 'meal_highlight',
          mealType: 'lunch',
          restaurantName: 'Test Restaurant',
          narrative: { nl: 'Lunchpauze', en: 'Lunch break' },
        },
        { type: 'transition', narrative: { nl: 'Daarna...', en: 'Then...' } },
      ],
    },
  ],
  conclusion: { nl: 'Tot ziens', en: 'Goodbye' },
};

export const MOCK_ITINERARY: Itinerary = {
  trip: {
    title: { nl: 'Testreis', en: 'Test Trip' },
    startDate: '2026-06-01',
    endDate: '2026-06-07',
  },
  days: [
    {
      date: '2026-06-01',
      dayNumber: 1,
      city: 'testcity',
      title: { nl: 'Dag 1', en: 'Day 1' },
      activities: [
        { time: '09:00', attractionId: 'test-attraction', duration: 90 },
      ],
      meals: [
        { type: 'lunch', time: '13:00', estimatedCost: 15 },
      ],
    },
  ],
};
