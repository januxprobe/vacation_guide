import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getTripRepository, getTripDataRepository } from '@/lib/repositories';
import AttractionDetail from '@/components/attractions/AttractionDetail';

type Props = {
  params: Promise<{ locale: string; tripSlug: string; id: string }>;
};

export async function generateStaticParams() {
  const tripRepo = getTripRepository();
  const tripDataRepo = getTripDataRepository();
  const results: { tripSlug: string; id: string }[] = [];
  const slugs = await tripRepo.getAllSlugs();
  for (const slug of slugs) {
    const ids = await tripDataRepo.getAllAttractionIds(slug);
    for (const id of ids) {
      results.push({ tripSlug: slug, id });
    }
  }
  return results;
}

export async function generateMetadata({ params }: Props) {
  const { locale, tripSlug, id } = await params;
  const tripRepo = getTripRepository();
  const trip = await tripRepo.getBySlug(tripSlug);
  if (!trip) return { title: 'Not Found' };

  const tripDataRepo = getTripDataRepository();
  const attraction = await tripDataRepo.getAttractionById(tripSlug, id);
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
  const tripRepo = getTripRepository();
  const trip = await tripRepo.getBySlug(tripSlug);
  if (!trip) notFound();

  const tripDataRepo = getTripDataRepository();
  const attraction = await tripDataRepo.getAttractionById(tripSlug, id);
  if (!attraction) notFound();

  return (
    <div className="container mx-auto px-4 py-12">
      <AttractionDetail attraction={attraction} />
    </div>
  );
}
