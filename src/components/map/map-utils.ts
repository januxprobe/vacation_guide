import L from 'leaflet';

/**
 * Create a colored SVG teardrop marker icon for attractions.
 * Uses inline SVG so city colors from TripConfig work at runtime.
 */
export function createCityMarkerIcon(color: string): L.DivIcon {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z" fill="${color}" stroke="white" stroke-width="2"/>
    <circle cx="14" cy="14" r="6" fill="white" opacity="0.9"/>
  </svg>`;

  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -40],
  });
}

/**
 * Create a smaller colored circle marker icon for restaurants.
 */
export function createRestaurantMarkerIcon(color: string): L.DivIcon {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
    <circle cx="10" cy="10" r="8" fill="${color}" stroke="white" stroke-width="2" opacity="0.85"/>
    <text x="10" y="14" text-anchor="middle" fill="white" font-size="10" font-weight="bold">R</text>
  </svg>`;

  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
  });
}

/**
 * Calculate bounds that fit all given coordinates with padding.
 */
export function calculateBounds(coords: { lat: number; lng: number }[]): L.LatLngBounds | null {
  if (coords.length === 0) return null;

  const lats = coords.map((c) => c.lat);
  const lngs = coords.map((c) => c.lng);

  return L.latLngBounds(
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)]
  );
}
