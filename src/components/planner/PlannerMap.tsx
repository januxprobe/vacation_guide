'use client';

import { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useTranslations, useLocale } from 'next-intl';
import 'leaflet/dist/leaflet.css';

import type { Attraction, ItineraryDay, Restaurant } from '@/types';
import { useTripConfig } from '@/config/trip-context';
import { findCity } from '@/lib/city-colors';
import {
  createNumberedMarkerIcon,
  createRestaurantMarkerIcon,
  calculateBounds,
} from '@/components/map/map-utils';
import { renderAttractionPopup, renderRestaurantPopup } from '@/components/map/MapPopup';
import MapRoute from '@/components/map/MapRoute';
import MapLegend from '@/components/map/MapLegend';

interface PlannerMapProps {
  day: ItineraryDay;
  attractions: Attraction[];
  restaurants: Restaurant[];
  showRestaurants: boolean;
  showRoute: boolean;
  highlightedActivityId: string | null;
  onMarkerClick: (attractionId: string) => void;
  locale: string;
  tripSlug: string;
}

/** Child component that can call useMap() to get imperativehandle on the map */
function MapController({
  highlightedActivityId,
  attractions,
  activityIds,
}: {
  highlightedActivityId: string | null;
  attractions: Attraction[];
  activityIds: string[];
}) {
  const map = useMap();

  // Fly to highlighted marker
  useEffect(() => {
    if (!highlightedActivityId) return;
    const attraction = attractions.find((a) => a.id === highlightedActivityId);
    if (attraction) {
      map.flyTo([attraction.coordinates.lat, attraction.coordinates.lng], 15, {
        duration: 0.8,
      });
    }
  }, [highlightedActivityId, attractions, map]);

  // Fit bounds when day changes
  useEffect(() => {
    const coords = activityIds
      .map((id) => attractions.find((a) => a.id === id))
      .filter((a): a is Attraction => !!a)
      .map((a) => a.coordinates);

    const bounds = calculateBounds(coords);
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [activityIds, attractions, map]);

  return null;
}

export default function PlannerMap({
  day,
  attractions,
  restaurants,
  showRestaurants,
  showRoute,
  highlightedActivityId,
  onMarkerClick,
  locale,
  tripSlug,
}: PlannerMapProps) {
  const t = useTranslations();
  const config = useTripConfig();

  const city = findCity(config.cities, day.city);
  const cityColor = city?.color ?? '#6b7280';

  const activityIds = day.activities.map((a) => a.attractionId);

  // Map activities to attractions with their sequence number
  const dayAttractions = useMemo(() => {
    return activityIds
      .map((id, index) => {
        const attraction = attractions.find((a) => a.id === id);
        return attraction ? { attraction, index } : null;
      })
      .filter((item): item is { attraction: Attraction; index: number } => item !== null);
  }, [activityIds, attractions]);

  // Route coordinates
  const routeCoords = useMemo(() => {
    if (!showRoute) return [];
    return dayAttractions.map((item) => item.attraction.coordinates);
  }, [showRoute, dayAttractions]);

  // Filtered restaurants for this day's city
  const filteredRestaurants = useMemo(() => {
    if (!showRestaurants) return [];
    return restaurants.filter((r) => r.city === day.city);
  }, [showRestaurants, restaurants, day.city]);

  // Restaurant icons
  const restaurantIcon = useMemo(() => {
    return createRestaurantMarkerIcon(cityColor);
  }, [cityColor]);

  // Default center
  const defaultCenter = useMemo(() => {
    if (dayAttractions.length > 0) {
      return dayAttractions[0].attraction.coordinates;
    }
    return city?.coordinates ?? { lat: 37.5, lng: -5.0 };
  }, [dayAttractions, city]);

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[defaultCenter.lat, defaultCenter.lng]}
        zoom={14}
        className="w-full h-full rounded-lg z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController
          highlightedActivityId={highlightedActivityId}
          attractions={attractions}
          activityIds={activityIds}
        />

        {/* Numbered attraction markers */}
        {dayAttractions.map(({ attraction, index }) => {
          const icon = createNumberedMarkerIcon(cityColor, index + 1);
          return (
            <Marker
              key={attraction.id}
              position={[attraction.coordinates.lat, attraction.coordinates.lng]}
              icon={icon}
              eventHandlers={{
                click: () => onMarkerClick(attraction.id),
              }}
            >
              <Popup>
                <div
                  dangerouslySetInnerHTML={{
                    __html: renderAttractionPopup({
                      attraction,
                      city,
                      locale,
                      tripSlug,
                      detailLabel: t('map.openDetail'),
                    }),
                  }}
                />
              </Popup>
            </Marker>
          );
        })}

        {/* Restaurant markers */}
        {filteredRestaurants.map((restaurant) => (
          <Marker
            key={`restaurant-${restaurant.id}`}
            position={[restaurant.coordinates.lat, restaurant.coordinates.lng]}
            icon={restaurantIcon}
          >
            <Popup>
              <div
                dangerouslySetInnerHTML={{
                  __html: renderRestaurantPopup({ restaurant, city, locale }),
                }}
              />
            </Popup>
          </Marker>
        ))}

        {/* Day route polyline */}
        {routeCoords.length >= 2 && (
          <MapRoute coordinates={routeCoords} color={cityColor} />
        )}
      </MapContainer>

      {/* Legend overlay */}
      <div className="absolute top-3 right-3 z-[1000]">
        <MapLegend />
      </div>
    </div>
  );
}
