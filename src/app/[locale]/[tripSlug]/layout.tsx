import { notFound } from 'next/navigation';
import { getTripBySlug, getAllTripSlugs } from '@/config/trips';
import { TripConfigProvider } from '@/config/trip-context';
import Header from '@/components/layout/Header';

// Allow dynamic trip slugs (JSON-based trips created at runtime)
export const dynamicParams = true;

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
      <Header />
      <main id="main-content" className="flex-1">{children}</main>
    </TripConfigProvider>
  );
}
