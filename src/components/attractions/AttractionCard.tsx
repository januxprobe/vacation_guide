'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import Image from 'next/image';
import type { Attraction } from '@/types';
import { useTripConfig } from '@/config/trip-context';
import { findCity, getCityBadgeStyle, getCityGradientStyle, getCityColor } from '@/lib/city-colors';
import { Clock, MapPin, Ticket, Star } from 'lucide-react';
import FavoriteButton from '@/components/shared/FavoriteButton';

interface AttractionCardProps {
  attraction: Attraction;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

const priorityColors: Record<string, string> = {
  essential: 'bg-yellow-100 text-yellow-800',
  recommended: 'bg-blue-100 text-blue-800',
  optional: 'bg-gray-100 text-gray-800',
};

export default function AttractionCard({ attraction, isFavorite, onToggleFavorite }: AttractionCardProps) {
  const t = useTranslations();
  const locale = useLocale() as 'nl' | 'en';
  const config = useTripConfig();
  const city = findCity(config.cities, attraction.city);
  const prefix = `/${config.slug}`;

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0
        ? `${hours}${t('common.hours')} ${mins}${t('common.minutes')}`
        : `${hours} ${t('common.hours')}`;
    }
    return `${minutes} ${t('common.minutes')}`;
  };

  const formatPrice = (price: number) => {
    if (price === 0) return locale === 'nl' ? 'Gratis' : 'Free';
    return `€${price.toFixed(2)}`;
  };

  const cityColor = getCityColor(city);

  return (
    <Link
      href={`${prefix}/attractions/${attraction.id}`}
      className="block bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
    >
      {/* Thumbnail */}
      <div className="relative h-40 overflow-hidden">
        {attraction.thumbnail ? (
          <Image
            src={attraction.thumbnail}
            alt={attraction.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div
            className="h-full flex items-center justify-center"
            style={getCityGradientStyle(city)}
          >
            <MapPin className="h-10 w-10 text-white/60" />
          </div>
        )}
        {/* Color bar overlay at bottom of image */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1.5"
          style={{ backgroundColor: cityColor }}
        />
      </div>

      <div className="p-4">
        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full border"
            style={getCityBadgeStyle(city)}
          >
            {city?.name[locale] ?? attraction.city}
          </span>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${priorityColors[attraction.priority]}`}
          >
            {t(`priority.${attraction.priority}`)}
          </span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
            {t(`categories.${attraction.category}`)}
          </span>
        </div>

        {/* Title + Favorite */}
        <div className="flex items-start justify-between gap-1">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {attraction.name}
          </h3>
          {onToggleFavorite && (
            <FavoriteButton
              isFavorite={isFavorite ?? false}
              onToggle={onToggleFavorite}
            />
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {attraction.description[locale]}
        </p>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center space-x-1.5 text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{formatDuration(attraction.duration)}</span>
          </div>
          <div className="flex items-center space-x-1.5 text-gray-600">
            <Ticket className="h-4 w-4" />
            <span>{formatPrice(attraction.pricing.adult)}</span>
          </div>
        </div>

        {/* Booking required badge */}
        {attraction.bookingRequired && (
          <div className="mt-3 flex items-center space-x-1.5 text-amber-600 text-xs font-medium">
            <Star className="h-3.5 w-3.5" />
            <span>{t('attractions.bookingRequired')}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
