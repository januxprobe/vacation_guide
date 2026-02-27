import { notFound } from 'next/navigation';
import { getTripBySlug, getAllTripSlugs } from '@/config/trips';
import { TripConfigProvider } from '@/config/trip-context';

export function generateStaticParams() {
  return getAllTripSlugs().map((tripSlug) => ({ tripSlug }));
}

export default async function TripLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; tripSlug: string }>;
}) {
  const { tripSlug } = await params;
  const trip = getTripBySlug(tripSlug);

  if (!trip) {
    notFound();
  }

  return (
    <TripConfigProvider config={trip}>
      {children}
    </TripConfigProvider>
  );
}
