import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getTripBySlug, getAllTripSlugs } from '@/config/trips';
import {
  getAttractionByIdForTrip,
  getAllAttractionIdsForTrip,
} from '@/lib/data-loaders';
import AttractionDetail from '@/components/attractions/AttractionDetail';

type Props = {
  params: Promise<{ locale: string; tripSlug: string; id: string }>;
};

export async function generateStaticParams() {
  const results: { tripSlug: string; id: string }[] = [];
  for (const slug of getAllTripSlugs()) {
    const trip = getTripBySlug(slug)!;
    const ids = getAllAttractionIdsForTrip(trip);
    for (const id of ids) {
      results.push({ tripSlug: slug, id });
    }
  }
  return results;
}

export async function generateMetadata({ params }: Props) {
  const { locale, tripSlug, id } = await params;
  const trip = getTripBySlug(tripSlug);
  if (!trip) return { title: 'Not Found' };

  const attraction = getAttractionByIdForTrip(id, trip);
  const t = await getTranslations({ locale });

  if (!attraction) {
    return { title: t('common.error') };
  }

  return {
    title: `${attraction.name} - ${trip.name[locale as 'nl' | 'en']}`,
    description: attraction.description[locale as 'nl' | 'en'],
  };
}

export default async function AttractionDetailPage({ params }: Props) {
  const { tripSlug, id } = await params;
  const trip = getTripBySlug(tripSlug);
  if (!trip) notFound();

  const attraction = getAttractionByIdForTrip(id, trip);
  if (!attraction) notFound();

  return (
    <div className="container mx-auto px-4 py-12">
      <AttractionDetail attraction={attraction} />
    </div>
  );
}
