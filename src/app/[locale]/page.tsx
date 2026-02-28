import { getTranslations } from 'next-intl/server';
import { getTripRepository } from '@/lib/repositories';
import GenericHeader from '@/components/layout/GenericHeader';
import TripGrid from '@/components/trip-selector/TripGrid';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function LocaleHomePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'tripSelector' });
  const tripRepo = getTripRepository();
  const trips = await tripRepo.getAll();
  const protectedChecks = await Promise.all(
    trips.map((trip) => tripRepo.isProtected(trip.slug))
  );
  const staticSlugs = trips
    .filter((_, i) => protectedChecks[i])
    .map((trip) => trip.slug);

  return (
    <>
      <GenericHeader />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {t('title')}
            </h1>
            <p className="text-gray-600">
              {t('subtitle')}
            </p>
          </div>

          <TripGrid trips={trips} locale={locale} staticSlugs={staticSlugs} />
        </div>
      </main>
    </>
  );
}
