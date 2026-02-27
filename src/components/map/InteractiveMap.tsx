'use client';

import { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { useTranslations } from 'next-intl';
import 'leaflet/dist/leaflet.css';

import type { Attraction, Itinerary, Restaurant } from '@/types';
import { useTripConfig } from '@/config/trip-context';
import { findCity } from '@/lib/city-colors';
import { createCityMarkerIcon, createRestaurantMarkerIcon, calculateBounds } from './map-utils';
import { renderAttractionPopup, renderRestaurantPopup } from './MapPopup';
import MapFilters from './MapFilters';
import MapLegend from './MapLegend';
import MapRoute from './MapRoute';

interface InteractiveMapProps {
  attractions: Attraction[];
  itinerary: Itinerary | null;
  restaurants: Restaurant[];
  locale: string;
  tripSlug: string;
}

function MapBoundsUpdater({ coords }: { coords: { lat: number; lng: number }[] }) {
  const map = useMap();

  useEffect(() => {
    const bounds = calculateBounds(coords);
    if (bounds) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [coords, map]);

  return null;
}

export default function InteractiveMap({
  attractions,
  itinerary,
  restaurants,
  locale,
  tripSlug,
}: InteractiveMapProps) {
  const t = useTranslations();
  const config = useTripConfig();

  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');
  const [showRestaurants, setShowRestaurants] = useState(false);
  const [showRoute, setShowRoute] = useState(true);

  const totalDays = itinerary?.days.length ?? 0;

  // Build day -> attractionIds mapping
  const dayAttractionIds = useMemo(() => {
    if (!itinerary) return new Map<number, string[]>();
    const map = new Map<number, string[]>();
    for (const day of itinerary.days) {
      map.set(day.dayNumber, day.activities.map((a) => a.attractionId));
    }
    return map;
  }, [itinerary]);

  // Get the city for a selected day
  const dayCity = useMemo(() => {
    if (selectedDay === 'all' || !itinerary) return null;
    const day = itinerary.days.find((d) => d.dayNumber === selectedDay);
    return day?.city ?? null;
  }, [selectedDay, itinerary]);

  // When selecting a day, auto-set the city filter
  const handleDayChange = (day: number | 'all') => {
    setSelectedDay(day);
    if (day !== 'all' && itinerary) {
      const dayData = itinerary.days.find((d) => d.dayNumber === day);
      if (dayData) {
        setSelectedCity(dayData.city);
      }
    } else {
      setSelectedCity('all');
    }
  };

  // Filter attractions
  const filteredAttractions = useMemo(() => {
    let filtered = attractions;

    if (selectedCity !== 'all') {
      filtered = filtered.filter((a) => a.city === selectedCity);
    }

    if (selectedDay !== 'all') {
      const ids = dayAttractionIds.get(selectedDay) ?? [];
      filtered = filtered.filter((a) => ids.includes(a.id));
    }

    return filtered;
  }, [attractions, selectedCity, selectedDay, dayAttractionIds]);

  // Filter restaurants by city
  const filteredRestaurants = useMemo(() => {
    if (!showRestaurants) return [];
    if (selectedCity !== 'all') {
      return restaurants.filter((r) => r.city === selectedCity);
    }
    return restaurants;
  }, [restaurants, showRestaurants, selectedCity]);

  // Route coordinates for selected day
  const routeCoords = useMemo(() => {
    if (selectedDay === 'all' || !showRoute) return [];
    const ids = dayAttractionIds.get(selectedDay) ?? [];
    return ids
      .map((id) => attractions.find((a) => a.id === id))
      .filter((a): a is Attraction => !!a)
      .map((a) => a.coordinates);
  }, [selectedDay, showRoute, dayAttractionIds, attractions]);

  // Route color from the day's city
  const routeColor = useMemo(() => {
    if (!dayCity) return '#6b7280';
    const city = findCity(config.cities, dayCity);
    return city?.color ?? '#6b7280';
  }, [dayCity, config.cities]);

  // Coordinates for bounds fitting
  const boundsCoords = useMemo(() => {
    const coords = filteredAttractions.map((a) => a.coordinates);
    if (showRestaurants) {
      coords.push(...filteredRestaurants.map((r) => r.coordinates));
    }
    return coords;
  }, [filteredAttractions, filteredRestaurants, showRestaurants]);

  // Default center (center of all attractions, or first city)
  const defaultCenter = useMemo(() => {
    if (config.cities.length > 0) {
      return config.cities[0].coordinates;
    }
    return { lat: 37.5, lng: -5.0 };
  }, [config.cities]);

  // Marker icons cache
  const markerIcons = useMemo(() => {
    const icons: Record<string, L.DivIcon> = {};
    for (const city of config.cities) {
      icons[city.id] = createCityMarkerIcon(city.color);
    }
    return icons;
  }, [config.cities]);

  const restaurantIcons = useMemo(() => {
    const icons: Record<string, L.DivIcon> = {};
    for (const city of config.cities) {
      icons[city.id] = createRestaurantMarkerIcon(city.color);
    }
    return icons;
  }, [config.cities]);

  return (
    <div className="space-y-4">
      <MapFilters
        selectedCity={selectedCity}
        selectedDay={selectedDay}
        showRestaurants={showRestaurants}
        showRoute={showRoute}
        totalDays={totalDays}
        onCityChange={setSelectedCity}
        onDayChange={handleDayChange}
        onRestaurantToggle={() => setShowRestaurants(!showRestaurants)}
        onRouteToggle={() => setShowRoute(!showRoute)}
      />

      <div className="relative">
        <MapContainer
          center={[defaultCenter.lat, defaultCenter.lng]}
          zoom={8}
          className="h-[500px] md:h-[600px] lg:h-[70vh] w-full rounded-lg shadow-md z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapBoundsUpdater coords={boundsCoords} />

          {/* Attraction markers with clustering */}
          <MarkerClusterGroup chunkedLoading>
            {filteredAttractions.map((attraction) => {
              const city = findCity(config.cities, attraction.city);
              const icon = markerIcons[attraction.city] ?? createCityMarkerIcon('#6b7280');
              return (
                <Marker
                  key={attraction.id}
                  position={[attraction.coordinates.lat, attraction.coordinates.lng]}
                  icon={icon}
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
          </MarkerClusterGroup>

          {/* Restaurant markers (not clustered) */}
          {filteredRestaurants.map((restaurant) => {
            const city = findCity(config.cities, restaurant.city);
            const icon = restaurantIcons[restaurant.city] ?? createRestaurantMarkerIcon('#6b7280');
            return (
              <Marker
                key={`restaurant-${restaurant.id}`}
                position={[restaurant.coordinates.lat, restaurant.coordinates.lng]}
                icon={icon}
              >
                <Popup>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: renderRestaurantPopup({ restaurant, city, locale }),
                    }}
                  />
                </Popup>
              </Marker>
            );
          })}

          {/* Day route */}
          {routeCoords.length >= 2 && (
            <MapRoute coordinates={routeCoords} color={routeColor} />
          )}
        </MapContainer>

        {/* Legend overlay */}
        <div className="absolute top-3 right-3 z-[1000]">
          <MapLegend />
        </div>
      </div>
    </div>
  );
}
