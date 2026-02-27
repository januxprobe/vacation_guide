'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import type { Attraction } from '@/types';
import PriceInfo from './PriceInfo';
import MediaGallery from './MediaGallery';
import { useTripConfig } from '@/config/trip-context';
import { findCity, getCityColor, hexToRgba } from '@/lib/city-colors';
import {
  Clock,
  MapPin,
  ArrowLeft,
  ExternalLink,
  CalendarCheck,
  Lightbulb,
  Map,
} from 'lucide-react';

interface AttractionDetailProps {
  attraction: Attraction;
}

const dayLabels: Record<string, string> = {
  monday: 'Ma',
  tuesday: 'Di',
  wednesday: 'Wo',
  thursday: 'Do',
  friday: 'Vr',
  saturday: 'Za',
  sunday: 'Zo',
};

const dayLabelsEn: Record<string, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

export default function AttractionDetail({
  attraction,
}: AttractionDetailProps) {
  const t = useTranslations();
  const locale = useLocale() as 'nl' | 'en';
  const config = useTripConfig();
  const city = findCity(config.cities, attraction.city);
  const cityColor = getCityColor(city);
  const prefix = `/${config.slug}`;

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}min`;
  };

  const labels = locale === 'nl' ? dayLabels : dayLabelsEn;

  return (
    <div>
      {/* Back link */}
      <Link
        href={`${prefix}/attractions`}
        className="inline-flex items-center space-x-1 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>{t('common.back')}</span>
      </Link>

      {/* Color bar */}
      <div
        className="h-2 rounded-t-lg"
        style={{ backgroundColor: cityColor }}
      />

      <div className="bg-white rounded-b-lg border border-gray-200 border-t-0 overflow-hidden">
        <div className="p-6">
          {/* Media Gallery */}
          {attraction.thumbnail && (
            <MediaGallery
              thumbnail={attraction.thumbnail}
              name={attraction.name}
              media={attraction.media}
            />
          )}

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span
              className="text-sm font-medium px-3 py-1 rounded-full"
              style={{
                backgroundColor: hexToRgba(cityColor, 0.1),
                color: cityColor,
              }}
            >
              {city?.name[locale] ?? attraction.city}
            </span>
            <span
              className={`text-sm font-medium px-3 py-1 rounded-full ${
                attraction.priority === 'essential'
                  ? 'bg-yellow-100 text-yellow-800'
                  : attraction.priority === 'recommended'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {t(`priority.${attraction.priority}`)}
            </span>
            <span className="text-sm font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-700">
              {t(`categories.${attraction.category}`)}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {attraction.name}
          </h1>

          {/* Description */}
          <p className="text-gray-700 text-lg mb-6">
            {attraction.description[locale]}
          </p>

          {/* Info cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Duration */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">
                  {t('attractions.duration')}
                </h3>
              </div>
              <p className="text-gray-700">
                {formatDuration(attraction.duration)}
              </p>
            </div>

            {/* Pricing */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">
                  {t('attractions.pricing')}
                </h3>
              </div>
              <PriceInfo pricing={attraction.pricing} />
            </div>

            {/* Booking */}
            {attraction.bookingRequired && (
              <div className="bg-amber-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CalendarCheck className="h-5 w-5 text-amber-600" />
                  <h3 className="font-semibold text-amber-900">
                    {t('attractions.bookingRequired')}
                  </h3>
                </div>
                <p className="text-amber-700 text-sm">
                  {t('attractions.bookingAdvice')}
                </p>
              </div>
            )}
          </div>

          {/* Opening hours */}
          {attraction.openingHours && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">
                {t('attractions.openingHours')}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(attraction.openingHours).map(([day, hours]) => (
                  <div
                    key={day}
                    className="bg-gray-50 rounded-lg px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-gray-700">
                      {labels[day]}
                    </span>
                    <span className="text-gray-600 ml-2">{hours}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          {attraction.tips && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <Lightbulb className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">
                  {t('attractions.tips')}
                </h3>
              </div>
              <p className="text-blue-800">{attraction.tips[locale]}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {attraction.website && (
              <a
                href={attraction.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                <span>{t('attractions.website')}</span>
              </a>
            )}
            <Link
              href={`${prefix}/map`}
              className="inline-flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Map className="h-4 w-4" />
              <span>{t('common.viewOnMap')}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
