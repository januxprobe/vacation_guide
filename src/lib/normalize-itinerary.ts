/**
 * Normalize AI-generated itinerary data before Zod validation.
 *
 * Gemini frequently produces slightly off values (capitalized enums,
 * synonyms, plain strings instead of {nl, en} objects, AM/PM times,
 * stringified numbers). This mirrors the existing attraction normalization
 * pattern (CATEGORY_MAP / PRIORITY_MAP in the attractions endpoint).
 */

// ── Enum normalization maps ──────────────────────────────────────────

const TRANSPORT_METHOD_MAP: Record<string, string> = {
  walk: 'walk', walking: 'walk', foot: 'walk', 'on foot': 'walk',
  bus: 'bus', shuttle: 'bus', minibus: 'bus',
  train: 'train', metro: 'train', tram: 'train', subway: 'train', rail: 'train',
  car: 'car', taxi: 'car', cab: 'car', drive: 'car', uber: 'car', rideshare: 'car',
};
const VALID_TRANSPORT_METHODS = new Set(['walk', 'bus', 'train', 'car']);

const MEAL_TYPE_MAP: Record<string, string> = {
  breakfast: 'breakfast', brunch: 'breakfast', 'morning coffee': 'breakfast',
  lunch: 'lunch', middag: 'lunch',
  dinner: 'dinner', supper: 'dinner', 'evening meal': 'dinner',
  snack: 'snack', coffee: 'snack', tapas: 'snack', drinks: 'snack', dessert: 'snack', tea: 'snack',
};
const VALID_MEAL_TYPES = new Set(['breakfast', 'lunch', 'dinner', 'snack']);

// ── Helpers ──────────────────────────────────────────────────────────

/** Coerce a value to a number if it is a numeric string. */
function toNumber(v: unknown): number | undefined {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return undefined;
}

/**
 * Convert "10:30 AM" / "2:30 PM" → "14:30".
 * Also strips seconds ("10:30:00" → "10:30") and zero-pads hours ("9:00" → "09:00").
 */
function normalizeTime(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  let s = v.trim();

  // Handle AM/PM
  const ampm = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (ampm) {
    let h = parseInt(ampm[1], 10);
    const m = ampm[2];
    const period = ampm[4].toUpperCase();
    if (period === 'PM' && h < 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${m}`;
  }

  // Already 24-hour – strip optional seconds and zero-pad
  const hm = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (hm) {
    return `${String(parseInt(hm[1], 10)).padStart(2, '0')}:${hm[2]}`;
  }

  return s; // pass through as-is; let Zod reject if truly invalid
}

/**
 * Ensure a value is a LocalizedString `{ nl, en }`.
 * - plain string → duplicated into both locales
 * - object with only nl or only en → copy the present one
 * - anything else → undefined (caller should delete)
 */
function toLocalizedString(v: unknown): { nl: string; en: string } | undefined {
  if (typeof v === 'string') return { nl: v, en: v };
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const obj = v as Record<string, unknown>;
    const nl = typeof obj.nl === 'string' ? obj.nl : undefined;
    const en = typeof obj.en === 'string' ? obj.en : undefined;
    if (nl || en) return { nl: nl ?? en!, en: en ?? nl! };
  }
  return undefined;
}

/**
 * Normalize coordinates object.
 * Handles: { latitude, longitude } → { lat, lng }, string-typed numbers.
 */
function normalizeCoordinates(v: unknown): { lat: number; lng: number } | undefined {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined;
  const obj = v as Record<string, unknown>;

  const lat = toNumber(obj.lat ?? obj.latitude);
  const lng = toNumber(obj.lng ?? obj.longitude ?? obj.lon);

  if (lat !== undefined && lng !== undefined) return { lat, lng };
  return undefined;
}

// ── Main normalizer ──────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */

function normalizeTransport(t: any): void {
  if (!t || typeof t !== 'object') return;

  // method enum
  if (typeof t.method === 'string') {
    const lower = t.method.toLowerCase();
    if (!VALID_TRANSPORT_METHODS.has(lower)) {
      t.method = TRANSPORT_METHOD_MAP[lower] ?? 'walk';
    } else {
      t.method = lower;
    }
  }

  // duration: string → number
  const dur = toNumber(t.duration);
  if (dur !== undefined) t.duration = dur; else t.duration = 15;

  // cost: string → number
  if (t.cost !== undefined) {
    const c = toNumber(t.cost);
    if (c !== undefined) t.cost = c; else delete t.cost;
  }

  // notes: ensure LocalizedString or remove
  if (t.notes !== undefined) {
    const n = toLocalizedString(t.notes);
    if (n) t.notes = n; else delete t.notes;
  }
}

function normalizeMeal(meal: any): void {
  if (!meal || typeof meal !== 'object') return;

  // type enum
  if (typeof meal.type === 'string') {
    const lower = meal.type.toLowerCase();
    if (!VALID_MEAL_TYPES.has(lower)) {
      meal.type = MEAL_TYPE_MAP[lower] ?? 'snack';
    } else {
      meal.type = lower;
    }
  }

  // time
  const time = normalizeTime(meal.time);
  if (time) meal.time = time;

  // estimatedCost: string → number
  const cost = toNumber(meal.estimatedCost);
  if (cost !== undefined) meal.estimatedCost = cost; else meal.estimatedCost = 10;

  // notes: LocalizedString or remove
  if (meal.notes !== undefined) {
    const n = toLocalizedString(meal.notes);
    if (n) meal.notes = n; else delete meal.notes;
  }

  // coordinates: normalize or remove
  if (meal.coordinates !== undefined) {
    const c = normalizeCoordinates(meal.coordinates);
    if (c) meal.coordinates = c; else delete meal.coordinates;
  }
}

function normalizeActivity(act: any): void {
  if (!act || typeof act !== 'object') return;

  // time
  const time = normalizeTime(act.time);
  if (time) act.time = time;

  // duration: string → number
  const dur = toNumber(act.duration);
  if (dur !== undefined) act.duration = dur; else act.duration = 60;

  // notes: LocalizedString or remove
  if (act.notes !== undefined) {
    const n = toLocalizedString(act.notes);
    if (n) act.notes = n; else delete act.notes;
  }

  // transport sub-object
  if (act.transport) {
    normalizeTransport(act.transport);
  }
}

function normalizeDay(day: any): void {
  if (!day || typeof day !== 'object') return;

  // dayNumber: string → number
  const dn = toNumber(day.dayNumber);
  if (dn !== undefined) day.dayNumber = dn;

  // title: LocalizedString
  if (day.title !== undefined) {
    const t = toLocalizedString(day.title);
    if (t) day.title = t;
  }

  // activities
  if (Array.isArray(day.activities)) {
    day.activities.forEach(normalizeActivity);
  } else {
    day.activities = [];
  }

  // meals
  if (Array.isArray(day.meals)) {
    day.meals.forEach(normalizeMeal);
  } else {
    day.meals = [];
  }
}

/**
 * Mutates the itinerary object in-place, normalizing AI-generated values
 * so they pass Zod validation. Call this **before** `itinerarySchema.safeParse()`.
 */
export function normalizeItinerary(itinerary: unknown): void {
  if (!itinerary || typeof itinerary !== 'object' || Array.isArray(itinerary)) return;
  const it = itinerary as any;

  // trip metadata
  if (it.trip && typeof it.trip === 'object') {
    if (it.trip.title !== undefined) {
      const t = toLocalizedString(it.trip.title);
      if (t) it.trip.title = t;
    }
  }

  // days array
  if (Array.isArray(it.days)) {
    it.days.forEach(normalizeDay);
  }
}
