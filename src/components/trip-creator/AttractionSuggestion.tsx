'use client';

import { useTranslations } from 'next-intl';
import { MapPin, Clock, Euro, ExternalLink, Check } from 'lucide-react';
import { useState } from 'react';

interface AttractionSuggestionProps {
  data: Record<string, unknown>;
  onAccept?: () => void;
}

export default function AttractionSuggestion({ data, onAccept }: AttractionSuggestionProps) {
  const t = useTranslations('tripCreator');
  const [accepted, setAccepted] = useState(false);

  const name = (data.name as string) || 'Unknown';
  const city = (data.city as string) || '';
  const category = (data.category as string) || '';
  const priority = (data.priority as string) || '';
  const duration = (data.duration as number) || 0;
  const website = (data.website as string) || '';
  const bookingRequired = data.bookingRequired as boolean;

  const description = data.description as { nl?: string; en?: string } | undefined;
  const pricing = data.pricing as { adult?: number; student?: number } | undefined;
  const coordinates = data.coordinates as { lat?: number; lng?: number } | undefined;

  const handleAccept = () => {
    setAccepted(true);
    onAccept?.();
  };

  const thumbnail = (data.thumbnail as string) || '';

  return (
    <div className={`my-2 rounded-lg border overflow-hidden ${accepted ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'}`}>
      {thumbnail && (
        <div className="relative w-full h-32 overflow-hidden bg-gray-100">
          <img
            src={thumbnail}
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-semibold text-gray-900">{name}</h4>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
              {city && (
                <span className="capitalize">{city}</span>
              )}
              {category && (
                <>
                  <span>·</span>
                  <span className="capitalize">{category}</span>
                </>
              )}
              {priority && (
                <>
                  <span>·</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                      priority === 'essential'
                        ? 'bg-red-100 text-red-700'
                        : priority === 'recommended'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {priority}
                  </span>
                </>
              )}
            </div>
          </div>

          {onAccept && !accepted && (
            <button
              onClick={handleAccept}
              className="flex-shrink-0 px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
            >
              {t('accept')}
            </button>
          )}

          {accepted && (
            <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
              <Check className="h-3.5 w-3.5" />
              Accepted
            </span>
          )}
        </div>

        {description && (
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
            {description.en || description.nl}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
          {pricing?.adult !== undefined && (
            <span className="flex items-center gap-1">
              <Euro className="h-3.5 w-3.5" />
              {pricing.adult === 0 ? 'Free' : `€${pricing.adult}`}
              {pricing.student !== undefined && pricing.student !== pricing.adult && (
                <span className="text-gray-400">/ €{pricing.student} student</span>
              )}
            </span>
          )}
          {duration > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {duration >= 60 ? `${Math.round(duration / 60)}h` : `${duration}min`}
            </span>
          )}
          {coordinates?.lat && coordinates?.lng && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
            </span>
          )}
          {bookingRequired && (
            <span className="text-amber-600 font-medium">Booking required</span>
          )}
          {website && (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-500 hover:text-blue-700"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Website
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
