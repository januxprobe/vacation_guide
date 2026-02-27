import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getTripBySlug } from '@/config/trips';
import { getAllAttractionsForTrip, getItineraryForTrip, getRestaurantsForTrip } from '@/lib/data-loaders';
import MapWrapper from '@/components/map/MapWrapper';

type Props = {
  params: Promise<{ locale: string; tripSlug: string }>;
};

export default async function MapPage({ params }: Props) {
  const { locale, tripSlug } = await params;
  const t = await getTranslations({ locale });
  const trip = getTripBySlug(tripSlug);

  if (!trip) notFound();

  const attractions = getAllAttractionsForTrip(trip);
  const itinerary = getItineraryForTrip(trip);
  const restaurants = getRestaurantsForTrip(trip);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">
        {t('map.title')}
      </h1>
      <p className="text-gray-600 mb-8">
        {t('map.subtitle')}
      </p>

      <MapWrapper
        attractions={attractions}
        itinerary={itinerary}
        restaurants={restaurants}
        locale={locale}
        tripSlug={tripSlug}
      />
    </div>
  );
}
