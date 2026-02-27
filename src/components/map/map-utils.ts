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
 * Create a colored SVG teardrop marker icon with a number inside.
 * Used by the planner view for sequential activity markers.
 */
export function createNumberedMarkerIcon(color: string, number: number): L.DivIcon {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z" fill="${color}" stroke="white" stroke-width="2"/>
    <text x="14" y="18" text-anchor="middle" fill="white" font-size="13" font-weight="bold" font-family="Arial, sans-serif">${number}</text>
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
 * Create a photo thumbnail marker icon with a number badge.
 * Shows the attraction image as a square thumbnail with a city-colored border.
 */
export function createPhotoMarkerIcon(
  thumbnail: string,
  color: string,
  number: number,
  isHighlighted: boolean = false
): L.DivIcon {
  const size = isHighlighted ? 56 : 44;
  const badgeSize = isHighlighted ? 22 : 18;
  const fontSize = isHighlighted ? 12 : 10;
  const borderWidth = isHighlighted ? 4 : 3;
  const shadow = isHighlighted
    ? '0 4px 12px rgba(0,0,0,0.4)'
    : '0 2px 6px rgba(0,0,0,0.3)';

  const html = `<div class="photo-marker" style="
    width: ${size}px;
    height: ${size}px;
    border-radius: 6px;
    border: ${borderWidth}px solid ${color};
    background-image: url('${thumbnail}');
    background-size: cover;
    background-position: center;
    box-shadow: ${shadow};
    position: relative;
    transition: transform 0.2s;
  ">
    <span style="
      position: absolute;
      top: -${badgeSize / 2 + 1}px;
      right: -${badgeSize / 2 + 1}px;
      width: ${badgeSize}px;
      height: ${badgeSize}px;
      background: ${color};
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: ${fontSize}px;
      font-weight: 700;
      font-family: Arial, sans-serif;
      border: 2px solid white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
      line-height: 1;
    ">${number}</span>
  </div>`;

  return L.divIcon({
    html,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

/**
 * Create a small circle marker icon for meal locations on the planner map.
 */
export function createMealMarkerIcon(color: string): L.DivIcon {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2" opacity="0.9"/>
    <text x="12" y="16.5" text-anchor="middle" fill="white" font-size="13" font-family="Arial, sans-serif">🍽</text>
  </svg>`;

  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
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
