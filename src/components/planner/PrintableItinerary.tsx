'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useTripConfig } from '@/config/trip-context';
import { findCity } from '@/lib/city-colors';
import type { Itinerary, Attraction } from '@/types';

interface PrintableItineraryProps {
  itinerary: Itinerary;
  attractions: Attraction[];
}

export default function PrintableItinerary({ itinerary, attractions }: PrintableItineraryProps) {
  const t = useTranslations();
  const locale = useLocale() as 'nl' | 'en';
  const config = useTripConfig();

  const attractionMap = new Map(attractions.map((a) => [a.id, a]));

  return (
    <div className="print-only">
      <h1 className="text-2xl font-bold mb-1">
        {itinerary.trip.title[locale]}
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        {itinerary.trip.startDate} — {itinerary.trip.endDate}
      </p>

      {itinerary.days.map((day) => {
        const city = findCity(config.cities, day.city);
        const cityName = city?.name[locale] ?? day.city;

        return (
          <div key={day.dayNumber} className="print-day mb-6">
            <h2 className="text-lg font-bold mb-1">
              {t('itinerary.day')} {day.dayNumber} — {cityName}
            </h2>
            <p className="text-sm text-gray-600 mb-3">{day.title[locale]}</p>

            <table className="w-full text-sm mb-3">
              <tbody>
                {day.activities.map((activity, i) => {
                  const attraction = activity.attractionId
                    ? attractionMap.get(activity.attractionId)
                    : undefined;
                  const name = attraction?.name ?? activity.notes?.[locale] ?? t('planner.activity');

                  return (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-1.5 pr-3 text-gray-500 w-16 align-top">
                        {activity.time}
                      </td>
                      <td className="py-1.5 pr-3 font-medium">{name}</td>
                      <td className="py-1.5 text-gray-500 text-right w-16">
                        {activity.duration}min
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {day.meals.length > 0 && (
              <div className="text-sm text-gray-600">
                <strong>{t('itinerary.meals')}:</strong>{' '}
                {day.meals.map((m) => `${t(`itinerary.${m.type}`)} ${m.time}${m.restaurantName ? ` (${m.restaurantName})` : ''}`).join(' | ')}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
