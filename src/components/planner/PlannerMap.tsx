'use client';

import { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import { useTranslations, useLocale } from 'next-intl';
import 'leaflet/dist/leaflet.css';

import type { Attraction, ItineraryDay, Restaurant } from '@/types';
import { useTripConfig } from '@/config/trip-context';
import { findCity } from '@/lib/city-colors';
import {
  createPhotoMarkerIcon,
  createMealMarkerIcon,
  createRestaurantMarkerIcon,
  calculateBounds,
} from '@/components/map/map-utils';
import { renderAttractionPopup, renderRestaurantPopup } from '@/components/map/MapPopup';
import MapRoute from '@/components/map/MapRoute';
import MapLegend from '@/components/map/MapLegend';
import { useWalkingRoute } from '@/hooks/useOsrmRoute';

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

/** Child component that can call useMap() to get imperative handle on the map */
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
  const currentLocale = useLocale() as 'nl' | 'en';
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

  // Route coordinates for OSRM
  const routeCoords = useMemo(() => {
    if (!showRoute) return [];
    return dayAttractions.map((item) => item.attraction.coordinates);
  }, [showRoute, dayAttractions]);

  // Fetch OSRM walking route
  const walkingRoute = useWalkingRoute(routeCoords, showRoute && routeCoords.length >= 2);

  // Meals with coordinates
  const mealsWithCoords = useMemo(() => {
    return day.meals.filter((meal) => meal.coordinates);
  }, [day.meals]);

  // Meal marker icon
  const mealIcon = useMemo(() => {
    return createMealMarkerIcon(cityColor);
  }, [cityColor]);

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

  // Meal type labels
  const mealTypeLabel = (type: string) => {
    const key = `itinerary.${type}` as const;
    return t(key);
  };

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[defaultCenter.lat, defaultCenter.lng]}
        zoom={14}
        className="w-full h-full rounded-lg z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        <MapController
          highlightedActivityId={highlightedActivityId}
          attractions={attractions}
          activityIds={activityIds}
        />

        {/* Photo thumbnail attraction markers */}
        {dayAttractions.map(({ attraction, index }) => {
          const isHighlighted = attraction.id === highlightedActivityId;
          const thumbnail = attraction.thumbnail || attraction.images?.[0] || '';
          const icon = createPhotoMarkerIcon(thumbnail, cityColor, index + 1, isHighlighted);
          return (
            <Marker
              key={attraction.id}
              position={[attraction.coordinates.lat, attraction.coordinates.lng]}
              icon={icon}
              zIndexOffset={isHighlighted ? 1000 : 0}
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
              <Tooltip
                permanent
                direction="bottom"
                offset={[0, 4]}
                className="photo-marker-tooltip"
              >
                {attraction.name}
              </Tooltip>
            </Marker>
          );
        })}

        {/* Meal location markers */}
        {mealsWithCoords.map((meal, index) => (
          <Marker
            key={`meal-${meal.type}-${index}`}
            position={[meal.coordinates!.lat, meal.coordinates!.lng]}
            icon={mealIcon}
            zIndexOffset={-100}
          >
            <Tooltip
              permanent
              direction="bottom"
              offset={[0, 2]}
              className="meal-marker-tooltip"
            >
              {mealTypeLabel(meal.type)}: {meal.restaurantName}
            </Tooltip>
          </Marker>
        ))}

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

        {/* Day route polyline (OSRM walking route or straight-line fallback) */}
        {routeCoords.length >= 2 && (
          <MapRoute
            coordinates={routeCoords}
            color={cityColor}
            routeGeometry={walkingRoute}
          />
        )}
      </MapContainer>

      {/* Legend overlay */}
      <div className="absolute top-3 right-3 z-[1000]">
        <MapLegend />
      </div>
    </div>
  );
}
