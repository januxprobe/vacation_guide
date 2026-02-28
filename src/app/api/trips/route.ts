import { NextResponse } from 'next/server';
import { getTripRepository } from '@/lib/repositories';
import { tripConfigSchema } from '@/lib/schemas';

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

    const parsed = tripConfigSchema.safeParse(body);

    if (!parsed.success) {
      console.error('Trip config validation failed:', JSON.stringify(parsed.error.format(), null, 2));
      return NextResponse.json(
        { error: 'Invalid trip config', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const tripConfig = parsed.data;
    const tripRepo = getTripRepository();

    // Check if trip already exists
    const existing = await tripRepo.getBySlug(tripConfig.slug);
    if (existing) {
      return NextResponse.json(
        { error: 'Trip directory already exists' },
        { status: 409 }
      );
    }

    await tripRepo.create(tripConfig);

    return NextResponse.json({ success: true, slug: tripConfig.slug }, { status: 201 });
  } catch (error) {
    console.error('Failed to create trip:', error);
    return NextResponse.json({ error: 'Failed to create trip' }, { status: 500 });
  }
}
