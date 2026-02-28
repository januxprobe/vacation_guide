import { NextResponse } from 'next/server';
import { getTripRepository, getTripDataRepository } from '@/lib/repositories';
import { itinerarySchema } from '@/lib/schemas';
import { normalizeItinerary } from '@/lib/normalize-itinerary';

/** POST: Save itinerary.json for a trip */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const tripRepo = getTripRepository();
    const trip = await tripRepo.getBySlug(slug);

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

    const tripDataRepo = getTripDataRepository();
    await tripDataRepo.saveItinerary(slug, parsed.data);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Failed to save itinerary:', error);
    return NextResponse.json({ error: 'Failed to save itinerary' }, { status: 500 });
  }
}
