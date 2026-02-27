import type {
  Itinerary,
  Attraction,
  BudgetItem,
  BudgetSummary,
  BudgetConfig,
  DayBudget,
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
    return { items: [], days: [], subtotalByCategory: {}, total: 0, perPerson: 0 };
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
  const days: DayBudget[] = [];

  for (const day of itinerary.days) {
    const dayItems: BudgetItem[] = [];
    let attractionsCost = 0;
    let transportCost = 0;
    let mealsCost = 0;

    // Attraction costs (include free attractions so every activity appears in the breakdown)
    for (const activity of day.activities) {
      if (!activity.attractionId) continue;
      const attraction = attractionMap[activity.attractionId];
      if (!attraction) continue;

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

      const item: BudgetItem = {
        name,
        category: 'attractions',
        unitPrice: adultPrice,
        discountedPrice: studentPrice < adultPrice ? studentPrice : undefined,
        quantity: totalTravelers,
        total,
      };

      items.push(item);
      dayItems.push(item);
      attractionsCost += total;
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

      const item: BudgetItem = {
        name: transportName,
        category: 'transport',
        unitPrice: cost,
        quantity: totalTravelers,
        total,
      };

      items.push(item);
      dayItems.push(item);
      transportCost += total;
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

      const item: BudgetItem = {
        name: mealLabel[meal.type],
        category: 'meals',
        unitPrice: meal.estimatedCost,
        quantity: totalTravelers,
        total,
      };

      items.push(item);
      dayItems.push(item);
      mealsCost += total;
    }

    days.push({
      dayNumber: day.dayNumber,
      city: day.city,
      title: day.title,
      attractionsCost,
      transportCost,
      mealsCost,
      total: attractionsCost + transportCost + mealsCost,
      items: dayItems,
    });
  }

  // Calculate subtotals
  const subtotalByCategory: Record<string, number> = {};
  for (const item of items) {
    subtotalByCategory[item.category] = (subtotalByCategory[item.category] ?? 0) + item.total;
  }

  const total = Object.values(subtotalByCategory).reduce((s, v) => s + v, 0);
  const perPerson = total / totalTravelers;

  return { items, days, subtotalByCategory, total, perPerson };
}
