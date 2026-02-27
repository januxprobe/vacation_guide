import { getTranslations } from 'next-intl/server';

type Props = {
  params: Promise<{ locale: string; tripSlug: string }>;
};

export default async function RestaurantsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        {t('restaurants.title')}
      </h1>
      <p className="text-gray-600">
        {t('restaurants.comingSoon')}
      </p>
    </div>
  );
}
