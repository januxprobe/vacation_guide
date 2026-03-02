import { describe, it, expect } from 'vitest';
import { normalizeItinerary } from '@/lib/normalize-itinerary';

// Helper to create a minimal itinerary shell with one day
function makeItinerary(dayOverrides: Record<string, unknown> = {}) {
  return {
    trip: { title: { nl: 'Test', en: 'Test' }, startDate: '2026-06-01', endDate: '2026-06-07' },
    days: [
      {
        date: '2026-06-01',
        dayNumber: 1,
        city: 'testcity',
        title: { nl: 'Dag 1', en: 'Day 1' },
        activities: [],
        meals: [],
        ...dayOverrides,
      },
    ],
  };
}

// ── Time normalization ──────────────────────────────────────────────

describe('time normalization', () => {
  it('converts AM time to 24h', () => {
    const it = makeItinerary({
      activities: [{ time: '9:00 AM', duration: 60 }],
    });
    normalizeItinerary(it);
    expect(it.days[0].activities[0].time).toBe('09:00');
  });

  it('converts PM time to 24h', () => {
    const it = makeItinerary({
      activities: [{ time: '2:30 PM', duration: 60 }],
    });
    normalizeItinerary(it);
    expect(it.days[0].activities[0].time).toBe('14:30');
  });

  it('converts 12:00 PM to 12:00', () => {
    const it = makeItinerary({
      meals: [{ type: 'lunch', time: '12:00 PM', estimatedCost: 15 }],
    });
    normalizeItinerary(it);
    expect(it.days[0].meals[0].time).toBe('12:00');
  });

  it('converts 12:00 AM to 00:00', () => {
    const it = makeItinerary({
      activities: [{ time: '12:00 AM', duration: 60 }],
    });
    normalizeItinerary(it);
    expect(it.days[0].activities[0].time).toBe('00:00');
  });

  it('strips seconds from 24h time', () => {
    const it = makeItinerary({
      activities: [{ time: '10:30:00', duration: 60 }],
    });
    normalizeItinerary(it);
    expect(it.days[0].activities[0].time).toBe('10:30');
  });

  it('zero-pads single-digit hours', () => {
    const it = makeItinerary({
      activities: [{ time: '9:00', duration: 60 }],
    });
    normalizeItinerary(it);
    expect(it.days[0].activities[0].time).toBe('09:00');
  });
});

// ── Transport method normalization ──────────────────────────────────

describe('transport method normalization', () => {
  it('normalizes "Walk" to "walk"', () => {
    const it = makeItinerary({
      activities: [{ time: '09:00', duration: 60, transport: { method: 'Walk', duration: 15 } }],
    });
    normalizeItinerary(it);
    expect(it.days[0].activities[0].transport.method).toBe('walk');
  });

  it('normalizes "taxi" to "car"', () => {
    const it = makeItinerary({
      activities: [{ time: '09:00', duration: 60, transport: { method: 'taxi', duration: 15 } }],
    });
    normalizeItinerary(it);
    expect(it.days[0].activities[0].transport.method).toBe('car');
  });

  it('normalizes "metro" to "train"', () => {
    const it = makeItinerary({
      activities: [{ time: '09:00', duration: 60, transport: { method: 'metro', duration: 10 } }],
    });
    normalizeItinerary(it);
    expect(it.days[0].activities[0].transport.method).toBe('train');
  });

  it('normalizes "shuttle" to "bus"', () => {
    const it = makeItinerary({
      activities: [{ time: '09:00', duration: 60, transport: { method: 'shuttle', duration: 20 } }],
    });
    normalizeItinerary(it);
    expect(it.days[0].activities[0].transport.method).toBe('bus');
  });

  it('falls back to "walk" for unknown methods', () => {
    const it = makeItinerary({
      activities: [{ time: '09:00', duration: 60, transport: { method: 'helicopter', duration: 5 } }],
    });
    normalizeItinerary(it);
    expect(it.days[0].activities[0].transport.method).toBe('walk');
  });

  it('coerces transport duration from string to number', () => {
    const it = makeItinerary({
      activities: [{ time: '09:00', duration: 60, transport: { method: 'walk', duration: '15' } }],
    });
    normalizeItinerary(it);
    expect(it.days[0].activities[0].transport.duration).toBe(15);
  });

  it('defaults transport duration to 15 when missing/invalid', () => {
    const it = makeItinerary({
      activities: [{ time: '09:00', duration: 60, transport: { method: 'walk', duration: 'abc' } }],
    });
    normalizeItinerary(it);
    expect(it.days[0].activities[0].transport.duration).toBe(15);
  });
});

// ── Meal type normalization ─────────────────────────────────────────

describe('meal type normalization', () => {
  it('normalizes "Breakfast" to "breakfast"', () => {
    const it = makeItinerary({
      meals: [{ type: 'Breakfast', time: '08:00', estimatedCost: 10 }],
    });
    normalizeItinerary(it);
    expect(it.days[0].meals[0].type).toBe('breakfast');
  });

  it('normalizes "supper" to "dinner"', () => {
    const it = makeItinerary({
      meals: [{ type: 'supper', time: '20:00', estimatedCost: 25 }],
    });
    normalizeItinerary(it);
    expect(it.days[0].meals[0].type).toBe('dinner');
  });

  it('normalizes "tapas" to "snack"', () => {
    const it = makeItinerary({
      meals: [{ type: 'tapas', time: '17:00', estimatedCost: 12 }],
    });
    normalizeItinerary(it);
    expect(it.days[0].meals[0].type).toBe('snack');
  });

  it('normalizes "brunch" to "breakfast"', () => {
    const it = makeItinerary({
      meals: [{ type: 'brunch', time: '10:30', estimatedCost: 18 }],
    });
    normalizeItinerary(it);
    expect(it.days[0].meals[0].type).toBe('breakfast');
  });

  it('falls back to "snack" for unknown meal types', () => {
    const it = makeItinerary({
      meals: [{ type: 'elevenses', time: '11:00', estimatedCost: 5 }],
    });
    normalizeItinerary(it);
    expect(it.days[0].meals[0].type).toBe('snack');
  });
});

// ── String → number coercion ────────────────────────────────────────

describe('string → number coercion', () => {
  it('coerces activity duration from string to number', () => {
    const it = makeItinerary({
      activities: [{ time: '09:00', duration: '90' }],
    });
    normalizeItinerary(it);
    expect(it.days[0].activities[0].duration).toBe(90);
  });

  it('defaults activity duration to 60 when invalid', () => {
    const it = makeItinerary({
      activities: [{ time: '09:00', duration: 'abc' }],
    });
    normalizeItinerary(it);
    expect(it.days[0].activities[0].duration).toBe(60);
  });

  it('coerces meal estimatedCost from string to number', () => {
    const it = makeItinerary({
      meals: [{ type: 'lunch', time: '13:00', estimatedCost: '15' }],
    });
    normalizeItinerary(it);
    expect(it.days[0].meals[0].estimatedCost).toBe(15);
  });

  it('defaults meal estimatedCost to 10 when invalid', () => {
    const it = makeItinerary({
      meals: [{ type: 'lunch', time: '13:00', estimatedCost: 'free' }],
    });
    normalizeItinerary(it);
    expect(it.days[0].meals[0].estimatedCost).toBe(10);
  });

  it('coerces dayNumber from string to number', () => {
    const it = makeItinerary({ dayNumber: '3' });
    normalizeItinerary(it);
    expect(it.days[0].dayNumber).toBe(3);
  });
});

// ── Localized string normalization ──────────────────────────────────

describe('localized string normalization', () => {
  it('converts plain string title to {nl, en}', () => {
    const it = makeItinerary({ title: 'Day One' });
    normalizeItinerary(it);
    expect(it.days[0].title).toEqual({ nl: 'Day One', en: 'Day One' });
  });

  it('copies nl to en when en is missing', () => {
    const it = makeItinerary({ title: { nl: 'Dag 1' } });
    normalizeItinerary(it);
    expect(it.days[0].title).toEqual({ nl: 'Dag 1', en: 'Dag 1' });
  });

  it('copies en to nl when nl is missing', () => {
    const it = makeItinerary({ title: { en: 'Day 1' } });
    normalizeItinerary(it);
    expect(it.days[0].title).toEqual({ nl: 'Day 1', en: 'Day 1' });
  });

  it('converts plain string trip title to {nl, en}', () => {
    const it = {
      trip: { title: 'My Trip', startDate: '2026-06-01', endDate: '2026-06-07' },
      days: [],
    };
    normalizeItinerary(it);
    expect(it.trip.title).toEqual({ nl: 'My Trip', en: 'My Trip' });
  });

  it('converts activity notes from plain string', () => {
    const it = makeItinerary({
      activities: [{ time: '09:00', duration: 60, notes: 'Bring water' }],
    });
    normalizeItinerary(it);
    expect(it.days[0].activities[0].notes).toEqual({ nl: 'Bring water', en: 'Bring water' });
  });

  it('removes invalid notes value', () => {
    const it = makeItinerary({
      activities: [{ time: '09:00', duration: 60, notes: 123 }],
    });
    normalizeItinerary(it);
    expect(it.days[0].activities[0].notes).toBeUndefined();
  });
});

// ── Coordinate normalization ────────────────────────────────────────

describe('coordinate normalization', () => {
  it('converts {latitude, longitude} to {lat, lng}', () => {
    const it = makeItinerary({
      meals: [{ type: 'lunch', time: '13:00', estimatedCost: 15, coordinates: { latitude: 40.1, longitude: -3.5 } }],
    });
    normalizeItinerary(it);
    expect(it.days[0].meals[0].coordinates).toEqual({ lat: 40.1, lng: -3.5 });
  });

  it('converts string coordinates to numbers', () => {
    const it = makeItinerary({
      meals: [{ type: 'lunch', time: '13:00', estimatedCost: 15, coordinates: { lat: '40.1', lng: '-3.5' } }],
    });
    normalizeItinerary(it);
    expect(it.days[0].meals[0].coordinates).toEqual({ lat: 40.1, lng: -3.5 });
  });

  it('removes invalid coordinates', () => {
    const it = makeItinerary({
      meals: [{ type: 'lunch', time: '13:00', estimatedCost: 15, coordinates: { lat: 'abc' } }],
    });
    normalizeItinerary(it);
    expect(it.days[0].meals[0].coordinates).toBeUndefined();
  });
});

// ── Edge cases ──────────────────────────────────────────────────────

describe('edge cases', () => {
  it('handles null input gracefully', () => {
    expect(() => normalizeItinerary(null)).not.toThrow();
  });

  it('handles undefined input gracefully', () => {
    expect(() => normalizeItinerary(undefined)).not.toThrow();
  });

  it('handles array input gracefully', () => {
    expect(() => normalizeItinerary([])).not.toThrow();
  });

  it('handles missing days array', () => {
    const it = { trip: { title: { nl: 'T', en: 'T' }, startDate: '2026-01-01', endDate: '2026-01-02' } };
    expect(() => normalizeItinerary(it)).not.toThrow();
  });

  it('handles missing activities/meals by defaulting to empty arrays', () => {
    const it = makeItinerary({ activities: undefined, meals: undefined });
    normalizeItinerary(it);
    expect(it.days[0].activities).toEqual([]);
    expect(it.days[0].meals).toEqual([]);
  });

  it('converts attractionId: null to undefined (delete the key)', () => {
    const it = makeItinerary({
      activities: [
        { time: '10:00', attractionId: null, duration: 60 },
        { time: '14:00', attractionId: 'rome-colosseum', duration: 90 },
      ],
    });
    normalizeItinerary(it);
    expect(it.days[0].activities[0].attractionId).toBeUndefined();
    expect('attractionId' in it.days[0].activities[0]).toBe(false);
    expect(it.days[0].activities[1].attractionId).toBe('rome-colosseum');
  });
});
