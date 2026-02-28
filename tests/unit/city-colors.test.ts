import { describe, it, expect } from 'vitest';
import {
  hexToRgba,
  getCityBgStyle,
  getCityBadgeStyle,
  getCityGradientStyle,
  getCityColor,
  findCity,
} from '@/lib/city-colors';
import type { CityConfig } from '@/config/trip-config';

const SEVILLE: CityConfig = {
  id: 'seville',
  name: { nl: 'Sevilla', en: 'Seville' },
  color: '#f97316',
  coordinates: { lat: 37.3886, lng: -5.9823 },
};

const CORDOBA: CityConfig = {
  id: 'cordoba',
  name: { nl: 'Córdoba', en: 'Cordoba' },
  color: '#dc2626',
  coordinates: { lat: 37.8882, lng: -4.7794 },
};

const CITIES: CityConfig[] = [SEVILLE, CORDOBA];

// ── hexToRgba ───────────────────────────────────────────────────────

describe('hexToRgba', () => {
  it('converts hex to rgba with alpha 1', () => {
    expect(hexToRgba('#ff0000', 1)).toBe('rgba(255, 0, 0, 1)');
  });

  it('converts hex to rgba with alpha 0.5', () => {
    expect(hexToRgba('#00ff00', 0.5)).toBe('rgba(0, 255, 0, 0.5)');
  });

  it('converts hex to rgba with alpha 0', () => {
    expect(hexToRgba('#0000ff', 0)).toBe('rgba(0, 0, 255, 0)');
  });

  it('handles real city color', () => {
    expect(hexToRgba('#f97316', 0.1)).toBe('rgba(249, 115, 22, 0.1)');
  });
});

// ── getCityBgStyle ──────────────────────────────────────────────────

describe('getCityBgStyle', () => {
  it('returns backgroundColor from city config', () => {
    const style = getCityBgStyle(SEVILLE);
    expect(style.backgroundColor).toBe('#f97316');
  });

  it('returns fallback gray when city is undefined', () => {
    const style = getCityBgStyle(undefined);
    expect(style.backgroundColor).toBe('#6b7280');
  });
});

// ── getCityBadgeStyle ───────────────────────────────────────────────

describe('getCityBadgeStyle', () => {
  it('returns semi-transparent bg, solid text, and border', () => {
    const style = getCityBadgeStyle(SEVILLE);
    expect(style.backgroundColor).toBe(hexToRgba('#f97316', 0.1));
    expect(style.color).toBe('#f97316');
    expect(style.borderColor).toBe(hexToRgba('#f97316', 0.2));
  });

  it('uses fallback gray for undefined city', () => {
    const style = getCityBadgeStyle(undefined);
    expect(style.color).toBe('#6b7280');
  });
});

// ── getCityGradientStyle ────────────────────────────────────────────

describe('getCityGradientStyle', () => {
  it('returns linear-gradient background', () => {
    const style = getCityGradientStyle(CORDOBA);
    expect(style.background).toContain('linear-gradient');
    expect(style.background).toContain(hexToRgba('#dc2626', 0.3));
    expect(style.background).toContain(hexToRgba('#dc2626', 0.6));
  });

  it('uses fallback gray for undefined city', () => {
    const style = getCityGradientStyle(undefined);
    expect(style.background).toContain(hexToRgba('#6b7280', 0.3));
  });
});

// ── getCityColor ────────────────────────────────────────────────────

describe('getCityColor', () => {
  it('returns city hex color', () => {
    expect(getCityColor(SEVILLE)).toBe('#f97316');
  });

  it('returns fallback gray for undefined', () => {
    expect(getCityColor(undefined)).toBe('#6b7280');
  });
});

// ── findCity ────────────────────────────────────────────────────────

describe('findCity', () => {
  it('finds city by ID', () => {
    expect(findCity(CITIES, 'seville')).toBe(SEVILLE);
  });

  it('finds another city by ID', () => {
    expect(findCity(CITIES, 'cordoba')).toBe(CORDOBA);
  });

  it('returns undefined for missing ID', () => {
    expect(findCity(CITIES, 'granada')).toBeUndefined();
  });

  it('returns undefined for empty array', () => {
    expect(findCity([], 'seville')).toBeUndefined();
  });
});
