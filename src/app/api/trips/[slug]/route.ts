import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getTripBySlug, clearTripCache, isStaticTrip } from '@/config/trips';
import { clearAttractionCache } from '@/lib/data-loaders';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  clearTripCache();
  const trip = getTripBySlug(slug);

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

  // Prevent deleting static TS-based trips
  if (isStaticTrip(slug)) {
    return NextResponse.json(
      { error: 'Cannot delete a built-in trip' },
      { status: 403 }
    );
  }

  clearTripCache();
  const trip = getTripBySlug(slug);

  if (!trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  try {
    const tripDir = path.join(
      process.cwd(),
      'src',
      'data',
      'trips',
      trip.dataDirectory
    );

    if (fs.existsSync(tripDir)) {
      fs.rmSync(tripDir, { recursive: true, force: true });
    }

    // Clear all caches
    clearAttractionCache(trip.id);
    clearTripCache();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete trip:', error);
    return NextResponse.json(
      { error: 'Failed to delete trip' },
      { status: 500 }
    );
  }
}
