import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getTripBySlug, clearTripCache, isStaticTrip } from '@/config/trips';
import { restaurantSchema, restaurantsFileSchema } from '@/lib/schemas';
import { clearRestaurantCache } from '@/lib/data-loaders';

function getRestaurantsFilePath(dataDirectory: string): string {
  return path.join(
    process.cwd(),
    'src',
    'data',
    'trips',
    dataDirectory,
    'restaurants.json'
  );
}

function readRestaurantsFile(filePath: string): { restaurants: unknown[] } {
  if (!fs.existsSync(filePath)) {
    return { restaurants: [] };
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

/** POST: Save full restaurants.json (batch, used during trip creation) */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    clearTripCache();
    const trip = getTripBySlug(slug);

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = restaurantsFileSchema.safeParse(body);

    if (!parsed.success) {
      console.error('Restaurants validation failed:', JSON.stringify(parsed.error.format(), null, 2));
      return NextResponse.json(
        { error: 'Invalid restaurants data', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const filePath = getRestaurantsFilePath(trip.dataDirectory);
    fs.writeFileSync(filePath, JSON.stringify(parsed.data, null, 2), 'utf-8');
    clearRestaurantCache(trip.id);

    return NextResponse.json({ success: true, count: parsed.data.restaurants.length }, { status: 201 });
  } catch (error) {
    console.error('Failed to save restaurants:', error);
    return NextResponse.json({ error: 'Failed to save restaurants' }, { status: 500 });
  }
}

/** PUT: Add a single restaurant to existing restaurants.json */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (isStaticTrip(slug)) {
      return NextResponse.json(
        { error: 'Cannot modify a built-in trip' },
        { status: 403 }
      );
    }

    clearTripCache();
    const trip = getTripBySlug(slug);

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = restaurantSchema.safeParse(body);

    if (!parsed.success) {
      console.error('Restaurant validation failed:', JSON.stringify(parsed.error.format(), null, 2));
      return NextResponse.json(
        { error: 'Invalid restaurant data', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const filePath = getRestaurantsFilePath(trip.dataDirectory);
    const existing = readRestaurantsFile(filePath);

    // Check for duplicate ID
    if (existing.restaurants.some((r: unknown) => (r as { id: string }).id === parsed.data.id)) {
      return NextResponse.json(
        { error: 'Restaurant with this ID already exists' },
        { status: 409 }
      );
    }

    existing.restaurants.push(parsed.data);
    fs.writeFileSync(filePath, JSON.stringify(existing, null, 2), 'utf-8');
    clearRestaurantCache(trip.id);

    return NextResponse.json({ success: true, id: parsed.data.id }, { status: 201 });
  } catch (error) {
    console.error('Failed to add restaurant:', error);
    return NextResponse.json({ error: 'Failed to add restaurant' }, { status: 500 });
  }
}

/** DELETE: Remove a restaurant by ID */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (isStaticTrip(slug)) {
      return NextResponse.json(
        { error: 'Cannot modify a built-in trip' },
        { status: 403 }
      );
    }

    clearTripCache();
    const trip = getTripBySlug(slug);

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 });
    }

    const filePath = getRestaurantsFilePath(trip.dataDirectory);
    const existing = readRestaurantsFile(filePath);

    const filtered = existing.restaurants.filter(
      (r: unknown) => (r as { id: string }).id !== id
    );

    if (filtered.length === existing.restaurants.length) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    fs.writeFileSync(
      filePath,
      JSON.stringify({ restaurants: filtered }, null, 2),
      'utf-8'
    );
    clearRestaurantCache(trip.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete restaurant:', error);
    return NextResponse.json({ error: 'Failed to delete restaurant' }, { status: 500 });
  }
}
