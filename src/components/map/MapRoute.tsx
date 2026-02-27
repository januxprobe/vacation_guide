'use client';

import { Polyline } from 'react-leaflet';

interface MapRouteProps {
  coordinates: { lat: number; lng: number }[];
  color: string;
  routeGeometry?: [number, number][] | null;
}

export default function MapRoute({ coordinates, color, routeGeometry }: MapRouteProps) {
  // Use OSRM walking route if available, otherwise fall back to straight line
  if (routeGeometry && routeGeometry.length >= 2) {
    return (
      <Polyline
        positions={routeGeometry}
        pathOptions={{
          color,
          weight: 4,
          opacity: 0.8,
        }}
      />
    );
  }

  if (coordinates.length < 2) return null;

  return (
    <Polyline
      positions={coordinates.map((c) => [c.lat, c.lng] as [number, number])}
      pathOptions={{
        color,
        weight: 3,
        opacity: 0.7,
        dashArray: '8, 8',
      }}
    />
  );
}
