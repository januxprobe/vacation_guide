import { NextResponse } from 'next/server';
import { getTripRepository } from '@/lib/repositories';
import { tripConfigSchema } from '@/lib/schemas';

function ensureLocalizedString(val: unknown): { nl: string; en: string } | undefined {
  if (val && typeof val === 'object' && 'nl' in val && 'en' in val) {
    return val as { nl: string; en: string };
  }
  if (typeof val === 'string' && val) {
    return { nl: val, en: val };
  }
  return undefined;
}

function normalizeTripConfig(body: Record<string, unknown>): void {
  // Fix localized fields: plain string → { nl, en }
  for (const field of ['name', 'description', 'region'] as const) {
    const fixed = ensureLocalizedString(body[field]);
    if (fixed) body[field] = fixed;
  }

  // Fix cities array
  if (Array.isArray(body.cities)) {
    for (const city of body.cities) {
      if (city && typeof city === 'object') {
        const c = city as Record<string, unknown>;
        // Fix city name
        const fixedName = ensureLocalizedString(c.name);
        if (fixedName) c.name = fixedName;
        // Fix coordinates: latitude/longitude → lat/lng
        if (c.coordinates && typeof c.coordinates === 'object') {
          const coords = c.coordinates as Record<string, unknown>;
          if ('latitude' in coords && !('lat' in coords)) {
            coords.lat = coords.latitude; delete coords.latitude;
          }
          if ('longitude' in coords && !('lng' in coords)) {
            coords.lng = coords.longitude; delete coords.longitude;
          }
          if (typeof coords.lat !== 'number') coords.lat = Number(coords.lat) || 0;
          if (typeof coords.lng !== 'number') coords.lng = Number(coords.lng) || 0;
        }
        // Ensure color exists
        if (!c.color || typeof c.color !== 'string') {
          c.color = '#6366f1';
        }
      }
    }
  }

  // Fix stats: ensure numbers
  if (body.stats && typeof body.stats === 'object') {
    const stats = body.stats as Record<string, unknown>;
    for (const numField of ['totalDays', 'totalCities', 'totalAttractions']) {
      if (typeof stats[numField] !== 'number') {
        stats[numField] = Number(stats[numField]) || 0;
      }
    }
    if (typeof stats.totalDistance !== 'string') {
      stats.totalDistance = String(stats.totalDistance || '~0 km');
    }
  } else {
    // Generate stats from available data
    const cities = Array.isArray(body.cities) ? body.cities : [];
    body.stats = {
      totalDays: 1,
      totalCities: cities.length,
      totalAttractions: 0,
      totalDistance: '~0 km',
    };
  }

  // Fix theme
  if (!body.theme || typeof body.theme !== 'object') {
    const firstCityColor = Array.isArray(body.cities) && body.cities[0]
      ? (body.cities[0] as Record<string, unknown>).color || '#6366f1'
      : '#6366f1';
    body.theme = { primaryColor: firstCityColor };
  } else {
    const theme = body.theme as Record<string, unknown>;
    if (!theme.primaryColor || typeof theme.primaryColor !== 'string') {
      theme.primaryColor = '#6366f1';
    }
  }

  // Fix travelerGroups: normalize individual entries
  if (Array.isArray(body.travelerGroups)) {
    for (const group of body.travelerGroups) {
      if (group && typeof group === 'object') {
        const g = group as Record<string, unknown>;
        const fixedLabel = ensureLocalizedString(g.label);
        if (fixedLabel) g.label = fixedLabel;
        if (typeof g.defaultCount !== 'number') g.defaultCount = Number(g.defaultCount) || 1;
        if (typeof g.hasStudentDiscount !== 'boolean') g.hasStudentDiscount = false;
      }
    }
  }

  // Fix dates: ensure object with start/end strings
  if (body.dates && typeof body.dates === 'object') {
    const dates = body.dates as Record<string, unknown>;
    if (typeof dates.start !== 'string') dates.start = String(dates.start || '');
    if (typeof dates.end !== 'string') dates.end = String(dates.end || '');
  }
}

export async function GET() {
  try {
    const tripRepo = getTripRepository();
    const trips = await tripRepo.getAll();
    return NextResponse.json(trips);
  } catch (error) {
    console.error('Failed to load trips:', error);
    return NextResponse.json({ error: 'Failed to load trips' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Fill defaults for fields AI might omit
    if (!body.dataDirectory && body.slug) body.dataDirectory = body.slug;
    if (!body.id && body.slug) body.id = body.slug;
    if (!body.categories) {
      body.categories = ['monument', 'church', 'palace', 'museum', 'neighborhood', 'nature'];
    }
    if (!body.highlights) body.highlights = [];
    if (!body.travelerGroups) body.travelerGroups = [];

    // Normalize AI-generated data before validation
    normalizeTripConfig(body);

    const parsed = tripConfigSchema.safeParse(body);

    if (!parsed.success) {
      console.error('Trip config validation failed:', JSON.stringify(parsed.error.format(), null, 2));
      return NextResponse.json(
        { error: 'Invalid trip config', details: parsed.error.format() },
        { status: 400 }
      );
    }

    let tripConfig = parsed.data;
    const tripRepo = getTripRepository();

    // Auto-deduplicate slug if it already exists
    let finalSlug = tripConfig.slug;
    let counter = 2;
    while (await tripRepo.getBySlug(finalSlug)) {
      finalSlug = `${tripConfig.slug}-${counter}`;
      counter++;
    }
    if (finalSlug !== tripConfig.slug) {
      tripConfig = { ...tripConfig, slug: finalSlug, id: finalSlug, dataDirectory: finalSlug };
    }

    await tripRepo.create(tripConfig);

    return NextResponse.json({ success: true, slug: finalSlug }, { status: 201 });
  } catch (error) {
    console.error('Failed to create trip:', error);
    return NextResponse.json({ error: 'Failed to create trip' }, { status: 500 });
  }
}
