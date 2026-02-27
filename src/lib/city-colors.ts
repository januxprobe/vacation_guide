import type { CityConfig } from '@/config/trip-config';

/**
 * Get inline style for a city's background color with opacity.
 * Uses inline styles because Tailwind v4 JIT cannot handle runtime-interpolated class names.
 */
export function getCityBgStyle(city: CityConfig | undefined): React.CSSProperties {
  const color = city?.color ?? '#6b7280';
  return { backgroundColor: color };
}

/**
 * Get inline style for a city badge (light background + dark text).
 * Creates a semi-transparent version of the city color.
 */
export function getCityBadgeStyle(city: CityConfig | undefined): React.CSSProperties {
  const color = city?.color ?? '#6b7280';
  return {
    backgroundColor: hexToRgba(color, 0.1),
    color: color,
    borderColor: hexToRgba(color, 0.2),
  };
}

/**
 * Get inline style for a city gradient placeholder (when no thumbnail exists).
 */
export function getCityGradientStyle(city: CityConfig | undefined): React.CSSProperties {
  const color = city?.color ?? '#6b7280';
  const lightColor = hexToRgba(color, 0.3);
  const darkColor = hexToRgba(color, 0.6);
  return {
    background: `linear-gradient(to bottom right, ${lightColor}, ${darkColor})`,
  };
}

/**
 * Get the CSS color value for a city (e.g. for color bars, icons).
 */
export function getCityColor(city: CityConfig | undefined): string {
  return city?.color ?? '#6b7280';
}

/**
 * Find a city config by its ID from a list of cities.
 */
export function findCity(cities: CityConfig[], cityId: string): CityConfig | undefined {
  return cities.find((c) => c.id === cityId);
}

/** Convert hex color to rgba string */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
