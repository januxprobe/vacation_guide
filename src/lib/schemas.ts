import { z } from 'zod';

const localizedStringSchema = z.object({
  nl: z.string(),
  en: z.string(),
});

const coordinatesSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

const pricingSchema = z.object({
  adult: z.number(),
  student: z.number().optional(),
  child: z.number().optional(),
  guidedTour: z.number().optional(),
  notes: localizedStringSchema.optional(),
});

const openingHoursSchema = z.object({
  monday: z.string().optional(),
  tuesday: z.string().optional(),
  wednesday: z.string().optional(),
  thursday: z.string().optional(),
  friday: z.string().optional(),
  saturday: z.string().optional(),
  sunday: z.string().optional(),
});

const mediaItemSchema = z.object({
  type: z.enum(['image', 'video']),
  src: z.string(),
  alt: localizedStringSchema,
});

export const attractionSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string(),
  category: z.enum([
    'monument',
    'church',
    'palace',
    'museum',
    'neighborhood',
    'nature',
  ]),
  description: localizedStringSchema,
  coordinates: coordinatesSchema,
  pricing: pricingSchema,
  duration: z.number(),
  priority: z.enum(['essential', 'recommended', 'optional']),
  images: z.array(z.string()),
  thumbnail: z.string().optional(),
  media: z.array(mediaItemSchema).optional(),
  bookingRequired: z.boolean(),
  openingHours: openingHoursSchema.optional(),
  website: z.string().optional(),
  tips: localizedStringSchema.optional(),
});

export type AttractionInput = z.infer<typeof attractionSchema>;

// --- Trip Config Schema (for JSON-based trip configs) ---

const cityConfigSchema = z.object({
  id: z.string(),
  name: localizedStringSchema,
  color: z.string(),
  coordinates: coordinatesSchema,
});

const travelerGroupSchema = z.object({
  id: z.string(),
  label: localizedStringSchema,
  defaultCount: z.number(),
  hasStudentDiscount: z.boolean(),
});

export const tripConfigSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: localizedStringSchema,
  description: localizedStringSchema,
  region: localizedStringSchema,
  dates: z.object({ start: z.string(), end: z.string() }),
  cities: z.array(cityConfigSchema),
  categories: z.array(z.string()),
  travelerGroups: z.array(travelerGroupSchema),
  stats: z.object({
    totalDays: z.number(),
    totalCities: z.number(),
    totalAttractions: z.number(),
    totalDistance: z.string(),
  }),
  theme: z.object({
    primaryColor: z.string(),
  }),
  highlights: z.array(z.string()),
  dataDirectory: z.string(),
});

export type TripConfigInput = z.infer<typeof tripConfigSchema>;

// --- Itinerary Schemas ---

const transportSchema = z.object({
  method: z.enum(['walk', 'bus', 'train', 'car']),
  duration: z.number(),
  cost: z.number().optional(),
  notes: localizedStringSchema.optional(),
});

const activitySchema = z.object({
  time: z.string(),
  attractionId: z.string().optional(),
  duration: z.number(),
  notes: localizedStringSchema.optional(),
  transport: transportSchema.optional(),
});

const mealSuggestionSchema = z.object({
  type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  time: z.string(),
  neighborhood: z.string().optional(),
  estimatedCost: z.number(),
  notes: localizedStringSchema.optional(),
  coordinates: coordinatesSchema.optional(),
  restaurantName: z.string().optional(),
});

const itineraryDaySchema = z.object({
  date: z.string(),
  dayNumber: z.number(),
  city: z.string(),
  title: localizedStringSchema,
  activities: z.array(activitySchema),
  meals: z.array(mealSuggestionSchema),
});

export const itinerarySchema = z.object({
  trip: z.object({
    title: localizedStringSchema,
    startDate: z.string(),
    endDate: z.string(),
  }),
  days: z.array(itineraryDaySchema),
});

export type ItineraryInput = z.infer<typeof itinerarySchema>;

// --- Restaurant Schemas ---

export const restaurantSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string(),
  neighborhood: z.string(),
  coordinates: coordinatesSchema,
  cuisine: z.array(z.string()),
  priceRange: z.enum(['€', '€€', '€€€', '€€€€']),
  specialties: localizedStringSchema.optional(),
  description: localizedStringSchema.optional(),
  website: z.string().optional(),
});

export const restaurantsFileSchema = z.object({
  restaurants: z.array(restaurantSchema),
});

export type RestaurantInput = z.infer<typeof restaurantSchema>;
