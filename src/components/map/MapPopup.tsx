'use client';

import type { Attraction, Restaurant } from '@/types';
import type { CityConfig } from '@/config/trip-config';
import { hexToRgba } from '@/lib/city-colors';

interface AttractionPopupProps {
  attraction: Attraction;
  city: CityConfig | undefined;
  locale: string;
  tripSlug: string;
  detailLabel: string;
}

export function renderAttractionPopup({
  attraction,
  city,
  locale,
  tripSlug,
  detailLabel,
}: AttractionPopupProps): string {
  const color = city?.color ?? '#6b7280';
  const cityName = city?.name[locale as 'nl' | 'en'] ?? attraction.city;
  const description = attraction.description[locale as 'nl' | 'en'];
  const duration = attraction.duration >= 60
    ? `${Math.floor(attraction.duration / 60)}h${attraction.duration % 60 > 0 ? ` ${attraction.duration % 60}min` : ''}`
    : `${attraction.duration}min`;
  const price = attraction.pricing.adult === 0
    ? (locale === 'nl' ? 'Gratis' : 'Free')
    : `€${attraction.pricing.adult}`;

  return `
    <div style="min-width: 200px; max-width: 280px;">
      <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
        <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; background: ${hexToRgba(color, 0.15)}; color: ${color};">
          ${cityName}
        </span>
      </div>
      <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px;">${attraction.name}</div>
      <div style="font-size: 12px; color: #6b7280; margin-bottom: 6px; line-height: 1.4;">
        ${description.length > 120 ? description.substring(0, 120) + '...' : description}
      </div>
      <div style="display: flex; gap: 12px; font-size: 12px; color: #374151; margin-bottom: 8px;">
        <span>${duration}</span>
        <span>${price}</span>
      </div>
      <a href="/${locale}/${tripSlug}/attractions/${attraction.id}"
         style="display: inline-block; padding: 4px 12px; background: ${color}; color: white; border-radius: 6px; font-size: 12px; font-weight: 500; text-decoration: none;">
        ${detailLabel}
      </a>
    </div>
  `;
}

interface RestaurantPopupProps {
  restaurant: Restaurant;
  city: CityConfig | undefined;
  locale: string;
}

export function renderRestaurantPopup({
  restaurant,
  city,
  locale,
}: RestaurantPopupProps): string {
  const color = city?.color ?? '#6b7280';
  const cityName = city?.name[locale as 'nl' | 'en'] ?? restaurant.city;
  const description = restaurant.description?.[locale as 'nl' | 'en'] ?? '';
  const cuisines = restaurant.cuisine.join(', ');

  return `
    <div style="min-width: 180px; max-width: 250px;">
      <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
        <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; background: ${hexToRgba(color, 0.15)}; color: ${color};">
          ${cityName}
        </span>
        <span style="font-size: 12px; font-weight: 600; color: #374151;">${restaurant.priceRange}</span>
      </div>
      <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px;">${restaurant.name}</div>
      <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">${cuisines}</div>
      ${description ? `<div style="font-size: 12px; color: #6b7280; line-height: 1.4;">${description.length > 100 ? description.substring(0, 100) + '...' : description}</div>` : ''}
    </div>
  `;
}
