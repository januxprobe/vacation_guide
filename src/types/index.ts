export type MediaType = 'image' | 'video';

export interface MediaItem {
  type: MediaType;
  src: string;              // Local path for images, YouTube ID for videos
  alt: LocalizedString;
}

export type City = string;

export type AttractionCategory =
  | 'monument'
  | 'church'
  | 'palace'
  | 'museum'
  | 'neighborhood'
  | 'nature';

export type Priority = 'essential' | 'recommended' | 'optional';

export type TransportMethod = 'walk' | 'bus' | 'train' | 'car';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface LocalizedString {
  nl: string;
  en: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Pricing {
  adult: number;
  student?: number;
  child?: number;
  guidedTour?: number;
  notes?: LocalizedString;
}

export interface OpeningHours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

export interface Attraction {
  id: string;
  name: string;
  city: City;
  category: AttractionCategory;
  description: LocalizedString;
  coordinates: Coordinates;
  pricing: Pricing;
  duration: number; // minutes
  priority: Priority;
  images: string[];
  thumbnail?: string;
  media?: MediaItem[];
  bookingRequired: boolean;
  openingHours?: OpeningHours;
  website?: string;
  tips?: LocalizedString;
}

export interface Transport {
  method: TransportMethod;
  duration: number; // minutes
  cost?: number;
  notes?: LocalizedString;
}

export interface Activity {
  time: string; // "09:00"
  attractionId?: string;
  duration: number; // minutes
  notes?: LocalizedString;
  transport?: Transport;
}

export interface MealSuggestion {
  type: MealType;
  time: string;
  neighborhood?: string;
  estimatedCost: number;
  notes?: LocalizedString;
  coordinates?: Coordinates;
  restaurantName?: string;
}

export interface ItineraryDay {
  date: string; // ISO format
  dayNumber: number;
  city: City;
  title: LocalizedString;
  activities: Activity[];
  meals: MealSuggestion[];
}

export interface Itinerary {
  trip: {
    title: LocalizedString;
    startDate: string;
    endDate: string;
  };
  days: ItineraryDay[];
}

export interface Restaurant {
  id: string;
  name: string;
  city: City;
  neighborhood: string;
  coordinates: Coordinates;
  cuisine: string[];
  priceRange: '€' | '€€' | '€€€' | '€€€€';
  specialties?: LocalizedString;
  description?: LocalizedString;
  website?: string;
}

export interface BudgetConfig {
  travelerCounts: Record<string, number>;
  applyStudentDiscount: boolean;
}

export interface BudgetItem {
  name: LocalizedString;
  category: 'attractions' | 'transport' | 'meals' | 'accommodation';
  unitPrice: number;
  discountedPrice?: number;
  quantity: number;
  total: number;
}

export interface DayBudget {
  dayNumber: number;
  city: City;
  title: LocalizedString;
  attractionsCost: number;
  transportCost: number;
  mealsCost: number;
  total: number;
  items: BudgetItem[];
}

export interface BudgetSummary {
  items: BudgetItem[];
  days: DayBudget[];
  subtotalByCategory: Record<string, number>;
  total: number;
  perPerson: number;
}

export interface CityInfo {
  id: City;
  name: string;
  description: LocalizedString;
  coordinates: Coordinates;
  color: string; // Hex color for map markers
  attractions: string[]; // attraction IDs
}
