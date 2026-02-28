import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { getTripRepository } from '@/lib/repositories';
import { hexToRgba } from '@/lib/city-colors';
import { MapPin, Calendar, Euro, Navigation } from 'lucide-react';

type Props = {
  params: Promise<{ locale: string; tripSlug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale, tripSlug } = await params;
  const tripRepo = getTripRepository();
  const trip = await tripRepo.getBySlug(tripSlug);
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
  const tripRepo = getTripRepository();
  const trip = await tripRepo.getBySlug(tripSlug);

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
  const heroImage = trip.heroImage;

  return (
    <div>
      {/* Hero Section */}
      <section
        className="relative w-full overflow-hidden"
        style={heroImage ? { minHeight: '400px' } : undefined}
      >
        {heroImage ? (
          <>
            <Image
              src={heroImage}
              alt=""
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
            <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 py-20 sm:py-28 md:py-36">
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
                {t('home.hero.title')}
              </h1>
              <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl drop-shadow">
                {t('home.hero.subtitle')}
              </p>
              <Link
                href={`${prefix}/planner`}
                className="inline-block text-white px-8 py-3 rounded-lg font-semibold transition-opacity hover:opacity-90 shadow-lg"
                style={{ backgroundColor: primaryColor }}
              >
                {t('home.hero.cta')}
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center px-4 py-12 md:py-20">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-gray-900 mb-4">
              {t('home.hero.title')}
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-8">
              {t('home.hero.subtitle')}
            </p>
            <Link
              href={`${prefix}/planner`}
              className="inline-block text-white px-8 py-3 rounded-lg font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
            >
              {t('home.hero.cta')}
            </Link>
          </div>
        )}
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-16">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 text-center"
              >
                <Icon
                  className="h-8 w-8 mx-auto mb-3"
                  style={{ color: primaryColor }}
                />
                <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Quick Links - one per city using config colors */}
        <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
          {trip.cities.map((city, index) => {
            const links = [`${prefix}/planner`, `${prefix}/attractions`, `${prefix}/restaurants`];
            const linkLabels = [
              t('navigation.planner'),
              t('navigation.attractions'),
              t('navigation.restaurants'),
            ];
            const descKeys = [
              'home.sections.itineraryDesc',
              'home.sections.attractionsDesc',
              'home.sections.restaurantsDesc',
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
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {linkLabels[index]}
                </h2>
                <p className="text-gray-600">
                  {t(descKeys[index])}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
