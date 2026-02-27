import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getTripBySlug, clearTripCache } from '@/config/trips';
import { itinerarySchema } from '@/lib/schemas';
import { normalizeItinerary } from '@/lib/normalize-itinerary';
import { clearItineraryCache } from '@/lib/data-loaders';

/** POST: Save itinerary.json for a trip */
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
    normalizeItinerary(body);
    const parsed = itinerarySchema.safeParse(body);

    if (!parsed.success) {
      console.error('Itinerary validation failed:', JSON.stringify(parsed.error.format(), null, 2));
      return NextResponse.json(
        { error: 'Invalid itinerary data', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const filePath = path.join(
      process.cwd(),
      'src',
      'data',
      'trips',
      trip.dataDirectory,
      'itinerary.json'
    );

    fs.writeFileSync(filePath, JSON.stringify(parsed.data, null, 2), 'utf-8');
    clearItineraryCache(trip.id);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Failed to save itinerary:', error);
    return NextResponse.json({ error: 'Failed to save itinerary' }, { status: 500 });
  }
}
