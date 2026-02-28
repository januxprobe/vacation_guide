import { describe, it, expect } from 'vitest';
import { calculateBudget } from '@/lib/budget-calculator';
import type { Itinerary, Attraction, BudgetConfig } from '@/types';
import type { TravelerGroup } from '@/config/trip-config';

// Minimal fixtures
const travelerGroups: TravelerGroup[] = [
  { id: 'adults', label: { nl: 'Volwassenen', en: 'Adults' }, defaultCount: 2, hasStudentDiscount: false },
  { id: 'students', label: { nl: 'Studenten', en: 'Students' }, defaultCount: 1, hasStudentDiscount: true },
];

const attractions: Attraction[] = [
  {
    id: 'alcazar',
    name: 'Real Alcázar',
    city: 'seville',
    category: 'palace',
    description: { nl: 'Paleis', en: 'Palace' },
    coordinates: { lat: 37.3826, lng: -5.9906 },
    pricing: { adult: 20, student: 10 },
    duration: 120,
    priority: 'essential',
    images: [],
    bookingRequired: true,
  },
  {
    id: 'plaza',
    name: 'Plaza de España',
    city: 'seville',
    category: 'monument',
    description: { nl: 'Plein', en: 'Square' },
    coordinates: { lat: 37.3772, lng: -5.9869 },
    pricing: { adult: 0 },
    duration: 60,
    priority: 'essential',
    images: [],
    bookingRequired: false,
  },
];

function makeItinerary(activities: { attractionId?: string; time: string; duration: number; transportCost?: number }[]): Itinerary {
  return {
    trip: { title: { nl: 'Test', en: 'Test' }, startDate: '2026-09-01', endDate: '2026-09-07' },
    days: [
      {
        date: '2026-09-01',
        dayNumber: 1,
        city: 'seville',
        title: { nl: 'Dag 1', en: 'Day 1' },
        activities: activities.map((a) => ({
          time: a.time,
          duration: a.duration,
          attractionId: a.attractionId,
          transport: a.transportCost ? { method: 'walk' as const, duration: 15, cost: a.transportCost } : undefined,
        })),
        meals: [
          { type: 'lunch' as const, time: '13:00', estimatedCost: 15 },
        ],
      },
    ],
  };
}

describe('calculateBudget', () => {
  const baseConfig: BudgetConfig = {
    travelerCounts: { adults: 2, students: 1 },
    applyStudentDiscount: true,
  };

  it('returns zero totals when there are no travelers', () => {
    const result = calculateBudget({
      itinerary: makeItinerary([{ attractionId: 'alcazar', time: '09:00', duration: 120 }]),
      attractions,
      travelerGroups,
      config: { travelerCounts: { adults: 0, students: 0 }, applyStudentDiscount: true },
    });
    expect(result.total).toBe(0);
    expect(result.items).toEqual([]);
  });

  it('calculates attraction costs with student discount', () => {
    const result = calculateBudget({
      itinerary: makeItinerary([{ attractionId: 'alcazar', time: '09:00', duration: 120 }]),
      attractions,
      travelerGroups,
      config: baseConfig,
    });

    // 2 adults * €20 + 1 student * €10 = €50
    const attractionItems = result.items.filter((i) => i.category === 'attractions');
    expect(attractionItems).toHaveLength(1);
    expect(attractionItems[0].total).toBe(50);
  });

  it('calculates attraction costs without student discount', () => {
    const result = calculateBudget({
      itinerary: makeItinerary([{ attractionId: 'alcazar', time: '09:00', duration: 120 }]),
      attractions,
      travelerGroups,
      config: { ...baseConfig, applyStudentDiscount: false },
    });

    // All 3 travelers pay adult price: 3 * €20 = €60
    const attractionItems = result.items.filter((i) => i.category === 'attractions');
    expect(attractionItems[0].total).toBe(60);
  });

  it('includes free attractions with zero total', () => {
    const result = calculateBudget({
      itinerary: makeItinerary([{ attractionId: 'plaza', time: '09:00', duration: 60 }]),
      attractions,
      travelerGroups,
      config: baseConfig,
    });

    const attractionItems = result.items.filter((i) => i.category === 'attractions');
    expect(attractionItems).toHaveLength(1);
    expect(attractionItems[0].total).toBe(0);
  });

  it('calculates meal costs correctly', () => {
    const result = calculateBudget({
      itinerary: makeItinerary([]),
      attractions,
      travelerGroups,
      config: baseConfig,
    });

    // 1 lunch at €15 * 3 travelers = €45
    const mealItems = result.items.filter((i) => i.category === 'meals');
    expect(mealItems).toHaveLength(1);
    expect(mealItems[0].total).toBe(45);
  });

  it('calculates transport costs correctly', () => {
    const result = calculateBudget({
      itinerary: makeItinerary([{ attractionId: 'alcazar', time: '09:00', duration: 120, transportCost: 5 }]),
      attractions,
      travelerGroups,
      config: baseConfig,
    });

    const transportItems = result.items.filter((i) => i.category === 'transport');
    expect(transportItems).toHaveLength(1);
    expect(transportItems[0].total).toBe(15); // €5 * 3 travelers
  });

  it('calculates per-person cost correctly', () => {
    const result = calculateBudget({
      itinerary: makeItinerary([{ attractionId: 'alcazar', time: '09:00', duration: 120 }]),
      attractions,
      travelerGroups,
      config: baseConfig,
    });

    // Attraction: €50, Meal: €45 = €95 total / 3 persons
    expect(result.perPerson).toBeCloseTo(95 / 3, 2);
  });

  it('skips activities without attractionId', () => {
    const result = calculateBudget({
      itinerary: makeItinerary([{ time: '09:00', duration: 60 }]),
      attractions,
      travelerGroups,
      config: baseConfig,
    });

    const attractionItems = result.items.filter((i) => i.category === 'attractions');
    expect(attractionItems).toHaveLength(0);
  });

  describe('excludedActivityIds (what-if mode)', () => {
    it('sets total to 0 for excluded attractions', () => {
      const result = calculateBudget({
        itinerary: makeItinerary([{ attractionId: 'alcazar', time: '09:00', duration: 120 }]),
        attractions,
        travelerGroups,
        config: baseConfig,
        excludedActivityIds: new Set(['alcazar']),
      });

      const attractionItems = result.items.filter((i) => i.category === 'attractions');
      expect(attractionItems).toHaveLength(1);
      expect(attractionItems[0].total).toBe(0);
      expect(attractionItems[0].excluded).toBe(true);
    });

    it('marks non-excluded items as not excluded', () => {
      const result = calculateBudget({
        itinerary: makeItinerary([
          { attractionId: 'alcazar', time: '09:00', duration: 120 },
          { attractionId: 'plaza', time: '12:00', duration: 60 },
        ]),
        attractions,
        travelerGroups,
        config: baseConfig,
        excludedActivityIds: new Set(['alcazar']),
      });

      const alcazar = result.items.find((i) => i.attractionId === 'alcazar');
      const plaza = result.items.find((i) => i.attractionId === 'plaza');
      expect(alcazar?.excluded).toBe(true);
      expect(alcazar?.total).toBe(0);
      expect(plaza?.excluded).toBe(false);
    });

    it('reduces day total when activities are excluded', () => {
      const result = calculateBudget({
        itinerary: makeItinerary([{ attractionId: 'alcazar', time: '09:00', duration: 120 }]),
        attractions,
        travelerGroups,
        config: baseConfig,
        excludedActivityIds: new Set(['alcazar']),
      });

      // Attraction excluded (€0), meal still counted (€45)
      expect(result.days[0].attractionsCost).toBe(0);
      expect(result.days[0].mealsCost).toBe(45);
      expect(result.days[0].total).toBe(45);
    });

    it('does not exclude non-matching IDs', () => {
      const result = calculateBudget({
        itinerary: makeItinerary([{ attractionId: 'alcazar', time: '09:00', duration: 120 }]),
        attractions,
        travelerGroups,
        config: baseConfig,
        excludedActivityIds: new Set(['nonexistent']),
      });

      const attractionItems = result.items.filter((i) => i.category === 'attractions');
      expect(attractionItems[0].total).toBe(50);
      expect(attractionItems[0].excluded).toBe(false);
    });
  });

  it('produces correct subtotalByCategory', () => {
    const result = calculateBudget({
      itinerary: makeItinerary([
        { attractionId: 'alcazar', time: '09:00', duration: 120, transportCost: 5 },
      ]),
      attractions,
      travelerGroups,
      config: baseConfig,
    });

    expect(result.subtotalByCategory['attractions']).toBe(50);
    expect(result.subtotalByCategory['transport']).toBe(15);
    expect(result.subtotalByCategory['meals']).toBe(45);
    expect(result.total).toBe(110);
  });
});
