import { NextResponse } from 'next/server';
import { getTripRepository, getTripDataRepository } from '@/lib/repositories';
import { restaurantSchema, restaurantsFileSchema } from '@/lib/schemas';

/** POST: Save full restaurants.json (batch, used during trip creation) */
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
    const parsed = restaurantsFileSchema.safeParse(body);

    if (!parsed.success) {
      console.error('Restaurants validation failed:', JSON.stringify(parsed.error.format(), null, 2));
      return NextResponse.json(
        { error: 'Invalid restaurants data', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const tripDataRepo = getTripDataRepository();
    await tripDataRepo.saveRestaurants(slug, parsed.data.restaurants);

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
    const tripRepo = getTripRepository();

    if (await tripRepo.isProtected(slug)) {
      return NextResponse.json(
        { error: 'Cannot modify a built-in trip' },
        { status: 403 }
      );
    }

    const trip = await tripRepo.getBySlug(slug);

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

    const tripDataRepo = getTripDataRepository();
    try {
      await tripDataRepo.addRestaurant(slug, parsed.data);
    } catch (e) {
      if (e instanceof Error && e.message.includes('already exists')) {
        return NextResponse.json(
          { error: 'Restaurant with this ID already exists' },
          { status: 409 }
        );
      }
      throw e;
    }

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
    const tripRepo = getTripRepository();

    if (await tripRepo.isProtected(slug)) {
      return NextResponse.json(
        { error: 'Cannot modify a built-in trip' },
        { status: 403 }
      );
    }

    const trip = await tripRepo.getBySlug(slug);

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 });
    }

    const tripDataRepo = getTripDataRepository();
    const removed = await tripDataRepo.removeRestaurant(slug, id);

    if (!removed) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete restaurant:', error);
    return NextResponse.json({ error: 'Failed to delete restaurant' }, { status: 500 });
  }
}
