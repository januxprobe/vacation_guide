import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { getTripBySlug } from '@/config/trips';
import { hexToRgba } from '@/lib/city-colors';
import { MapPin, Calendar, Euro, Navigation } from 'lucide-react';

type Props = {
  params: Promise<{ locale: string; tripSlug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale, tripSlug } = await params;
  const trip = getTripBySlug(tripSlug);
  if (!trip) return { title: 'Not Found' };
  const loc = locale as 'nl' | 'en';
  return {
    title: trip.name[loc],
    description: trip.description[loc],
  };
}

export default async function TripHomePage({ params }: Props) {
  const { locale, tripSlug } = await params;
  const loc = locale as 'nl' | 'en';
  const t = await getTranslations({ locale });
  const trip = getTripBySlug(tripSlug);

  if (!trip) notFound();

  const stats = [
    {
      icon: Calendar,
      label: t('home.overview.days'),
      value: `${trip.stats.totalDays}`,
    },
    {
      icon: MapPin,
      label: t('home.overview.cities'),
      value: `${trip.stats.totalCities}`,
    },
    {
      icon: Navigation,
      label: t('home.overview.attractions'),
      value: `${trip.stats.totalAttractions}+`,
    },
    {
      icon: Euro,
      label: t('home.overview.distance'),
      value: trip.stats.totalDistance,
    },
  ];

  const primaryColor = trip.theme.primaryColor;
  const prefix = `/${tripSlug}`;

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
          href={`${prefix}/itinerary`}
          className="inline-block text-white px-8 py-3 rounded-lg font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: primaryColor }}
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
              <Icon
                className="h-8 w-8 mx-auto mb-3"
                style={{ color: primaryColor }}
              />
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Quick Links - one per city using config colors */}
      <div className="grid md:grid-cols-3 gap-6">
        {trip.cities.map((city, index) => {
          const links = [`${prefix}/itinerary`, `${prefix}/attractions`, `${prefix}/map`];
          const linkLabels = [
            t('navigation.itinerary'),
            t('navigation.attractions'),
            t('navigation.map'),
          ];
          const descKeys = [
            'home.sections.itineraryDesc',
            'home.sections.attractionsDesc',
            'home.sections.mapDesc',
          ] as const;

          return (
            <Link
              key={city.id}
              href={links[index] ?? `${prefix}/attractions`}
              className="rounded-lg p-6 transition-opacity hover:opacity-80 border"
              style={{
                backgroundColor: hexToRgba(city.color, 0.05),
                borderColor: hexToRgba(city.color, 0.2),
              }}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {linkLabels[index]}
              </h3>
              <p className="text-gray-600">
                {t(descKeys[index])}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
