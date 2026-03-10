import { NextResponse } from 'next/server';
import { getTripRepository, getTripDataRepository } from '@/lib/repositories';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const tripRepo = getTripRepository();
  const trip = await tripRepo.getBySlug(slug);

  if (!trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  return NextResponse.json(trip);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const tripRepo = getTripRepository();

  // Prevent deleting protected (static) trips
  if (await tripRepo.isProtected(slug)) {
    return NextResponse.json(
      { error: 'Cannot delete a built-in trip' },
      { status: 403 }
    );
  }

  const trip = await tripRepo.getBySlug(slug);

  if (!trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  try {
    await tripRepo.delete(slug);
    getTripDataRepository().clearCaches(slug);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete trip:', error);
    return NextResponse.json(
      { error: 'Failed to delete trip' },
      { status: 500 }
    );
  }
}
