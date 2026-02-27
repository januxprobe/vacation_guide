'use client';

import { useTranslations } from 'next-intl';
import { MapPin, Calendar, Navigation, Check } from 'lucide-react';

interface TripPreviewProps {
  tripData: Record<string, unknown> | null;
  acceptedAttractions: Record<string, unknown>[];
}

export default function TripPreview({ tripData, acceptedAttractions }: TripPreviewProps) {
  const t = useTranslations('tripCreator');

  if (!tripData && acceptedAttractions.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-gray-400">
        {t('previewEmpty')}
      </div>
    );
  }

  const name = tripData?.name as { nl?: string; en?: string } | undefined;
  const cities = tripData?.cities as Array<{ id: string; name: { nl: string; en: string }; color: string }> | undefined;
  const dates = tripData?.dates as { start?: string; end?: string } | undefined;

  return (
    <div className="p-4 space-y-4">
      {/* Trip info */}
      {tripData && (
        <div>
          <h3 className="font-semibold text-gray-900 text-sm mb-2">
            {t('tripPreview')}
          </h3>
          {name && (
            <p className="text-sm font-medium text-gray-700">
              {name.en || name.nl}
            </p>
          )}
          {dates?.start && dates?.end && (
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
              <Calendar className="h-3.5 w-3.5" />
              {dates.start} — {dates.end}
            </p>
          )}
          {cities && cities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {cities.map((city) => (
                <span
                  key={city.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border"
                  style={{
                    borderColor: city.color,
                    color: city.color,
                  }}
                >
                  <MapPin className="h-3 w-3" />
                  {city.name.en || city.name.nl}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Accepted attractions */}
      {acceptedAttractions.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-1">
            <Navigation className="h-4 w-4" />
            {t('suggestedAttractions')} ({acceptedAttractions.length})
          </h3>
          <div className="space-y-1.5">
            {acceptedAttractions.map((attr, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-xs text-gray-600 bg-green-50 rounded px-2 py-1.5"
              >
                <Check className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                <span className="truncate">
                  {attr.name as string}
                </span>
                <span className="text-gray-400 capitalize flex-shrink-0">
                  {attr.city as string}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
