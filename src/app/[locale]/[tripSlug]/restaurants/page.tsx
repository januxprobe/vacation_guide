import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getTripBySlug } from '@/config/trips';
import { getRestaurantsForTrip } from '@/lib/data-loaders';
import RestaurantsList from '@/components/restaurants/RestaurantsList';

type Props = {
  params: Promise<{ locale: string; tripSlug: string }>;
};

export default async function RestaurantsPage({ params }: Props) {
  const { locale, tripSlug } = await params;
  const t = await getTranslations({ locale });
  const trip = getTripBySlug(tripSlug);

  if (!trip) notFound();

  const restaurants = getRestaurantsForTrip(trip);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">
        {t('restaurants.title')}
      </h1>
      <p className="text-gray-600 mb-8">
        {t('restaurants.subtitle')}
      </p>

      <RestaurantsList restaurants={restaurants} />
    </div>
  );
}
