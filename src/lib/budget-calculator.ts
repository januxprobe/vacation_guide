import type {
  Itinerary,
  Attraction,
  BudgetItem,
  BudgetSummary,
  BudgetConfig,
  LocalizedString,
} from '@/types';
import type { TravelerGroup } from '@/config/trip-config';

interface BudgetInput {
  itinerary: Itinerary;
  attractions: Attraction[];
  travelerGroups: TravelerGroup[];
  config: BudgetConfig;
}

export function calculateBudget(input: BudgetInput): BudgetSummary {
  const { itinerary, attractions, travelerGroups, config } = input;
  const items: BudgetItem[] = [];

  // Build attraction lookup
  const attractionMap: Record<string, Attraction> = {};
  for (const a of attractions) {
    attractionMap[a.id] = a;
  }

  // Calculate total travelers
  const totalTravelers = Object.values(config.travelerCounts).reduce((s, c) => s + c, 0);
  if (totalTravelers === 0) {
    return { items: [], subtotalByCategory: {}, total: 0, perPerson: 0 };
  }

  // Count student vs non-student travelers
  let studentCount = 0;
  let nonStudentCount = 0;
  for (const group of travelerGroups) {
    const count = config.travelerCounts[group.id] ?? 0;
    if (group.hasStudentDiscount && config.applyStudentDiscount) {
      studentCount += count;
    } else {
      nonStudentCount += count;
    }
  }

  // Process each day
  for (const day of itinerary.days) {
    // Attraction costs
    for (const activity of day.activities) {
      const attraction = attractionMap[activity.attractionId];
      if (!attraction || attraction.pricing.adult === 0) continue;

      const adultPrice = attraction.pricing.adult;
      const studentPrice =
        config.applyStudentDiscount && attraction.pricing.student != null
          ? attraction.pricing.student
          : adultPrice;

      const total = adultPrice * nonStudentCount + studentPrice * studentCount;

      const name: LocalizedString = {
        nl: attraction.name,
        en: attraction.name,
      };

      items.push({
        name,
        category: 'attractions',
        unitPrice: adultPrice,
        discountedPrice: studentPrice < adultPrice ? studentPrice : undefined,
        quantity: totalTravelers,
        total,
      });
    }

    // Transport costs
    for (const activity of day.activities) {
      if (!activity.transport?.cost) continue;
      const cost = activity.transport.cost;
      const total = cost * totalTravelers;

      const transportName = activity.transport.notes ?? {
        nl: `Vervoer dag ${day.dayNumber}`,
        en: `Transport day ${day.dayNumber}`,
      };

      items.push({
        name: transportName,
        category: 'transport',
        unitPrice: cost,
        quantity: totalTravelers,
        total,
      });
    }

    // Meal costs
    for (const meal of day.meals) {
      const total = meal.estimatedCost * totalTravelers;

      const mealLabel: Record<string, LocalizedString> = {
        breakfast: { nl: `Ontbijt dag ${day.dayNumber}`, en: `Breakfast day ${day.dayNumber}` },
        lunch: { nl: `Lunch dag ${day.dayNumber}`, en: `Lunch day ${day.dayNumber}` },
        dinner: { nl: `Diner dag ${day.dayNumber}`, en: `Dinner day ${day.dayNumber}` },
        snack: { nl: `Snack dag ${day.dayNumber}`, en: `Snack day ${day.dayNumber}` },
      };

      items.push({
        name: mealLabel[meal.type],
        category: 'meals',
        unitPrice: meal.estimatedCost,
        quantity: totalTravelers,
        total,
      });
    }
  }

  // Calculate subtotals
  const subtotalByCategory: Record<string, number> = {};
  for (const item of items) {
    subtotalByCategory[item.category] = (subtotalByCategory[item.category] ?? 0) + item.total;
  }

  const total = Object.values(subtotalByCategory).reduce((s, v) => s + v, 0);
  const perPerson = total / totalTravelers;

  return { items, subtotalByCategory, total, perPerson };
}
