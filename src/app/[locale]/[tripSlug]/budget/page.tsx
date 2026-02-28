import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getTripRepository, getTripDataRepository } from '@/lib/repositories';
import BudgetCalculator from '@/components/budget/BudgetCalculator';

type Props = {
  params: Promise<{ locale: string; tripSlug: string }>;
};

export default async function BudgetPage({ params }: Props) {
  const { locale, tripSlug } = await params;
  const t = await getTranslations({ locale });
  const tripRepo = getTripRepository();
  const trip = await tripRepo.getBySlug(tripSlug);

  if (!trip) notFound();

  const tripDataRepo = getTripDataRepository();
  const [itinerary, attractions] = await Promise.all([
    tripDataRepo.getItinerary(tripSlug),
    tripDataRepo.getAllAttractions(tripSlug),
  ]);

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
