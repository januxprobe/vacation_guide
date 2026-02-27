import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getTripBySlug } from '@/config/trips';
import { getItineraryForTrip, getAllAttractionsForTrip } from '@/lib/data-loaders';
import BudgetCalculator from '@/components/budget/BudgetCalculator';

type Props = {
  params: Promise<{ locale: string; tripSlug: string }>;
};

export default async function BudgetPage({ params }: Props) {
  const { locale, tripSlug } = await params;
  const t = await getTranslations({ locale });
  const trip = getTripBySlug(tripSlug);

  if (!trip) notFound();

  const itinerary = getItineraryForTrip(trip);
  const attractions = getAllAttractionsForTrip(trip);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">
        {t('budget.title')}
      </h1>
      <p className="text-gray-600 mb-8">
        {t('budget.subtitle')}
      </p>

      {itinerary ? (
        <BudgetCalculator itinerary={itinerary} attractions={attractions} />
      ) : (
        <p className="text-gray-500">{t('budget.noData')}</p>
      )}
    </div>
  );
}
