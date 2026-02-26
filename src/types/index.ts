export type City = 'seville' | 'cordoba' | 'granada';

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
  attractionId: string;
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
  adults50Plus: number;
  youngAdults20: number;
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

export interface BudgetSummary {
  items: BudgetItem[];
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
