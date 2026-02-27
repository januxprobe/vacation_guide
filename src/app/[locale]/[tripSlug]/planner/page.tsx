import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getTripBySlug } from '@/config/trips';
import { getAllAttractionsForTrip, getItineraryForTrip, getRestaurantsForTrip } from '@/lib/data-loaders';
import PlannerWrapper from '@/components/planner/PlannerWrapper';

type Props = {
  params: Promise<{ locale: string; tripSlug: string }>;
};

export default async function PlannerPage({ params }: Props) {
  const { locale, tripSlug } = await params;
  const t = await getTranslations({ locale });
  const trip = getTripBySlug(tripSlug);

  if (!trip) notFound();

  const attractions = getAllAttractionsForTrip(trip);
  const itinerary = getItineraryForTrip(trip);
  const restaurants = getRestaurantsForTrip(trip);

  if (!itinerary) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">{t('planner.noItinerary')}</p>
      </div>
    );
  }

  return (
    <PlannerWrapper
      attractions={attractions}
      itinerary={itinerary}
      restaurants={restaurants}
      locale={locale}
      tripSlug={tripSlug}
    />
  );
}
