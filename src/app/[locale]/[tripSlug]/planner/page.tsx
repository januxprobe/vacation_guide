import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getTripRepository, getTripDataRepository } from '@/lib/repositories';
import PlannerWrapper from '@/components/planner/PlannerWrapper';

type Props = {
  params: Promise<{ locale: string; tripSlug: string }>;
};

export default async function PlannerPage({ params }: Props) {
  const { locale, tripSlug } = await params;
  const t = await getTranslations({ locale });
  const tripRepo = getTripRepository();
  const trip = await tripRepo.getBySlug(tripSlug);

  if (!trip) notFound();

  const tripDataRepo = getTripDataRepository();
  const [attractions, itinerary, restaurants] = await Promise.all([
    tripDataRepo.getAllAttractions(tripSlug),
    tripDataRepo.getItinerary(tripSlug),
    tripDataRepo.getRestaurants(tripSlug),
  ]);

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
