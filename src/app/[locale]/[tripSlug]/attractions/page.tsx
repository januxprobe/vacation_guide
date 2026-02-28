import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getTripRepository, getTripDataRepository } from '@/lib/repositories';
import AttractionsList from '@/components/attractions/AttractionsList';

type Props = {
  params: Promise<{ locale: string; tripSlug: string }>;
};

export default async function AttractionsPage({ params }: Props) {
  const { locale, tripSlug } = await params;
  const t = await getTranslations({ locale });
  const tripRepo = getTripRepository();
  const trip = await tripRepo.getBySlug(tripSlug);

  if (!trip) notFound();

  const tripDataRepo = getTripDataRepository();
  const attractions = await tripDataRepo.getAllAttractions(tripSlug);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">
        {t('attractions.title')}
      </h1>
      <p className="text-gray-600 mb-8">
        {t('attractions.subtitle')}
      </p>

      <AttractionsList attractions={attractions} />
    </div>
  );
}
