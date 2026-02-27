'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import type { TripConfig } from '@/config/trip-config';
import { hexToRgba } from '@/lib/city-colors';
import { MapPin, Calendar, Navigation, Trash2, Loader2 } from 'lucide-react';

interface TripCardProps {
  trip: TripConfig;
  locale: string;
  deletable?: boolean;
  onDeleted?: () => void;
}

export default function TripCard({ trip, locale, deletable, onDeleted }: TripCardProps) {
  const t = useTranslations('tripSelector');
  const loc = locale as 'nl' | 'en';
  const color = trip.theme.primaryColor;
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirming) {
      setConfirming(true);
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/trips/${trip.slug}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Delete failed');
      }
      onDeleted?.();
    } catch (error) {
      console.error('Failed to delete trip:', error);
      setDeleting(false);
      setConfirming(false);
    }
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirming(false);
  };

  return (
    <Link
      href={`/${trip.slug}`}
      className="group relative block rounded-xl border border-gray-200 bg-white overflow-hidden transition-all hover:shadow-lg hover:border-gray-300"
    >
      {/* Color header bar */}
      <div
        className="h-2"
        style={{ backgroundColor: color }}
      />

      <div className="p-6">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:underline truncate">
              {trip.name[loc]}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {trip.region[loc]}
            </p>
          </div>

          {/* Delete button */}
          {deletable && (
            <div className="flex-shrink-0">
              {confirming ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-2 py-1 rounded text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {deleting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      t('confirmDelete')
                    )}
                  </button>
                  <button
                    onClick={handleCancelDelete}
                    disabled={deleting}
                    className="px-2 py-1 rounded text-xs font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 transition-colors"
                  >
                    {t('cancel')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleDelete}
                  className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title={t('deleteTrip')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* City badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {trip.cities.map((city) => (
            <span
              key={city.id}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
              style={{
                backgroundColor: hexToRgba(city.color, 0.1),
                color: city.color,
                borderColor: hexToRgba(city.color, 0.2),
              }}
            >
              {city.name[loc]}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {t('days', { count: trip.stats.totalDays })}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {t('cities', { count: trip.stats.totalCities })}
          </span>
          <span className="flex items-center gap-1">
            <Navigation className="h-4 w-4" />
            {t('attractions', { count: trip.stats.totalAttractions })}
          </span>
        </div>

        {/* Date range */}
        <p className="mt-3 text-xs text-gray-400">
          {trip.dates.start} — {trip.dates.end}
        </p>
      </div>
    </Link>
  );
}
