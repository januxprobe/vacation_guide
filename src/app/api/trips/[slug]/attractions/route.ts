import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getTripBySlug, clearTripCache } from '@/config/trips';
import { attractionSchema } from '@/lib/schemas';
import { clearAttractionCache } from '@/lib/data-loaders';

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

    // Fill defaults for fields AI might omit
    if (!body.images) body.images = [];
    if (!body.thumbnail) body.thumbnail = '';
    if (body.bookingRequired === undefined) body.bookingRequired = false;

    const parsed = attractionSchema.safeParse(body);

    if (!parsed.success) {
      console.error(`Attraction validation failed for ${body.id}:`, JSON.stringify(parsed.error.format(), null, 2));
      return NextResponse.json(
        { error: 'Invalid attraction data', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const attraction = parsed.data;
    const cityDir = path.join(
      process.cwd(),
      'src',
      'data',
      'trips',
      trip.dataDirectory,
      'attractions',
      attraction.city
    );

    // Ensure city directory exists
    fs.mkdirSync(cityDir, { recursive: true });

    // Write attraction JSON file
    const filePath = path.join(cityDir, `${attraction.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(attraction, null, 2), 'utf-8');

    // Clear attraction cache for this trip
    clearAttractionCache(trip.id);

    return NextResponse.json({ success: true, id: attraction.id }, { status: 201 });
  } catch (error) {
    console.error('Failed to add attraction:', error);
    return NextResponse.json({ error: 'Failed to add attraction' }, { status: 500 });
  }
}
