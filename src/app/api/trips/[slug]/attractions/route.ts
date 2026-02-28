import { NextResponse } from 'next/server';
import { getTripRepository, getTripDataRepository } from '@/lib/repositories';
import { attractionSchema } from '@/lib/schemas';

// Normalize AI-generated values to match our Zod enums
const CATEGORY_MAP: Record<string, string> = {
  square: 'monument', plaza: 'monument', piazza: 'monument',
  ruins: 'monument', bridge: 'monument', tower: 'monument', gate: 'monument',
  fountain: 'monument', statue: 'monument', landmark: 'monument',
  temple: 'church', basilica: 'church', cathedral: 'church', chapel: 'church',
  fortress: 'palace', castle: 'palace', alcazar: 'palace',
  gallery: 'museum', exhibition: 'museum',
  park: 'nature', garden: 'nature', beach: 'nature', coast: 'nature', mountain: 'nature',
  district: 'neighborhood', quarter: 'neighborhood', area: 'neighborhood', street: 'neighborhood',
};

const PRIORITY_MAP: Record<string, string> = {
  important: 'essential', 'must-see': 'essential', 'must see': 'essential',
  'must-visit': 'essential', highlight: 'essential', top: 'essential',
  suggested: 'recommended', notable: 'recommended', worthwhile: 'recommended',
  'nice-to-have': 'optional', minor: 'optional', extra: 'optional',
};

const VALID_CATEGORIES = new Set(['monument', 'church', 'palace', 'museum', 'neighborhood', 'nature']);
const VALID_PRIORITIES = new Set(['essential', 'recommended', 'optional']);

function normalizeAttraction(body: Record<string, unknown>): void {
  if (typeof body.category === 'string' && !VALID_CATEGORIES.has(body.category)) {
    const lower = body.category.toLowerCase();
    body.category = CATEGORY_MAP[lower] ?? 'monument';
  }
  if (typeof body.priority === 'string' && !VALID_PRIORITIES.has(body.priority)) {
    const lower = body.priority.toLowerCase();
    body.priority = PRIORITY_MAP[lower] ?? 'recommended';
  }
}

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

    // Fill defaults for fields AI might omit
    if (!body.images) body.images = [];
    if (!body.thumbnail) body.thumbnail = '';
    if (body.bookingRequired === undefined) body.bookingRequired = false;

    // Normalize AI-generated enum values to match our schema
    normalizeAttraction(body);

    const parsed = attractionSchema.safeParse(body);

    if (!parsed.success) {
      console.error(`Attraction validation failed for ${body.id}:`, JSON.stringify(parsed.error.format(), null, 2));
      return NextResponse.json(
        { error: 'Invalid attraction data', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const tripDataRepo = getTripDataRepository();
    await tripDataRepo.addAttraction(slug, parsed.data);

    return NextResponse.json({ success: true, id: parsed.data.id }, { status: 201 });
  } catch (error) {
    console.error('Failed to add attraction:', error);
    return NextResponse.json({ error: 'Failed to add attraction' }, { status: 500 });
  }
}
