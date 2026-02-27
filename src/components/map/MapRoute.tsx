'use client';

import { Polyline } from 'react-leaflet';

interface MapRouteProps {
  coordinates: { lat: number; lng: number }[];
  color: string;
}

export default function MapRoute({ coordinates, color }: MapRouteProps) {
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
