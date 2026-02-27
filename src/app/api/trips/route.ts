import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getAllTrips, clearTripCache } from '@/config/trips';
import { tripConfigSchema } from '@/lib/schemas';

export async function GET() {
  try {
    clearTripCache(); // Always get fresh data
    const trips = getAllTrips();
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

    const parsed = tripConfigSchema.safeParse(body);

    if (!parsed.success) {
      console.error('Trip config validation failed:', JSON.stringify(parsed.error.format(), null, 2));
      return NextResponse.json(
        { error: 'Invalid trip config', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const tripConfig = parsed.data;
    const tripDir = path.join(process.cwd(), 'src', 'data', 'trips', tripConfig.dataDirectory);

    // Check if trip already exists
    if (fs.existsSync(tripDir)) {
      return NextResponse.json(
        { error: 'Trip directory already exists' },
        { status: 409 }
      );
    }

    // Create trip directory structure
    fs.mkdirSync(tripDir, { recursive: true });
    fs.mkdirSync(path.join(tripDir, 'attractions'), { recursive: true });

    // Create city subdirectories
    for (const city of tripConfig.cities) {
      fs.mkdirSync(path.join(tripDir, 'attractions', city.id), { recursive: true });
    }

    // Write trip config JSON
    fs.writeFileSync(
      path.join(tripDir, 'trip-config.json'),
      JSON.stringify(tripConfig, null, 2),
      'utf-8'
    );

    // Clear caches
    clearTripCache();

    return NextResponse.json({ success: true, slug: tripConfig.slug }, { status: 201 });
  } catch (error) {
    console.error('Failed to create trip:', error);
    return NextResponse.json({ error: 'Failed to create trip' }, { status: 500 });
  }
}
