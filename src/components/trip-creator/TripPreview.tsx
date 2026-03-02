'use client';

import { useTranslations } from 'next-intl';
import { MapPin, Calendar, Navigation, Check, Circle } from 'lucide-react';
import type { TripReadiness } from './TripChat';

interface TripPreviewProps {
  tripData: Record<string, unknown> | null;
  acceptedAttractions: Record<string, unknown>[];
  readiness: TripReadiness;
}

function ReadinessItem({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {done ? (
        <Check className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
      ) : (
        <Circle className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
      )}
      <span className={done ? 'text-gray-700' : 'text-gray-400'}>{label}</span>
    </div>
  );
}

export default function TripPreview({ tripData, acceptedAttractions, readiness }: TripPreviewProps) {
  const t = useTranslations('tripCreator');

  const hasAnyReadiness = readiness.destination || readiness.dates || readiness.travelers || readiness.cities;

  if (!tripData && acceptedAttractions.length === 0 && !hasAnyReadiness) {
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
      {/* Readiness checklist */}
      <div>
        <h3 className="font-semibold text-gray-900 text-sm mb-2">
          {t('readiness.notReady')}
        </h3>
        <div className="space-y-1">
          <ReadinessItem label={t('readiness.destination')} done={readiness.destination} />
          <ReadinessItem label={t('readiness.dates')} done={readiness.dates} />
          <ReadinessItem label={t('readiness.travelers')} done={readiness.travelers} />
          <ReadinessItem label={t('readiness.cities')} done={readiness.cities} />
          <ReadinessItem
            label={`${t('readiness.attractions')} (${acceptedAttractions.length})`}
            done={acceptedAttractions.length >= 3}
          />
        </div>
        {readiness.destination && readiness.dates && readiness.travelers && readiness.cities && tripData && (
          <p className="mt-2 text-xs font-medium text-green-700">{t('readiness.ready')}</p>
        )}
      </div>

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
