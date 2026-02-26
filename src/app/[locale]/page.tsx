import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { MapPin, Calendar, Euro, Navigation } from 'lucide-react';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  const stats = [
    {
      icon: Calendar,
      label: t('home.overview.days'),
      value: '7',
    },
    {
      icon: MapPin,
      label: t('home.overview.cities'),
      value: '3',
    },
    {
      icon: Navigation,
      label: t('home.overview.attractions'),
      value: '25+',
    },
    {
      icon: Euro,
      label: t('home.overview.distance'),
      value: '~350 km',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
          {t('home.hero.title')}
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          {t('home.hero.subtitle')}
        </p>
        <Link
          href="/itinerary"
          className="inline-block bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
        >
          {t('home.hero.cta')}
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-lg border border-gray-200 p-6 text-center"
            >
              <Icon className="h-8 w-8 text-orange-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-3 gap-6">
        <Link
          href="/itinerary"
          className="bg-orange-50 border border-orange-200 rounded-lg p-6 hover:bg-orange-100 transition-colors"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {t('navigation.itinerary')}
          </h3>
          <p className="text-gray-600">
            {t('home.sections.itineraryDesc')}
          </p>
        </Link>

        <Link
          href="/attractions"
          className="bg-red-50 border border-red-200 rounded-lg p-6 hover:bg-red-100 transition-colors"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {t('navigation.attractions')}
          </h3>
          <p className="text-gray-600">
            {t('home.sections.attractionsDesc')}
          </p>
        </Link>

        <Link
          href="/map"
          className="bg-green-50 border border-green-200 rounded-lg p-6 hover:bg-green-100 transition-colors"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {t('navigation.map')}
          </h3>
          <p className="text-gray-600">
            {t('home.sections.mapDesc')}
          </p>
        </Link>
      </div>
    </div>
  );
}
